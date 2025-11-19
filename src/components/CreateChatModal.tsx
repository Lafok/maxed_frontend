import React, { useState, useEffect, useRef } from 'react';
import GenericInput from './GenericInput';
import Button from './Button';
import api from '../services/api';
import clsx from 'clsx';
import Spinner from './Spinner';

// --- Утилиты для аватара ---
const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Avatar = ({ name }: { name: string }) => (
    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0">
        {getInitials(name)}
    </div>
);

// --- Основной компонент ---
interface User {
    id: number; // Изменено на number
    username: string;
    email: string; // Добавлено, так как есть в ответе
    role: string; // Добавлено, так как есть в ответе
}

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateChat: (userId: number) => void; // Изменено на number
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) setIsMounted(true);
        else {
            const timer = setTimeout(() => setIsMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setError(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        debounceTimeout.current = setTimeout(async () => {
            try {
                const response = await api.get('/users/search', { params: { name: searchQuery } });
                setSearchResults(response.data);
                if (response.data.length === 0) setError('No users found.');
            } catch (err) {
                console.error('Error searching users:', err);
                setError('An error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchQuery]);

    const handleClose = () => {
        setSearchQuery('');
        onClose();
    };

    if (!isMounted) return null;

    return (
        <div
            className={clsx(
                "fixed inset-0 z-50 flex justify-center items-start pt-20 sm:pt-0 sm:items-center",
                !isOpen && "pointer-events-none"
            )}
        >
            <div
                className={clsx(
                    "absolute inset-0 bg-black/40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={handleClose}
            />
            
            <div
                className={clsx(
                    "relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">New Conversation</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Find someone to start a chat with.</p>
                    
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <GenericInput
                            type="text"
                            placeholder="Search by username"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-200 dark:border-gray-600 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-72 min-h-[10rem] overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                    {isLoading && <div className="flex justify-center items-center h-full pt-10"><Spinner /></div>}
                    {error && !isLoading && <p className="text-center text-gray-500 pt-10">{error}</p>}
                    {!isLoading && searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-4 p-3 mx-2 my-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => { onCreateChat(user.id); handleClose(); }}
                        >
                            <Avatar name={user.username} />
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{user.username}</span>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 flex justify-end rounded-b-xl">
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateChatModal;

import React, { useState, useEffect, useRef } from 'react';
import GenericInput from './GenericInput'; // Предполагается, что GenericInput хорошо стилизован
import Button from './Button'; // Предполагается, что Button хорошо стилизован
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
    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
        {getInitials(name)}
    </div>
);

// --- Основной компонент ---
interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateChat: (userId: number) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setSearchQuery(''); // Сбрасываем поиск при открытии
            setSearchResults([]);
            setError(null);
        } else {
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
                // Если нет результатов, но запрос был, устанавливаем ошибку
                if (response.data.length === 0) {
                    setError('No users found matching your search.');
                }
            } catch (err) {
                console.error('Error searching users:', err);
                setError('An error occurred while searching. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }, 300); // Дебаунс 300ms
        
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchQuery]);

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
        onClose();
    };

    if (!isMounted) return null;

    return (
        <div
            className={clsx(
                "fixed inset-0 z-50 flex justify-center items-start pt-10 sm:pt-0 sm:items-center", // Немного опустил на мобильных
                !isOpen && "pointer-events-none"
            )}
        >
            <div
                className={clsx(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300", // Затемнение фона
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={handleClose}
            />
            
            <div
                className={clsx(
                    "relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out", // max-w-lg для большей ширины
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700"> {/* Добавил границу снизу */}
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">New Conversation</h2> {/* Увеличил размер заголовка */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Find someone to start a chat with.</p>
                    
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <GenericInput
                            type="text"
                            placeholder="Search by username"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full bg-gray-100 dark:bg-gray-700 dark:text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-lg py-2" // Улучшил стили инпута
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-80 min-h-[10rem] overflow-y-auto"> {/* Увеличил max-h */}
                    {isLoading && (
                        <div className="flex justify-center items-center h-full py-8">
                            <Spinner />
                        </div>
                    )}
                    {!isLoading && error && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8 px-4">{error}</p>
                    )}
                    {!isLoading && !error && searchResults.length === 0 && searchQuery.trim() !== '' && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8 px-4">No users found matching "{searchQuery}".</p>
                    )}
                    {!isLoading && !error && searchResults.length === 0 && searchQuery.trim() === '' && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8 px-4">Start typing to find users.</p>
                    )}
                    {!isLoading && !error && searchResults.length > 0 && searchResults.slice(0, 5).map((user) => ( // Ограничение до 5 результатов
                        <div
                            key={user.id}
                            className="flex items-center gap-4 p-3 mx-4 my-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => { onCreateChat(user.id); handleClose(); }}
                        >
                            <Avatar name={user.username} />
                            <span className="font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
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

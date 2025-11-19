import React, { useState, useEffect, useRef } from 'react';
import Input from './Input'; // Используем оригинальный Input
import Button from './Button';
import api from '../services/api';

interface User {
    id: string;
    username: string;
}

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateChat: (userId: string) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

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
                if (response.data.length === 0) {
                    setError('No users found.');
                }
            } catch (err) {
                console.error('Error searching users:', err);
                setError('Error searching. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [searchQuery]);

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Create a new chat</h2>
                <div className="mb-4">
                    {/* Здесь Input используется как обычный инпут, что вызывало ошибку ранее */}
                    <Input
                        name="search" // Добавляем name, так как Input его ожидает
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="flex-grow"
                        // autoFocus // Убираем autoFocus, так как Input его не поддерживает
                    />
                </div>
                <div className="max-h-60 min-h-[5rem] overflow-y-auto">
                    {isLoading && <p className="text-center text-gray-500 pt-4">Searching...</p>}
                    {error && !isLoading && <p className="text-red-500 text-center pt-4">{error}</p>}
                    {!isLoading && searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={() => {
                                onCreateChat(user.id);
                                handleClose();
                            }}
                        >
                            <span>{user.username}</span>
                            <Button size="sm">Message</Button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateChatModal;

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Chat, StatusUpdateMessage, Message, UserUpdateMessage, User } from '../types';
import api from '../services/api';
import { StompSubscription } from '@stomp/stompjs';
import SendMediaModal from '../components/SendMediaModal';
import MediaViewer from '../components/MediaViewer';
import searchService, { SearchResultMessage } from '../services/searchService';
import Sidebar from '../components/Sidebar';

const ChatPage = () => {
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const { user, token } = useAuth();

    const [isDragging, setIsDragging] = useState(false);
    const [modalFiles, setModalFiles] = useState<File[]>([]);
    const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
    const dragCounter = useRef(0);

    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const subscriptions = useRef<Map<string, StompSubscription>>(new Map());

    const activeChat = chats.find(chat => chat.id === activeChatId);

    const fetchChats = useCallback(async () => {
        try {
            const [chatsResponse, usersResponse] = await Promise.all([
                api.get<Chat[]>('/chats'),
                api.get<User[]>('/users')
            ]);
            
            const usersById = new Map(usersResponse.data.map(u => [u.id, u]));

            const chatsWithAvatars = chatsResponse.data.map(chat => ({
                ...chat,
                participants: chat.participants.map(p => {
                    const userWithAvatar = usersById.get(p.id);
                    return {
                        ...p,
                        avatarUrl: userWithAvatar?.avatarUrl || p.avatarUrl,
                    };
                })
            }));

            setChats(chatsWithAvatars);
        } catch (error) {
            console.error('Failed to fetch chats or users', error);
        }
    }, []);

    useEffect(() => {
        if (token) {
            websocketService.connect(token);
            fetchChats();
        }
        return () => {
            websocketService.disconnect();
        };
    }, [token, fetchChats]);

    const subscribeToMessages = useCallback((chatId: number) => {
        const topic = `/topic/chats.${chatId}`;
        if (subscriptions.current.has(topic)) return;

        websocketService.subscribe(topic, (newMessage: Message) => {
            setChats(prevChats => {
                const chatToUpdate = prevChats.find(c => c.id === chatId);
                if (!chatToUpdate) return prevChats;

                const updatedChat = { ...chatToUpdate, latestMessage: newMessage };
                const otherChats = prevChats.filter(c => c.id !== chatId);
                return [updatedChat, ...otherChats];
            });

            if (chatId === activeChatId) {
                setMessages(prev => [...prev, newMessage]);
            }
        }).then(sub => {
            if (sub) {
                subscriptions.current.set(topic, sub);
            }
        });
    }, [activeChatId]);

    useEffect(() => {
        chats.forEach(chat => subscribeToMessages(chat.id));
    }, [chats, subscribeToMessages]);

    useEffect(() => {
        if (!user?.id || !token) return;

        const setupGlobalSubscriptions = async () => {
            const presenceTopic = '/topic/presence';
            const presenceSub = await websocketService.subscribe(presenceTopic, (message: StatusUpdateMessage) => {
                setChats(prevChats =>
                    prevChats.map(chat => {
                        const participantToUpdate = chat.participants.find(p => p.id === message.userId);
                        if (participantToUpdate) {
                            const updatedParticipants = chat.participants.map(p =>
                                p.id === message.userId ? { ...p, isOnline: message.isOnline } : p
                            );
                            return { ...chat, participants: updatedParticipants };
                        }
                        return chat;
                    })
                );
            });
            if (presenceSub) subscriptions.current.set(presenceTopic, presenceSub);

            const newChatTopic = `/topic/users.${user.id}.chats`;
            
            const newChatSub = await websocketService.subscribe(newChatTopic, (newChat: Chat) => {
                console.log('New chat received via WebSocket:', newChat);
                
                setChats(prevChats => {
                    if (prevChats.find(c => c.id === newChat.id)) {
                        return prevChats;
                    }
                    
                    subscribeToMessages(newChat.id);
                    
                    return [newChat, ...prevChats];
                });
            });
            if (newChatSub) subscriptions.current.set(newChatTopic, newChatSub);

            const userUpdateTopic = '/topic/users.updates';
            const userUpdateSub = await websocketService.subscribe(userUpdateTopic, (message: UserUpdateMessage) => {
                setChats(prevChats =>
                    prevChats.map(chat => {
                        const participantToUpdate = chat.participants.find(p => p.id === message.id);
                        if (participantToUpdate) {
                            const updatedParticipants = chat.participants.map(p =>
                                p.id === message.id ? { ...p, username: message.username, avatarUrl: message.avatarUrl, isOnline: message.isOnline } : p
                            );
                            return { ...chat, participants: updatedParticipants };
                        }
                        return chat;
                    })
                );
            });
            if (userUpdateSub) subscriptions.current.set(userUpdateTopic, userUpdateSub);
        };

        setupGlobalSubscriptions();

        return () => {
            console.log('Cleaning up global subscriptions');
            subscriptions.current.forEach(sub => sub.unsubscribe());
            subscriptions.current.clear();
        };
    }, [user?.id, token, subscribeToMessages]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!activeChat) return;
        
        if (query.trim() === '') {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results: SearchResultMessage[] = await searchService.searchMessages(activeChat.id, query);
            
            const hydratedResults: Message[] = results.map(message => {
                const author = activeChat.participants.find(p => p.id === message.authorId);
                return {
                    id: parseInt(message.id, 10),
                    content: message.content,
                    timestamp: message.timestamp,
                    author: author || { id: message.authorId, username: 'Unknown User', isOnline: false },
                    type: 'TEXT',
                    status: 'SENT' // Assuming default status
                };
            });

            setSearchResults(hydratedResults);
        } catch (error) {
            console.error('Search failed', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleToggleSearch = () => {
        setIsSearchVisible(prev => !prev);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items?.length > 0) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files?.length > 0 && activeChatId) {
            setModalFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const handleSetMessages = useCallback((newMessages: Message[] | ((prev: Message[]) => Message[])) => {
        setMessages(newMessages);
    }, []);

    return (
        <div
            className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Sidebar />
            <ChatList
                chats={chats}
                setChats={setChats}
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
                isSearchVisible={isSearchVisible}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearch}
                searchResults={searchResults}
                isSearching={isSearching}
                onCloseSearch={handleToggleSearch}
            />
            <MessageArea
                activeChat={activeChat}
                messages={messages}
                setMessages={handleSetMessages}
                isDragging={isDragging}
                openMediaModal={(files) => setModalFiles(files)}
                onMediaClick={(message) => setViewingMessage(message)}
                onSearchClick={handleToggleSearch}
            />
            {modalFiles.length > 0 && activeChatId && (
                <SendMediaModal
                    initialFiles={modalFiles}
                    activeChatId={activeChatId}
                    onClose={() => setModalFiles([])}
                />
            )}
            {viewingMessage && (
                <MediaViewer
                    message={viewingMessage}
                    onClose={() => setViewingMessage(null)}
                />
            )}
        </div>
    );
};

export default ChatPage;

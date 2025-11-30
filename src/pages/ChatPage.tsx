import { useState, useEffect, useRef } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Chat, StatusUpdateMessage, Message } from '../types';
import api from '../services/api';
import { StompSubscription } from '@stomp/stompjs';
import SendMediaModal from '../components/SendMediaModal';
import MediaViewer from '../components/MediaViewer';

const ChatPage = () => {
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const { user, token } = useAuth();

    const [isDragging, setIsDragging] = useState(false);
    const [modalFiles, setModalFiles] = useState<File[]>([]);
    const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
    const dragCounter = useRef(0);

    const fetchChats = async () => {
        try {
            const response = await api.get('/chats');
            setChats(response.data);
        } catch (error) {
            console.error('Failed to fetch chats', error);
        }
    };

    useEffect(() => {
        if (token) {
            websocketService.connect(token);
            fetchChats();
        }
        return () => {
            websocketService.disconnect();
        };
    }, [token]);

    useEffect(() => {
        if (!user?.sub) return;
        let subscription: StompSubscription | null = null;
        const setupSubscription = async () => {
            subscription = await websocketService.subscribe('/topic/presence', (message: StatusUpdateMessage) => {
                setChats(prevChats =>
                    prevChats.map(chat => {
                        const partner = chat.participants.find(p => p.id === message.userId && p.username !== user?.sub);
                        if (partner) {
                            const updatedPartner = { ...partner, isOnline: message.isOnline };
                            const updatedParticipants = chat.participants.map(p => p.id === message.userId ? updatedPartner : p);
                            return { ...chat, participants: updatedParticipants };
                        }
                        return chat;
                    })
                );
            });
        };
        setupSubscription();
        return () => subscription?.unsubscribe();
    }, [user?.sub]);

    const activeChat = chats.find(chat => chat.id === activeChatId);

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

    return (
        <div 
            className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <ChatList
                chats={chats}
                setChats={setChats}
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
            />
            <MessageArea
                activeChat={activeChat}
                isDragging={isDragging}
                openMediaModal={(files) => setModalFiles(files)}
                onMediaClick={(message) => setViewingMessage(message)}
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

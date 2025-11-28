import { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Chat, StatusUpdateMessage } from '../types';
import api from '../services/api';
import { StompSubscription } from '@stomp/stompjs';

const ChatPage = () => {
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const { user, token } = useAuth();


    const fetchChats = async () => {
        try {
            console.log('Fetching chats in ChatPage...');
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

        const handleStatusUpdate = (message: StatusUpdateMessage) => {
            console.log('[ChatPage] Received presence update:', message);
            setChats(prevChats =>
                prevChats.map(chat => {
                    const partner = chat.participants.find(p => p.id === message.userId && p.username !== user?.sub);
                    if (partner) {
                        const updatedPartner = { ...partner, isOnline: message.isOnline };
                        const updatedParticipants = chat.participants.map(p =>
                            p.id === message.userId ? updatedPartner : p
                        );
                        return { ...chat, participants: updatedParticipants };
                    }
                    return chat;
                })
            );
        };

        let subscription: StompSubscription | null = null;
        const setupSubscription = async () => {
            subscription = await websocketService.subscribe('/topic/presence', handleStatusUpdate);
            if (subscription) {
                console.log('[ChatPage] Subscription to /topic/presence successful.');
            } else {
                console.error('[ChatPage] Subscription to /topic/presence FAILED.');
            }
        };

        setupSubscription();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [user?.sub]);

    const activeChat = chats.find(chat => chat.id === activeChatId);

    return (
        <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900">
            <ChatList
                chats={chats}
                setChats={setChats}
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
            />
            <MessageArea
                activeChat={activeChat}
            />
        </div>
    );
};

export default ChatPage;

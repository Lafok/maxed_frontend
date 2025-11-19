import { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';

const ChatPage = () => {
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            websocketService.connect(token);
        }
        return () => {
            websocketService.disconnect();
        };
    }, [token]);

    return (
        // Основной контейнер, занимающий весь экран
        <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900">
            <ChatList
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
            />
            <MessageArea
                activeChatId={activeChatId}
            />
        </div>
    );
};

export default ChatPage;

import { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import websocketService from '../services/websocketService'; // ПРАВКА: Импортируем сервис
import { useAuth } from '../hooks/useAuth'; // ПРАВКА: Импортируем useAuth

const ChatPage = () => {
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const { token } = useAuth(); // ПРАВКА: Получаем токен

    // ПРАВКА: Этот useEffect отвечает за установку и разрыв соединения
    useEffect(() => {
        if (token) {
            websocketService.connect(token);
        }

        // Эта функция очистки выполнится, когда пользователь выйдет из системы (компонент размонтируется)
        return () => {
            websocketService.disconnect();
        };
    }, [token]); // Зависимость от токена

    return (
        <div className="h-screen flex">
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

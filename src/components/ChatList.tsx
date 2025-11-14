import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Participant {
  id: string;
  username: string;
}

interface Chat {
  id: string;
  participants: Participant[];
}

interface ChatListProps {
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
}

const ChatList = ({ activeChatId, setActiveChatId }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get('/chats');
        setChats(response.data);
      } catch (error) {
        console.error('Failed to fetch chats', error);
      }
    };

    fetchChats();
  }, []);

  const getPartner = (participants: Participant[]) => {
    return participants.find(p => p.username !== user?.sub);
  };

  return (
    <div className="w-1/4 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Chats</h2>
      <div>
        {chats.map((chat) => {
          const partner = getPartner(chat.participants);
          return (
            <div
              key={chat.id}
              className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                activeChatId === chat.id ? 'bg-gray-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="w-10 h-10 bg-indigo-500 rounded-full mr-3"></div>
              <div>
                <p className="font-semibold">{partner?.username || 'Unknown'}</p>
                <p className="text-sm text-gray-400 truncate">Latest message preview...</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;

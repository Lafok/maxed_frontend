import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Chat, UserSummary } from '../types';
import Button from './Button';
import CreateChatModal from './CreateChatModal';

interface ChatListProps {
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
}

const ChatList = ({ activeChatId, setActiveChatId }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const getPartner = (participants: UserSummary[]) => {
    return participants.find(p => p.username !== user?.sub);
  };

  const handleCreateChat = async (userId: string) => {
    try {
      const response = await api.post('/chats/direct', { participantId: userId });
      const newChat = response.data;
      
      setChats(prevChats => [newChat, ...prevChats]);
      setActiveChatId(newChat.id);
      setIsModalOpen(false);
      
    } catch (error) {
      console.error('Failed to create direct chat', error);
    }
  };

  return (
    <>
      <div className="w-1/4 bg-gray-800 text-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            New Chat
          </Button>
        </div>
        <div className="overflow-y-auto">
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
                <div className="w-10 h-10 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                <div className="truncate">
                  <p className="font-semibold">{partner?.username || 'Group Chat'}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {chat.latestMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <CreateChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateChat={handleCreateChat}
      />
    </>
  );
};

export default ChatList;

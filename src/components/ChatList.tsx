import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Chat, UserSummary } from '../types';
import GenericInput from './GenericInput';
import Spinner from './Spinner';
import clsx from 'clsx';

// --- Вспомогательные компоненты и утилиты ---
const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Avatar = ({ name, isOnline }: { name: string; isOnline: boolean }) => (
    <div className="relative w-10 h-10 flex-shrink-0">
        <div className="w-full h-full rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
            {getInitials(name)}
        </div>
        {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
        )}
    </div>
);

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    isOnline: boolean;
}
// --- Конец вспомогательных компонентов ---

interface ChatListProps {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
}

const ChatList = ({ chats, setChats, activeChatId, setActiveChatId }: ChatListProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (searchQuery.trim() === '') {
        setSearchResults([]);
        setSearchError(null);
        setIsLoadingSearch(false);
        return;
    }

    setIsLoadingSearch(true);
    setSearchError(null);

    debounceTimeout.current = window.setTimeout(async () => {
        try {
            const response = await api.get('/users/search', { params: { name: searchQuery } });
            setSearchResults(response.data);
            if (response.data.length === 0) {
                setSearchError('No users found matching your search.');
            }
        } catch (err) {
            console.error('Error searching users:', err);
            setSearchError('An error occurred while searching. Please try again.');
        } finally {
            setIsLoadingSearch(false);
        }
    }, 300);
    
    return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery]);

  const getPartner = (participants: UserSummary[]) => {
    return participants.find(p => p.username !== user?.sub);
  };

  const handleCreateChat = async (userId: number) => {
    try {
      const response = await api.post('/chats/direct', { partnerId: userId });
      const newChat = response.data;
      
      setChats(prevChats => {
        const chatExists = prevChats.some(chat => chat.id === newChat.id);
        if (!chatExists) {
          return [newChat, ...prevChats];
        }
        return prevChats;
      });

      setActiveChatId(newChat.id);
      setSearchQuery('');
      setSearchResults([]);
      
    } catch (error) {
      console.error('Failed to create direct chat', error);
    }
  };

  const renderChatList = () => {
    if (chats.length === 0 && !searchQuery) {
      return (
        <p className="text-center text-gray-400 py-4">No chats yet. Start a new conversation!</p>
      );
    }
    return chats.map((chat) => {
      const partner = getPartner(chat.participants);
      const isPartnerOnline = partner ? partner.isOnline : false;

      return (
        <div
          key={chat.id}
          className={clsx(
            "flex items-center p-3 rounded-md cursor-pointer transition-colors mx-2 my-1",
            activeChatId === chat.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
          )}
          onClick={() => setActiveChatId(chat.id)}
        >
          <Avatar name={partner?.username || 'Group Chat'} isOnline={isPartnerOnline} />
          <div className="ml-3 truncate">
            <p className="font-semibold">{partner?.username || 'Group Chat'}</p>
            <p className="text-sm text-gray-400 truncate">
              {chat.latestMessage?.content || 'No messages yet'}
            </p>
          </div>
        </div>
      );
    });
  };

  const renderSearchResults = () => {
    if (isLoadingSearch) {
      return <div className="flex justify-center items-center h-full py-8"><Spinner /></div>;
    }
    if (searchError) {
      return <p className="text-center text-gray-400 py-8 px-4">{searchError}</p>;
    }
    if (searchResults.length === 0 && searchQuery.trim() !== '') {
      return <p className="text-center text-gray-400 py-8 px-4">No users found matching "{searchQuery}".</p>;
    }
    if (searchResults.length === 0 && searchQuery.trim() === '') {
      return <p className="text-center text-gray-400 py-8 px-4">Start typing to find users.</p>;
    }

    return searchResults.slice(0, 5).map((user) => (
      <div
        key={user.id}
        className="flex items-center gap-4 p-3 mx-2 my-1 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
        onClick={() => handleCreateChat(user.id)}
      >
        <Avatar name={user.username} isOnline={user.isOnline} />
        <span className="font-medium text-gray-200">{user.username}</span>
      </div>
    ));
  };

  return (
    <div className="w-1/4 bg-gray-800 text-white flex flex-col">
      {/* Search Input */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <GenericInput
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-gray-700 text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-lg py-2"
          />
        </div>
      </div>

      {/* Chat List / Search Results */}
      <div className="flex-grow overflow-y-auto p-2">
        {searchQuery.trim() !== '' ? renderSearchResults() : renderChatList()}
      </div>
    </div>
  );
};

export default ChatList;

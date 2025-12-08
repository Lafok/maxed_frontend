import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Chat, UserSummary, Message } from '../types';
import GenericInput from './GenericInput';
import Spinner from './Spinner';
import clsx from 'clsx';
import { format } from 'date-fns';

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

interface ChatListProps {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
  isSearchVisible: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: Message[];
  isSearching: boolean;
  onCloseSearch: () => void;
}

const ChatList = ({
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    isSearchVisible,
    searchQuery,
    onSearchQueryChange,
    searchResults,
    isSearching,
    onCloseSearch,
}: ChatListProps) => {
  const { user } = useAuth();
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isLoadingUserSearch, setIsLoadingUserSearch] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (isSearchVisible) return; 

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (userSearchQuery.trim() === '') {
        setUserSearchResults([]);
        setUserSearchError(null);
        setIsLoadingUserSearch(false);
        return;
    }

    setIsLoadingUserSearch(true);
    setUserSearchError(null);

    debounceTimeout.current = window.setTimeout(async () => {
        try {
            const response = await api.get('/users/search', { params: { name: userSearchQuery } });
            setUserSearchResults(response.data);
            if (response.data.length === 0) {
                setUserSearchError('No users found matching your search.');
            }
        } catch (err) {
            console.error('Error searching users:', err);
            setUserSearchError('An error occurred while searching. Please try again.');
        } finally {
            setIsLoadingUserSearch(false);
        }
    }, 300);
    
    return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [userSearchQuery, isSearchVisible]);

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
      setUserSearchQuery('');
      setUserSearchResults([]);
      
    } catch (error) {
      console.error('Failed to create direct chat', error);
    }
  };

  const renderChatList = () => {
    if (chats.length === 0) {
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

  const renderUserSearchResults = () => {
    if (isLoadingUserSearch) {
      return <div className="flex justify-center items-center h-full py-8"><Spinner /></div>;
    }
    if (userSearchError) {
      return <p className="text-center text-gray-400 py-8 px-4">{userSearchError}</p>;
    }
    if (userSearchResults.length === 0 && userSearchQuery.trim() !== '') {
      return <p className="text-center text-gray-400 py-8 px-4">No users found matching "{userSearchQuery}".</p>;
    }
    if (userSearchResults.length === 0 && userSearchQuery.trim() === '') {
      return <p className="text-center text-gray-400 py-8 px-4">Start typing to find users.</p>;
    }

    return userSearchResults.slice(0, 5).map((user) => (
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

  const renderDefaultView = () => (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <GenericInput
            type="text"
            placeholder="Search or start new chat"
            value={userSearchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearchQuery(e.target.value)}
            className="pl-10 w-full bg-gray-700 text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-lg py-2"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {userSearchQuery.trim() !== '' ? renderUserSearchResults() : renderChatList()}
      </div>
    </>
  );

  const renderMessageSearchView = () => (
    <>
        <div className="p-2.5 border-b border-gray-700 flex items-center gap-2">
            <button onClick={onCloseSearch} className="p-2 rounded-full hover:bg-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <GenericInput
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full bg-gray-700 text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-lg py-2"
                autoFocus
            />
        </div>
        <div className="flex-grow overflow-y-auto p-2">
            {isSearching && <div className="flex justify-center py-4"><Spinner /></div>}
            {!isSearching && searchResults.length === 0 && searchQuery.trim() !== '' && (
                <p className="text-center text-gray-400 py-4">No messages found.</p>
            )}
            {!isSearching && searchResults.map(message => (
                <div key={message.id} className="p-3 mx-2 my-1 rounded-md hover:bg-gray-700 cursor-pointer">
                    <div className="flex justify-between text-sm mb-1">
                        <p className="font-bold text-indigo-400">{message.author.username}</p>
                        <p className="text-gray-500">{format(new Date(message.timestamp), 'MMM d')}</p>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap break-words">{message.content}</p>
                </div>
            ))}
        </div>
    </>
  );

  return (
    <div className="w-1/4 bg-gray-800 text-white flex flex-col flex-shrink-0">
      {isSearchVisible ? renderMessageSearchView() : renderDefaultView()}
    </div>
  );
};

export default ChatList;

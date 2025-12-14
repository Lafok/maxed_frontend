import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Chat, UserSummary, Message, User } from '../types';
import GenericInput from './GenericInput';
import Spinner from './Spinner';
import clsx from 'clsx';
import { format } from 'date-fns';
import { formatChatListTime } from '../utils/formatDate';
import Avatar from './Avatar';
import AvatarUploadModal from './AvatarUploadModal';

const AnimatedMenuIcon = ({ isOpen }: { isOpen: boolean }) => {
    const lineClasses = "h-[2px] w-5 bg-gray-400 transition-all duration-300 ease-in-out";
    return (
        <div className="w-6 h-6 flex flex-col justify-center items-center gap-[5px]">
            <span className={clsx(lineClasses, isOpen && "rotate-45 translate-y-[7px]")} />
            <span className={clsx(lineClasses, isOpen && "opacity-0")} />
            <span className={clsx(lineClasses, isOpen && "-rotate-45 -translate-y-[7px]")} />
        </div>
    );
};

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
  const { user, logout } = useAuth();
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSummary[]>([]);
  const [isLoadingUserSearch, setIsLoadingUserSearch] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (isSearchVisible) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (userSearchQuery.trim() === '') {
        setUserSearchResults([]);
        setIsLoadingUserSearch(false);
        return;
    }

    setIsLoadingUserSearch(true);
    debounceTimeout.current = window.setTimeout(async () => {
        try {
            const response = await api.get<UserSummary[]>('/users/search', { params: { name: userSearchQuery } });
            setUserSearchResults(response.data);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsLoadingUserSearch(false);
        }
    }, 300);

    return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [userSearchQuery, isSearchVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPartner = (participants: UserSummary[]) => {
    return participants.find(p => p.username !== user?.username);
  };

  const handleCreateChat = async (partnerId: number) => {
    try {
        const chatResponse = await api.post<Chat>('/chats/direct', { partnerId });
        let newChat = chatResponse.data;

        const userResponse = await api.get<User>(`/users/${partnerId}`);
        const partnerUser = userResponse.data;

        newChat.participants = newChat.participants.map(p => 
            p.id === partnerId ? { ...p, avatarUrl: partnerUser.avatarUrl } : p
        );

        setChats(prevChats => [newChat, ...prevChats.filter(c => c.id !== newChat.id)]);
        setActiveChatId(newChat.id);
        setUserSearchQuery('');
        setUserSearchResults([]);
    } catch (error) {
        console.error('Failed to create direct chat', error);
    }
  };

  const renderDefaultView = () => {
    const renderChatList = () => {
        if (chats.length === 0) {
          return <p className="text-center text-gray-400 py-4">No chats yet.</p>;
        }
        return chats.map((chat) => {
          const partner = getPartner(chat.participants);
          return (
            <div
              key={chat.id}
              className={clsx(
                "flex items-center p-2.5 rounded-lg cursor-pointer transition-colors mx-2",
                activeChatId === chat.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
              )}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="flex-shrink-0">
                <Avatar 
                  username={partner?.username || 'G'} 
                  avatarUrl={partner?.avatarUrl}
                  isOnline={partner?.isOnline} 
                  size="md"
                />
              </div>
              <div className="ml-3 truncate flex-grow min-w-0">
                <p className={clsx("font-semibold truncate", activeChatId === chat.id && "text-white")}>{partner?.username || 'Group Chat'}</p>
                <p className={clsx("text-sm truncate", activeChatId === chat.id ? "text-gray-200" : "text-gray-400")}>
                  {chat.latestMessage?.content || 'No messages yet'}
                </p>
              </div>
              {chat.latestMessage && (
                <span className={clsx("text-xs ml-2 flex-shrink-0", activeChatId === chat.id ? "text-gray-300" : "text-gray-500")}>
                  {formatChatListTime(chat.latestMessage.timestamp)}
                </span>
              )}
            </div>
          );
        });
      };

    const renderUserSearchResults = () => {
        if (isLoadingUserSearch) {
            return <div className="flex justify-center py-4"><Spinner /></div>;
        }
        if (userSearchResults.length === 0) {
            return <p className="text-center text-gray-400 py-4">No users found.</p>;
        }
        return userSearchResults.map((foundUser) => (
            <div
              key={foundUser.id}
              className="flex items-center p-2.5 rounded-lg cursor-pointer transition-colors mx-2 hover:bg-gray-700"
              onClick={() => handleCreateChat(foundUser.id)}
            >
              <div className="flex-shrink-0">
                <Avatar username={foundUser.username} avatarUrl={foundUser.avatarUrl} isOnline={foundUser.isOnline} size="md" />
              </div>
              <div className="ml-3 truncate min-w-0">
                <p className="font-semibold text-white truncate">{foundUser.username}</p>
              </div>
            </div>
        ));
    };

    return (
        <>
            <div className="p-2 flex items-center gap-2 border-b border-gray-700">
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setIsMenuOpen(p => !p)}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-700 focus:outline-none transition-colors"
                        aria-label="Open user menu"
                    >
                        <AnimatedMenuIcon isOpen={isMenuOpen} />
                    </button>
                    <div
                        className={clsx(
                            "absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-700",
                            "transform-gpu transition-all duration-150 ease-out origin-top-left",
                            isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                        )}
                    >
                        <div className="px-3 py-3 border-b border-gray-700 flex items-center gap-3">
                            <Avatar username={user?.username || ''} avatarUrl={user?.avatarUrl} size="md" />
                            <div>
                                <p className="font-semibold text-white truncate">{user?.username}</p>
                                <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className="py-1">
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span>Change Avatar</span>
                            </a>
                            <a href="#" onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="relative flex-grow">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <GenericInput
                        type="text"
                        placeholder="Search"
                        value={userSearchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearchQuery(e.target.value)}
                        className="pl-10 w-full bg-gray-700 text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-full py-2"
                    />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto py-2 space-y-1">
                {userSearchQuery.trim() ? renderUserSearchResults() : renderChatList()}
            </div>
        </>
    );
  };

  const renderMessageSearchView = () => (
    <>
        <div className="p-2 flex items-center gap-2 border-b border-gray-700">
            <button onClick={onCloseSearch} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <GenericInput
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full bg-gray-700 text-white border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-full py-2"
                autoFocus
            />
        </div>
        <div className="flex-grow overflow-y-auto p-2">
            {isSearching && <div className="flex justify-center py-4"><Spinner /></div>}
            {!isSearching && searchResults.length === 0 && searchQuery.trim() !== '' && (
                <p className="text-center text-gray-400 py-4">No messages found.</p>
            )}
            {!isSearching && searchResults.map(message => {
                const author = chats.flatMap(c => c.participants).find(p => p.id === message.author.id) || message.author;
                return (
                    <div key={message.id} className="p-3 mx-2 my-1 rounded-md hover:bg-gray-700 cursor-pointer" onClick={() => setActiveChatId(message.chatId)}>
                        <div className="flex justify-between text-sm mb-1">
                            <p className="font-bold text-indigo-400">{author.username}</p>
                            <p className="text-gray-500">{format(new Date(message.timestamp), 'MMM d')}</p>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                );
            })}
        </div>
    </>
  );

  return (
    <>
      <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-800 text-white flex flex-col flex-shrink-0 border-r border-gray-700">
        {isSearchVisible ? renderMessageSearchView() : renderDefaultView()}
      </div>
      {isModalOpen && <AvatarUploadModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default ChatList;

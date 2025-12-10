import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Message as MessageType, Chat, MessageStatus } from '../types';
import Message from './Message';
import MessageInput, { MessageInputRef } from './MessageInput';
import Spinner from './Spinner';
import websocketService from '../services/websocketService';
import DateSeparator from './DateSeparator';
import { formatDateSeparator } from '../utils/formatDate';

const MESSAGES_PER_PAGE = 50;

interface TypingEvent {
    chatId: number;
    username: string;
    isTyping: boolean;
}

interface ReadEvent {
    chatId: number;
    userId: number;
}

interface MessageAreaProps {
  activeChat: Chat | undefined;
  messages: MessageType[];
  setMessages: (messages: MessageType[] | ((prev: MessageType[]) => MessageType[])) => void;
  isDragging: boolean;
  openMediaModal: (files: File[]) => void;
  onMediaClick: (message: MessageType) => void;
  onSearchClick: () => void;
}

const MessageArea = ({ activeChat, messages, setMessages, isDragging, openMediaModal, onMediaClick, onSearchClick }: MessageAreaProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingOlderMessages, setIsFetchingOlderMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const messageInputRef = useRef<MessageInputRef>(null);

  const fetchMessages = useCallback(async (chatId: number, pageNumber: number, isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setLoading(true);
      setMessages([]);
      setPage(0);
      setHasMoreMessages(true);
    } else {
      setIsFetchingOlderMessages(true);
    }

    try {
      const response = await api.get(`/chats/${chatId}/messages`, { params: { page: pageNumber, size: MESSAGES_PER_PAGE } });
      const newMessages = response.data.content.reverse();
      setMessages(prev => isInitialLoad ? newMessages : [...newMessages, ...prev]);
      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
      setIsFetchingOlderMessages(false);
    }
  }, [setMessages]);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    fetchMessages(chatId, 0, true);
  }, [activeChat?.id, fetchMessages, setMessages]);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId || !user?.sub) return;

    const typingTopic = `/topic/chats.${chatId}.typing`;
    
    const subPromise = websocketService.subscribe(typingTopic, (event: TypingEvent) => {
        if (event.username === user.sub) return;

        setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (event.isTyping) newSet.add(event.username);
            else newSet.delete(event.username);
            return newSet;
        });
    });

    return () => {
       subPromise.then(subscription => subscription?.unsubscribe());
       setTypingUsers(new Set());
    };
  }, [activeChat?.id, user?.sub]);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId || !user?.sub) return;

    const readTopic = `/topic/chats.${chatId}.read`;
    const readSubPromise = websocketService.subscribe(readTopic, (event: ReadEvent) => {
        const currentUser = activeChat.participants.find(p => p.username === user.sub);
        if (event.userId !== currentUser?.id) {
             setMessages(prev => prev.map(msg => 
                 msg.author.username === user.sub && msg.status === MessageStatus.SENT 
                    ? { ...msg, status: MessageStatus.READ } 
                    : msg
             ));
        }
    });

    return () => {
        readSubPromise.then(sub => sub?.unsubscribe());
    };
  }, [activeChat?.id, user?.sub, setMessages, activeChat?.participants]);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId || !user?.sub) return;

    const hasUnread = messages.some(
        m => m.status === MessageStatus.SENT && m.author.username !== user.sub
    );

    if (hasUnread) {
        const timer = setTimeout(() => {
            websocketService.sendMessage(`/app/chat.read/${chatId}`, {});
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [messages, activeChat?.id, user?.sub]);


  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (page > 0 && prevScrollHeightRef.current > 0) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    } else if (page === 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, page]);

  const handleScroll = () => {
    if (messagesContainerRef.current?.scrollTop === 0 && hasMoreMessages && !isFetchingOlderMessages && activeChat) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      fetchMessages(activeChat.id, page + 1, false).catch(console.error);
    }
  };

  const partner = activeChat?.participants.find(p => p.username !== user?.sub);
  const chatPartnerName = activeChat ? (partner?.username || 'Group Chat') : 'Select a chat';
  const isPartnerOnline = partner?.isOnline ?? false;

  const renderStatus = () => {
    const typingNames = Array.from(typingUsers);
    if (typingNames.length > 0) {
      return (
        <p className="text-sm text-indigo-400 animate-pulse h-4">
          {typingNames.join(', ')} is typing...
        </p>
      );
    }
    if (isPartnerOnline) {
      return <p className="text-sm text-gray-400 h-4">online</p>;
    }
    return <div className="h-4" />;
  };

  const renderMessagesWithSeparators = () => {
    const messageElements: React.ReactNode[] = [];
    let lastDate: string | null = null;

    messages.forEach(msg => {
      const messageDate = new Date(msg.timestamp);
      const messageDateString = messageDate.toDateString();

      if (messageDateString !== lastDate) {
        messageElements.push(
          <DateSeparator key={`sep-${messageDateString}`} date={formatDateSeparator(messageDate)} />
        );
        lastDate = messageDateString;
      }

      messageElements.push(
        <Message key={msg.id} {...msg} isOwnMessage={msg.author.username === user?.sub} onMediaClick={onMediaClick} />
      );
    });

    return messageElements;
  };

  return (
    <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900 relative">
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-900 bg-opacity-75 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-white text-2xl font-bold border-4 border-dashed border-white rounded-lg p-8">
            Drop Files Here
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {chatPartnerName}
          </h2>
          {activeChat && renderStatus()}
        </div>
        {activeChat && (
            <button onClick={onSearchClick} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
        )}
      </div>

      <div ref={messagesContainerRef} className="flex-grow p-4 overflow-y-auto" onScroll={handleScroll} onClick={() => messageInputRef.current?.focus()}>
        {isFetchingOlderMessages && <div className="flex justify-center my-2"><Spinner /></div>}
        {loading ? <div className="flex items-center justify-center h-full"><Spinner /></div> : renderMessagesWithSeparators()}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        ref={messageInputRef}
        activeChatId={activeChat?.id ?? null}
        openMediaModal={openMediaModal}
      />
    </div>
  );
};

export default MessageArea;

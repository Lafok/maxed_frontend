import { useEffect, useState, useRef, useCallback } from 'react';
import { StompSubscription } from '@stomp/stompjs';

import api from '../services/api';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Message as MessageType, Chat } from '../types';

import Message from './Message';
import MessageInput, { MessageInputRef } from './MessageInput';
import Spinner from './Spinner';

const MESSAGES_PER_PAGE = 50;

interface MessageAreaProps {
  activeChat: Chat | undefined;
  isDragging: boolean;
  openMediaModal: (files: File[]) => void;
  onMediaClick: (message: MessageType) => void;
}

const MessageArea = ({ activeChat, isDragging, openMediaModal, onMediaClick }: MessageAreaProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingOlderMessages, setIsFetchingOlderMessages] = useState(false);

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
  }, []);

  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let subscription: StompSubscription | null = null;

    const setupChat = async () => {
      await fetchMessages(chatId, 0, true);
      const topic = `/topic/chats.${chatId}`;
      subscription = await websocketService.subscribe(topic, (newMessage: MessageType) => {
        if (isMounted) setMessages(prev => [...prev, newMessage]);
      });
    };

    setupChat();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [activeChat?.id, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current && page === 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page]);

  const handleScroll = () => {
    if (messagesContainerRef.current?.scrollTop === 0 && hasMoreMessages && !isFetchingOlderMessages && activeChat) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      fetchMessages(activeChat.id, page + 1, false);
    }
  };

  const partner = activeChat?.participants.find(p => p.username !== user?.sub);
  const chatPartnerName = activeChat ? (partner?.username || 'Group Chat') : 'Select a chat';
  const isPartnerOnline = partner?.isOnline ?? false;

  return (
    <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900 relative">
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-900 bg-opacity-75 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-white text-2xl font-bold border-4 border-dashed border-white rounded-lg p-8">
            Drop Files Here
          </div>
        </div>
      )}

      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          {chatPartnerName}
          {isPartnerOnline && <span className="ml-2 w-3 h-3 bg-green-500 rounded-full"></span>}
        </h2>
      </div>

      <div ref={messagesContainerRef} className="flex-grow p-4 overflow-y-auto" onScroll={handleScroll} onClick={() => messageInputRef.current?.focus()}>
        {loading ? <div className="flex items-center justify-center h-full"><Spinner /></div> : messages.map(msg => <Message key={msg.id} {...msg} isOwnMessage={msg.author.username === user?.sub} onMediaClick={onMediaClick} />)}
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

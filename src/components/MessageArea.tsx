import { useEffect, useState, useRef, useCallback } from 'react';
import { StompSubscription } from '@stomp/stompjs';

// Local Imports
import api from '../services/api';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Message as MessageType } from '../types';

// Child Components
import Message from './Message';
import MessageInput, { MessageInputRef } from './MessageInput'; // Импортируем MessageInputRef
import Spinner from './Spinner';

const MESSAGES_PER_PAGE = 50;

interface MessageAreaProps {
  activeChatId: string | null;
}

const MessageArea = ({ activeChatId }: MessageAreaProps) => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatPartner, setChatPartner] = useState<string>('Select a chat');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingOlderMessages, setIsFetchingOlderMessages] = useState(false);

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const messageInputRef = useRef<MessageInputRef>(null); // Ref для MessageInput

  // --- HOOKS ---

  const fetchMessages = useCallback(async (chatId: string, pageNumber: number, isInitialLoad: boolean) => {
    if (!chatId) return;

    if (isInitialLoad) {
      setLoading(true);
      setError(null);
      setMessages([]);
      setPage(0);
      setHasMoreMessages(true);
    } else {
      setIsFetchingOlderMessages(true);
    }

    try {
      const response = await api.get(`/chats/${chatId}/messages`, {
        params: { page: pageNumber, size: MESSAGES_PER_PAGE }
      });

      const newMessages = response.data.content.reverse();

      if (isInitialLoad) {
        setMessages(newMessages);
      } else {
        if (messagesContainerRef.current) {
          prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        }
        setMessages(prevMessages => [...newMessages, ...prevMessages]);
      }

      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageNumber);

    } catch (err) {
      console.error('Failed to fetch messages', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsFetchingOlderMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setChatPartner('Select a chat');
      setLoading(false);
      setError(null);
      setPage(0);
      setHasMoreMessages(true);
      return;
    }

    let isMounted = true;
    let subscription: StompSubscription | null = null;

    const setupChat = async () => {
      await fetchMessages(activeChatId, 0, true);

      try {
        const chatDetailsResponse = await api.get(`/chats/${activeChatId}`);
        if (isMounted) {
          const partner = chatDetailsResponse.data.participants.find(
              (p: any) => p.username !== user?.sub
          );
          setChatPartner(partner ? `Chat with ${partner.username}` : 'Group Chat');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load chat details.');
        }
        console.error('Failed to fetch chat details', err);
      }

      const topic = `/topic/chats/${activeChatId}`;
      subscription = await websocketService.subscribe(topic, (newMessage: MessageType) => {
        if (isMounted) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });
    };

    setupChat();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeChatId, user?.sub, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isFetchingOlderMessages && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messages, isFetchingOlderMessages]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMoreMessages && !isFetchingOlderMessages && activeChatId) {
        fetchMessages(activeChatId, page + 1, false);
      }
    }
  };

  // Обработчик клика на область сообщений для фокусировки
  const handleMessageAreaClick = () => {
    messageInputRef.current?.focus();
  };

  // --- RENDER LOGIC ---

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full"><p className="text-red-500">{error}</p></div>;
    }
    if (!activeChatId) {
      return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat from the sidebar to start messaging.</p>
          </div>
      );
    }
    return (
        <>
          {isFetchingOlderMessages && (
              <div className="flex justify-center py-2">
                <Spinner />
              </div>
          )}
          {messages.map((msg) => (
              <Message
                  key={msg.id}
                  content={msg.content}
                  senderUsername={msg.author.username}
                  timestamp={msg.timestamp}
                  isOwnMessage={msg.author.username === user?.sub}
              />
          ))}
        </>
    );
  };

  return (
      <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{chatPartner}</h2>
        </div>

        {/* Message List */}
        <div
            ref={messagesContainerRef}
            className="flex-grow p-4 overflow-y-auto"
            onScroll={handleScroll}
            onClick={handleMessageAreaClick} // Добавляем обработчик клика
        >
          {renderContent()}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput ref={messageInputRef} activeChatId={activeChatId} />
      </div>
  );
};

export default MessageArea;

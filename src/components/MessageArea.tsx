import { useEffect, useState, useRef } from 'react';
import { StompSubscription } from '@stomp/stompjs';

// Local Imports
import api from '../services/api';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import { Message as MessageType } from '../types'; // Centralized types

// Child Components
import Message from './Message';
import MessageInput from './MessageInput';
import Spinner from './Spinner'; // A simple loading spinner component

// Prop definition for the component
interface MessageAreaProps {
  activeChatId: string | null;
}

const MessageArea = ({ activeChatId }: MessageAreaProps) => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatPartner, setChatPartner] = useState<string>('Select a chat');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- HOOKS ---

  /**
   * Effect for fetching data and managing WebSocket subscriptions.
   * This is the core logic of the component.
   */
  useEffect(() => {
    // If no chat is selected, clear the state and do nothing.
    if (!activeChatId) {
      setMessages([]);
      setChatPartner('Select a chat');
      return;
    }

    // This flag prevents state updates on an unmounted component, avoiding race conditions.
    let isMounted = true;
    let subscription: StompSubscription | null = null;

    const setupChat = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch message history and chat details concurrently for better performance.
        const [messagesResponse, chatDetailsResponse] = await Promise.all([
          api.get(`/chats/${activeChatId}/messages?page=0&size=50`),
          api.get(`/chats/${activeChatId}`)
        ]);

        // Only update state if the component is still mounted.
        if (isMounted) {
          setMessages(messagesResponse.data.content.reverse());
          const partner = chatDetailsResponse.data.participants.find(
              (p: any) => p.username !== user?.sub
          );
          setChatPartner(partner ? `Chat with ${partner.username}` : 'Group Chat');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load chat data. Please try again.');
        }
        console.error('Failed to fetch initial chat data', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // Subscribe to the WebSocket topic for real-time messages.
      const topic = `/topic/chats/${activeChatId}`;
      subscription = await websocketService.subscribe(topic, (newMessage: MessageType) => {
        // We check isMounted again, as the component could have unmounted
        // while waiting for the subscription to activate.
        if (isMounted) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });
    };

    setupChat();

    // Cleanup function: This is CRITICAL for preventing memory leaks.
    // It runs when the component unmounts or when `activeChatId` changes.
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeChatId, user?.sub]); // Re-run this effect when the chat or user changes.

  /**
   * Effect for automatically scrolling to the bottom when new messages are added.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


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
        messages.map((msg) => (
            <Message
                key={msg.id}
                content={msg.content}
                senderUsername={msg.author.username}
                timestamp={msg.timestamp}
                isOwnMessage={msg.author.username === user?.sub}
            />
        ))
    );
  };

  return (
      <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{chatPartner}</h2>
        </div>

        {/* Message List */}
        <div className="flex-grow p-4 overflow-y-auto">
          {renderContent()}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput activeChatId={activeChatId} />
      </div>
  );
};

export default MessageArea;

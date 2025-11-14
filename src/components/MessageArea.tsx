import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';
import Message from './Message';
import MessageInput from './MessageInput';
import { Message as MessageType } from '../types';
import { StompSubscription } from '@stomp/stompjs';

interface MessageAreaProps {
  activeChatId: string | null;
}

const MessageArea = ({ activeChatId }: MessageAreaProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatPartner, setChatPartner] = useState<string>('Select a chat');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setChatPartner('Select a chat');
      return;
    }

    let isMounted = true;
    let subscription: StompSubscription | null = null;

    const fetchMessagesAndSubscribe = async () => {
      try {
        const [messagesResponse, chatDetailsResponse] = await Promise.all([
          api.get(`/chats/${activeChatId}/messages?page=0&size=50`),
          api.get(`/chats/${activeChatId}`)
        ]);

        if (isMounted) {
          setMessages(messagesResponse.data.content.reverse());
          
          const partner = chatDetailsResponse.data.participants.find((p: any) => p.username !== user?.sub);
          setChatPartner(partner ? `Chat with ${partner.username}` : 'Chat');
        }
      } catch (error) {
        console.error('Failed to fetch initial chat data', error);
      }
    };

    fetchMessagesAndSubscribe();

    const topic = `/topic/chats/${activeChatId}`;
    subscription = websocketService.subscribe(topic, (newMessage: MessageType) => {
      if (isMounted) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeChatId, user?.sub]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-grow flex flex-col bg-white">
      <div className="flex items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{chatPartner}</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {activeChatId ? (
          messages.map((msg) => (
            <Message
              key={msg.id}
              content={msg.content}
              senderUsername={msg.author.username}
              timestamp={msg.timestamp}
              isOwnMessage={msg.author.username === user?.sub}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat from the sidebar to start messaging.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput activeChatId={activeChatId} />
    </div>
  );
};

export default MessageArea;

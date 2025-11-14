import { useState } from 'react';
import websocketService from '../services/websocketService';

interface MessageInputProps {
  activeChatId: string | null;
}

const MessageInput = ({ activeChatId }: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && activeChatId) {
      const destination = `/app/chat.sendMessage/${activeChatId}`;
      const body = { content: message };
      websocketService.sendMessage(destination, body);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={!activeChatId}
      />
    </form>
  );
};

export default MessageInput;

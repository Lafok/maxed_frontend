import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import websocketService from '../services/websocketService';

// Экспортируем интерфейс для ref, чтобы родительский компонент знал о методе focus
export interface MessageInputRef {
  focus: () => void;
}

interface MessageInputProps {
  activeChatId: number | null; // ИЗМЕНЕНО
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ activeChatId }, ref) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useImperativeHandle позволяет родительскому компоненту вызывать методы дочернего
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const sendMessage = () => {
    if (message.trim() && activeChatId) {
      const destination = `/app/chat.sendMessage/${activeChatId}`;
      const body = { content: message };
      websocketService.sendMessage(destination, body);
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);

  useEffect(() => {
    if (activeChatId && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeChatId]);

  return (
    <form onSubmit={handleFormSubmit} className="p-4 flex items-end">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        // onBlur был удален, чтобы избежать агрессивного перехвата фокуса
        placeholder="Type a message..."
        className="flex-grow p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        disabled={!activeChatId}
        rows={1}
        style={{ maxHeight: '100px' }}
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!activeChatId || !message.trim()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  );
});

export default MessageInput;

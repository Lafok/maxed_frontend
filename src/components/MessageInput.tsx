import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import websocketService from '../services/websocketService';
import MediaUploader from './MediaUploader';
import { MessageType } from '../types';

export interface MessageInputRef {
  focus: () => void;
}

interface MessageInputProps {
  activeChatId: number | null;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ activeChatId }, ref) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSendMessage = (content: string, type: MessageType = 'TEXT') => {
    if (content.trim() && activeChatId) {
      const destination = `/app/chat.sendMessage/${activeChatId}`;
      const body = { content, type };
      websocketService.sendMessage(destination, body);
      
      if (type === 'TEXT') {
        setText('');
      }
      textareaRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(text, 'TEXT');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(text, 'TEXT');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [text]);

  useEffect(() => {
    if (activeChatId && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeChatId]);

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
        <MediaUploader onMediaUploaded={handleSendMessage} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-grow p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          disabled={!activeChatId}
          rows={1}
          style={{ maxHeight: '100px' }}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!activeChatId || !text.trim()}
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
    </div>
  );
});

export default MessageInput;

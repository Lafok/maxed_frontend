import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import websocketService from '../services/websocketService';
import { MessageType } from '../types';

export interface MessageInputRef {
  focus: () => void;
}

interface MessageInputProps {
  activeChatId: number | null;
  openMediaModal: (files: File[]) => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ activeChatId, openMediaModal }, ref) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      openMediaModal(Array.from(event.target.files));
    }
  };

  const handleSend = async () => {
    if (text.trim() && activeChatId) {
      const destination = `/app/chat.sendMessage/${activeChatId}`;
      const body = { content: text, type: 'TEXT' as MessageType };
      await websocketService.sendMessage(destination, body);
      setText('');
      textareaRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>

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
          disabled={!activeChatId || text.trim() === ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
});

export default MessageInput;

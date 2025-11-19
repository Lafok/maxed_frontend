import { useState, useRef, useEffect } from 'react';
import websocketService from '../services/websocketService';

interface MessageInputProps {
  activeChatId: string | null;
}

const MessageInput = ({ activeChatId }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Добавляем ref для textarea

  const sendMessage = () => {
    if (message.trim() && activeChatId) {
      const destination = `/app/chat.sendMessage/${activeChatId}`;
      const body = { content: message };
      websocketService.sendMessage(destination, body);
      setMessage('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Предотвращаем добавление новой строки при Enter
      sendMessage();
    }
    // Для Shift+Enter стандартное поведение textarea (добавление новой строки)
    // не блокируется, так что ничего дополнительно делать не нужно.
  };

  // Эффект для автоматического изменения высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Сбрасываем высоту, чтобы получить scrollHeight
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`; // Устанавливаем новую высоту, ограничивая 100px
    }
  }, [message]); // Запускаем эффект при изменении сообщения

  return (
    <form onSubmit={handleFormSubmit} className="p-4 flex items-end">
      <textarea
        ref={textareaRef} // Привязываем ref к textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-grow p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" // resize-none для отключения ручного изменения размера
        disabled={!activeChatId}
        rows={1} // Начальная высота
        style={{ maxHeight: '100px' }} // Ограничение максимальной высоты
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!activeChatId || !message.trim()} // Отключаем кнопку, если нет активного чата или сообщение пустое
      >
        {/* Иконка самолетика (SVG) */}
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
};

export default MessageInput;

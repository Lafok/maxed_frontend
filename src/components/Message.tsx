import clsx from 'clsx';
import { format } from 'date-fns';

interface MessageProps {
  content: string;
  senderUsername: string;
  timestamp: string;
  isOwnMessage: boolean;
}

const Message = ({ content, senderUsername, timestamp, isOwnMessage }: MessageProps) => {
  const messageContainerClasses = clsx('flex mb-4', isOwnMessage ? 'justify-end' : 'justify-start');
  const messageBubbleClasses = clsx(
    'py-2 px-4 rounded-2xl max-w-lg whitespace-pre-wrap break-words', // Добавлен break-words
    isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'
  );

  return (
    <div className={messageContainerClasses}>
      <div>
        <div className="flex items-baseline mb-1">
          <span className="font-semibold text-sm text-gray-600 mr-2">{isOwnMessage ? 'You' : senderUsername}</span>
          <span className="text-xs text-gray-400">{format(new Date(timestamp), 'p')}</span>
        </div>
        <div className={messageBubbleClasses}>
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;

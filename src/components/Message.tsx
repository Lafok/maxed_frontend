import clsx from 'clsx';
import { format } from 'date-fns';
import { UserSummary, MessageType } from '../types';

interface MessageProps {
  content: string;
  author: UserSummary;
  timestamp: string;
  isOwnMessage: boolean;
  type: MessageType;
}

const MessageContent = ({ type, content }: { type: MessageType; content: string }) => {
  switch (type) {
    case 'IMAGE':
      return (
        <a href={content} target="_blank" rel="noopener noreferrer">
          <img src={content} alt="Uploaded content" className="max-w-xs max-h-64 rounded-lg cursor-pointer" />
        </a>
      );
    case 'VIDEO':
      return (
        <video controls className="max-w-xs rounded-lg">
          <source src={content} />
          Your browser does not support the video tag.
        </video>
      );
    case 'AUDIO':
      return (
        <audio controls src={content}>
          Your browser does not support the audio element.
        </audio>
      );
    case 'FILE':
        return (
            <a href={content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                View File
            </a>
        )
    case 'TEXT':
    default:
      return <p>{content}</p>;
  }
};

const Message = ({ content, author, timestamp, isOwnMessage, type }: MessageProps) => {
  const messageContainerClasses = clsx('flex mb-4', isOwnMessage ? 'justify-end' : 'justify-start');
  
  const messageBubbleClasses = clsx(
    'rounded-2xl max-w-lg overflow-hidden',
    isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800',
    type === 'TEXT' && 'py-2 px-4 whitespace-pre-wrap break-words'
  );

  return (
    <div className={messageContainerClasses}>
      <div>
        <div className={clsx("flex items-baseline mb-1", isOwnMessage && "justify-end")}>
          <span className="font-semibold text-sm text-gray-600 dark:text-gray-400 mr-2">{isOwnMessage ? 'You' : author.username}</span>
          <span className="text-xs text-gray-500 dark:text-gray-500">{format(new Date(timestamp), 'p')}</span>
        </div>
        <div className={messageBubbleClasses}>
          <MessageContent type={type} content={content} />
        </div>
      </div>
    </div>
  );
};

export default Message;

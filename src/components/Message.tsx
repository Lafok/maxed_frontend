import clsx from 'clsx';
import { format } from 'date-fns';
import { MessageType, Message as MessagePropsType } from '../types';

interface MessageProps extends MessagePropsType {
  isOwnMessage: boolean;
  onMediaClick: (message: MessagePropsType) => void;
}

const MessageContent = ({ type, content, onMediaClick }: { type: MessageType; content: string; onMediaClick: () => void }) => {
  const isMedia = type === 'IMAGE' || type === 'VIDEO';

  const handleMediaClick = () => {
    if (isMedia) {
      onMediaClick();
    }
  };

  switch (type) {
    case 'IMAGE':
      return (
        <div onClick={handleMediaClick} className="cursor-pointer">
          <img src={content} alt="Uploaded content" className="max-w-xs max-h-80 rounded-lg" />
        </div>
      );
    case 'VIDEO':
      return (
        <div onClick={handleMediaClick} className="cursor-pointer relative">
          <video src={content} className="max-w-xs max-h-80 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
            </div>
          </div>
        </div>
      );
    case 'AUDIO':
      return (
        <audio controls src={content} className="w-full max-w-xs">
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

const Message = (props: MessageProps) => {
  const { content, author, timestamp, isOwnMessage, type, onMediaClick } = props;
  const messageContainerClasses = clsx('flex mb-4', isOwnMessage ? 'justify-end' : 'justify-start');
  
  const messageBubbleClasses = clsx(
    'rounded-2xl max-w-lg overflow-hidden',
    isOwnMessage ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white',
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
          <MessageContent type={type} content={content} onMediaClick={() => onMediaClick(props)} />
        </div>
      </div>
    </div>
  );
};

export default Message;

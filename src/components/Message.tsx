import clsx from 'clsx';
import type { Message as MessagePropsType } from '../types';
import MessageStatusIcon from './MessageStatusIcon';

interface MessageProps extends MessagePropsType {
  isOwnMessage: boolean;
  onMediaClick: (message: MessagePropsType) => void;
}

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    }).format(date);
}

const TimeAndStatus = ({ timestamp, status, isOwnMessage }: { timestamp: string, status: MessagePropsType['status'], isOwnMessage: boolean }) => (
    <div className={clsx(
        "flex items-center gap-1",
        isOwnMessage ? "text-white/90" : "text-gray-500 dark:text-gray-400"
    )}>
        <span className="text-xs select-none">
            {formatTime(timestamp)}
        </span>
        <MessageStatusIcon status={status} isOwnMessage={isOwnMessage} />
    </div>
);

const TextMessage = (props: MessageProps) => {
    return (
        <div className="px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-left">
                {props.content}
                <span className="inline-block w-20 h-4"></span>
            </p>
            <div className="absolute right-3 bottom-1.5">
                <TimeAndStatus {...props} />
            </div>
        </div>
    );
};

const MediaMessage = (props: MessageProps) => {
    const { type, content, onMediaClick } = props;
    const isImage = type === 'IMAGE';
    const isVideo = type === 'VIDEO';

    return (
        <div onClick={() => onMediaClick(props)} className="cursor-pointer relative">
            {isImage && <img src={content} alt="Uploaded content" className="w-full h-full object-cover rounded-lg" />}
            {isVideo && (
                <>
                    <video src={content} className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg pointer-events-none">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                        </div>
                    </div>
                </>
            )}
            <div className="absolute right-1.5 bottom-1 flex items-center gap-1 bg-black/40 text-white rounded-full px-2 py-0.5 pointer-events-none">
                <span className="text-xs">{formatTime(props.timestamp)}</span>
                <MessageStatusIcon status={props.status} isOwnMessage={props.isOwnMessage} />
            </div>
        </div>
    );
};

const FileMessage = (props: MessageProps) => (
    <div className="px-3 py-2 flex justify-between items-end">
        <a href={props.content} target="_blank" rel="noopener noreferrer" className="text-current hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" /></svg>
            <span>View File</span>
        </a>
        <div className="ml-4">
             <TimeAndStatus {...props} />
        </div>
    </div>
);

const AudioMessage = (props: MessageProps) => (
    <div className="px-3 py-2 flex items-end justify-between">
        <audio controls src={props.content} className="w-full max-w-xs" />
        <div className="ml-4">
            <TimeAndStatus {...props} />
        </div>
    </div>
);


const MessageContent = (props: MessageProps) => {
    const { type } = props;

    switch (type) {
        case 'TEXT':
            return <TextMessage {...props} />;
        case 'IMAGE':
        case 'VIDEO':
            return <MediaMessage {...props} />;
        case 'FILE':
            return <FileMessage {...props} />;
        case 'AUDIO':
            return <AudioMessage {...props} />;
        default:
            return null;
    }
};

const Message = (props: MessageProps) => {
    const { isOwnMessage } = props;

    const messageBubbleClasses = clsx(
        'rounded-xl max-w-[80%] sm:max-w-lg relative shadow-sm',
        isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white',
    );

    return (
        <div className={clsx('flex mb-1.5', isOwnMessage ? 'justify-end' : 'justify-start')}>
            <div className={messageBubbleClasses}>
                <MessageContent {...props} />
            </div>
        </div>
    );
};

export default Message;

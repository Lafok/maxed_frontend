import {MessageStatus} from '../types';

const MessageStatusIcon = ({status, isOwnMessage}: { status: MessageStatus, isOwnMessage: boolean }) => {
    if (!isOwnMessage) {
        return null;
    }

    const colorClass = status === MessageStatus.READ
        ? 'text-sky-400'
        : 'text-white/70';

    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className={colorClass}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M17.304 7.402l-8.606 8.606-3.702-3.702 1.414-1.414 2.288 2.288 7.192-7.192 1.414 1.414z"/>
            <path d="M22.718 7.402l-8.606 8.606-1.414-1.414 8.606-8.606 1.414 1.414z"/>
        </svg>
    );
};

export default MessageStatusIcon;

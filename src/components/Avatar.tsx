import { useState, useEffect } from 'react';

interface AvatarProps {
    username: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isOnline?: boolean;
    className?: string;
    onClick?: () => void;
}

const Avatar = ({ username, avatarUrl, size = 'md', isOnline, className = '', onClick }: AvatarProps) => {
    const [imgError, setImgError] = useState(false);

    // Сброс ошибки если URL изменился (например, пришел новый presigned url)
    useEffect(() => {
        setImgError(false);
    }, [avatarUrl]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-24 h-24 text-xl',
    };

    // Генерация цвета на основе имени (чтобы у одного юзера всегда был один цвет)
    const getColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-green-500', 'bg-blue-500', 
            'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`relative inline-block ${className}`} onClick={onClick}>
            {avatarUrl && !imgError ? (
                <img
                    src={avatarUrl}
                    alt={username}
                    className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 dark:border-gray-700`}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold uppercase ${getColor(username)}`}>
                    {username.charAt(0)}
                </div>
            )}
            
            {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            )}
        </div>
    );
};

export default Avatar;

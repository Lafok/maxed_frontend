import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';
import { uploadAvatar } from '../services/api';
import Spinner from './Spinner';

const Sidebar = () => {
    const { user, setUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            setIsUploading(true);
            try {
                const updatedUser = await uploadAvatar(file);
                setUser(updatedUser);
            } catch (error) {
                console.error('Failed to upload avatar', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="w-20 bg-gray-800 p-4 flex flex-col items-center justify-between">
            <div className="relative">
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Spinner />
                    </div>
                )}
                <Avatar
                    username={user?.username || ''}
                    avatarUrl={user?.avatarUrl}
                    size="lg"
                    onClick={handleAvatarClick}
                    className="cursor-pointer"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
            {/* Add other sidebar icons here */}
        </div>
    );
};

export default Sidebar;

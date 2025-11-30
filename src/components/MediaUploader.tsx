import { useRef, useState } from 'react';
import api from '../services/api';
import { MessageType } from '../types';
import Spinner from './Spinner';

interface MediaUploaderProps {
  onMediaUploaded: (fileName: string, type: MessageType) => void;
}

const getMessageTypeFromFile = (file: File): MessageType => {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
};

const MediaUploader = ({ onMediaUploaded }: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { fileName } = response.data;
      const messageType = getMessageTypeFromFile(file);

      if (fileName && messageType) {
        onMediaUploaded(fileName, messageType);
      } else {
        throw new Error('Invalid response from server: fileName is missing.');
      }

    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Upload failed. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*"
        disabled={isUploading}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
        aria-label="Attach file"
      >
        {isUploading ? (
          <Spinner />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>
      {error && <p className="text-red-500 text-xs absolute bottom-full mb-1">{error}</p>}
    </div>
  );
};

export default MediaUploader;

import { useEffect, useState } from 'react';
import { Message } from '../types';

interface MediaViewerProps {
  message: Message;
  onClose: () => void;
}

const MediaViewer = ({ message, onClose }: MediaViewerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const renderMedia = () => {
    if (message.type === 'IMAGE') {
      return <img src={message.content} alt="Full screen media" className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg" />;
    }
    if (message.type === 'VIDEO') {
      return <video src={message.content} controls autoPlay className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg" />;
    }
    return null;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'bg-black/80 opacity-100' : 'bg-black/0 opacity-0'}`}
      onClick={handleClose}
    >
      <div className={`transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`} onClick={e => e.stopPropagation()}>
        {renderMedia()}
      </div>
    </div>
  );
};

export default MediaViewer;

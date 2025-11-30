import { useState, useEffect, useRef } from 'react';
import { MessageType } from '../types';
import Spinner from './Spinner';
import api from '../services/api';
import websocketService from '../services/websocketService';
import clsx from 'clsx';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const getMessageTypeFromFile = (file: File): MessageType => {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadeddata = () => { video.currentTime = 1; };
    video.onseeked = () => {
      if (!context) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg'));
      URL.revokeObjectURL(url);
    };
  });
};


const FileThumbnail = ({ file }: { file: File }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      generateVideoThumbnail(file).then(setPreviewUrl);
    }
  }, [file]);

  if (previewUrl) return <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />;
  if (file.type.startsWith('audio/')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 19V6l12-3v13M9 19c0 1.1-.895 2-2 2s-2-.9-2-2 .895-2 2-2 2 .9 2 2zm12-12c0 1.1-.895 2-2 2s-2-.9-2-2 .895-2 2-2 2 .9 2 2z" /></svg>;
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
};

const MainPreview = ({ file }: { file: File }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const type = getMessageTypeFromFile(file);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (type === 'IMAGE' || type === 'VIDEO') {
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file, type]);

  if (type === 'IMAGE' && previewUrl) return <div className="w-full h-full relative"><img src={previewUrl} alt="background" className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 brightness-75" /><img src={previewUrl} alt={file.name} className="relative z-10 w-full h-full object-contain" /></div>;
  if (type === 'VIDEO' && previewUrl) return <video src={previewUrl} controls className="relative z-10 w-full h-full object-contain" />;
  if (type === 'AUDIO') return <div className="flex flex-col items-center justify-center text-white p-8"><div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 19V6l12-3v13M9 19c0 1.1-.895 2-2 2s-2-.9-2-2 .895-2 2-2 2 .9 2 2zm12-12c0 1.1-.895 2-2 2s-2-.9-2-2 .895-2 2-2 2 .9 2 2z" /></svg></div><p className="font-bold text-xl text-center truncate max-w-full">{file.name}</p><p className="text-md text-gray-400">{formatFileSize(file.size)}</p></div>;
  return <div className="text-white">{file.name}</div>;
};


interface SendMediaModalProps {
  initialFiles: File[];
  activeChatId: number;
  onClose: () => void;
}

const SendMediaModal = ({ initialFiles, activeChatId, onClose }: SendMediaModalProps) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>(initialFiles);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const selectedFile = stagedFiles[selectedIndex];
  const isSingleFile = stagedFiles.length === 1;

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showNotification(`File "${file.name}" is too large (max 100MB).`);
      } else {
        validFiles.push(file);
      }
    }
    setStagedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = stagedFiles.filter((_, index) => index !== indexToRemove);
    if (newFiles.length === 0) {
      onClose();
      return;
    }
    setStagedFiles(newFiles);
    if (selectedIndex >= indexToRemove) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    for (const file of stagedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const { fileName } = res.data;
        const messageType = getMessageTypeFromFile(file);
        if (fileName) await websocketService.sendMessage(`/app/chat.sendMessage/${activeChatId}`, { content: fileName, type: messageType });
      } catch (error) { console.error(`Failed to upload file ${file.name}:`, error); }
    }
    if (caption.trim() !== '') await websocketService.sendMessage(`/app/chat.sendMessage/${activeChatId}`, { content: caption, type: 'TEXT' });
    setIsSending(false);
    onClose();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items?.length > 0) setIsDraggingOver(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDraggingOver(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); dragCounter.current = 0; if (e.dataTransfer.files?.length > 0) handleAddFiles(e.dataTransfer.files); };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className={clsx("bg-gray-800 rounded-2xl shadow-2xl flex flex-col relative transition-all duration-300 w-full", isSingleFile ? "max-w-2xl" : "max-w-4xl h-[600px]")} onClick={e => e.stopPropagation()}>
        
        {notification && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg z-40">{notification}</div>}
        {isDraggingOver && <div className="absolute inset-0 bg-indigo-900/75 flex items-center justify-center z-30 rounded-2xl"><div className="text-white text-xl font-bold">Drop to add more files</div></div>}
        
        <div className={clsx("flex flex-1 p-6 gap-6 min-h-0", { "flex-col": isSingleFile })}>
          {!isSingleFile && (
            <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-2">
              {stagedFiles.map((file, index) => (
                <div key={index} onClick={() => setSelectedIndex(index)} className={clsx("flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors", selectedIndex === index ? "bg-indigo-600/50" : "hover:bg-gray-700/70")}>
                  <div className="w-12 h-12 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0"><FileThumbnail file={file} /></div>
                  <div className="flex-grow truncate"><p className="text-sm font-medium text-white truncate">{file.name}</p><p className="text-xs text-gray-400">{formatFileSize(file.size)}</p></div>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }} className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-900/50 text-white/70 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">&times;</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-grow bg-black rounded-lg flex items-center justify-center relative overflow-hidden aspect-video">
            {selectedFile && <MainPreview file={selectedFile} />}
          </div>
        </div>

        <div className="flex-shrink-0 p-6 pt-0">
          <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..." className="w-full p-3 rounded-lg bg-gray-700 text-white mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <div className="flex justify-between items-center">
            <div>
              <input type="file" ref={fileInputRef} onChange={(e) => handleAddFiles(e.target.files)} multiple className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="text-indigo-400 hover:text-indigo-300 font-semibold">Add</button>
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="text-gray-400 hover:text-white font-semibold">Cancel</button>
              <button onClick={handleSend} disabled={isSending} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {isSending ? <Spinner /> : `Send ${stagedFiles.length} file(s)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMediaModal;

import { useState, useCallback, DragEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadAvatar } from '../services/api';
import Spinner from './Spinner';
import clsx from 'clsx';

interface AvatarUploadModalProps {
    onClose: () => void;
}

const AvatarUploadModal = ({ onClose }: AvatarUploadModalProps) => {
    const { setUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleFileSelect = (selectedFile: File | undefined) => {
        if (selectedFile) {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(active);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const updatedUser = await uploadAvatar(file);
            setUser(updatedUser);
            onClose();
        } catch (error) {
            console.error('Failed to upload avatar', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Change Avatar</h2>

                <label
                    htmlFor="avatar-upload-input"
                    onDrop={handleDrop}
                    onDragEnter={(e) => handleDrag(e, true)}
                    onDragLeave={(e) => handleDrag(e, false)}
                    onDragOver={(e) => handleDrag(e, true)}
                    className={clsx(
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors block',
                        isDragActive ? 'border-indigo-500 bg-indigo-500 bg-opacity-10' : 'border-gray-400 dark:border-gray-600 hover:border-indigo-400'
                    )}
                >
                    <input
                        id="avatar-upload-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    {preview ? (
                        <img src={preview} alt="Avatar preview" className="mx-auto h-32 w-32 rounded-full object-cover" />
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-2">Drag & drop an image here, or click to select a file</p>
                        </div>
                    )}
                </label>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={handleCancel}
                        disabled={isUploading}
                        className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                    >
                        {isUploading && <Spinner size="sm" className="mr-2" />}
                        {isUploading ? 'Uploading...' : 'Change Avatar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarUploadModal;

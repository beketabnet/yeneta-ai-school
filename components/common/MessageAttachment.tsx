/**
 * MessageAttachment Component
 * Professional, robust component for displaying message attachments
 * Supports: Images, Videos, Audio, Documents, and other file types
 * Features: Inline players, download, zoom, responsive design, accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { getFileInfo, downloadFile, getFileTypeIcon } from '../../utils/fileUtils';

interface MessageAttachmentProps {
    attachmentUrl: string;
    isOwnMessage?: boolean;
    className?: string;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({ 
    attachmentUrl, 
    isOwnMessage = false,
    className = '' 
}) => {
    const [fileInfo] = useState(() => getFileInfo(attachmentUrl));
    const [imageError, setImageError] = useState(false);
    const [isImageZoomed, setIsImageZoomed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Get full URL (handle relative URLs)
    const getFullUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Assume it's relative to backend
        return `http://localhost:8000${url.startsWith('/') ? url : '/' + url}`;
    };

    const fullUrl = getFullUrl(attachmentUrl);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await downloadFile(fullUrl, fileInfo.fileName);
    };

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    const toggleImageZoom = () => {
        setIsImageZoomed(!isImageZoomed);
    };

    // Render Image Attachment
    if (fileInfo.type === 'image' && !imageError) {
        return (
            <div className={`relative ${className}`}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                <img
                    src={fullUrl}
                    alt={fileInfo.fileName}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    onClick={toggleImageZoom}
                    className={`max-w-full rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 ${
                        isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                    loading="lazy"
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`${isOwnMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                        {getFileTypeIcon(fileInfo.type)} {fileInfo.fileName}
                    </span>
                    <button
                        onClick={handleDownload}
                        className={`px-2 py-1 rounded hover:bg-black/10 transition-colors ${
                            isOwnMessage ? 'text-white' : 'text-primary'
                        }`}
                        aria-label="Download image"
                    >
                        ⬇️ Download
                    </button>
                </div>

                {/* Image Zoom Modal */}
                {isImageZoomed && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={toggleImageZoom}
                    >
                        <button
                            onClick={toggleImageZoom}
                            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
                            aria-label="Close zoom"
                        >
                            ✕
                        </button>
                        <img
                            src={fullUrl}
                            alt={fileInfo.fileName}
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={handleDownload}
                            className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                            ⬇️ Download
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Render Video Attachment
    if (fileInfo.type === 'video' && fileInfo.isPlayable) {
        return (
            <div className={`relative ${className}`}>
                <video
                    ref={videoRef}
                    controls
                    preload="metadata"
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px', maxWidth: '100%' }}
                    onLoadedMetadata={() => setIsLoading(false)}
                >
                    <source src={fullUrl} type={fileInfo.mimeType} />
                    Your browser does not support the video tag.
                </video>
                <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`${isOwnMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                        {getFileTypeIcon(fileInfo.type)} {fileInfo.fileName}
                    </span>
                    <button
                        onClick={handleDownload}
                        className={`px-2 py-1 rounded hover:bg-black/10 transition-colors ${
                            isOwnMessage ? 'text-white' : 'text-primary'
                        }`}
                        aria-label="Download video"
                    >
                        ⬇️ Download
                    </button>
                </div>
            </div>
        );
    }

    // Render Audio Attachment
    if (fileInfo.type === 'audio' && fileInfo.isPlayable) {
        return (
            <div className={`${className}`}>
                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                    isOwnMessage ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                    <span className="text-2xl">{getFileTypeIcon(fileInfo.type)}</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                            isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                            {fileInfo.fileName}
                        </p>
                        <audio
                            ref={audioRef}
                            controls
                            preload="metadata"
                            className="w-full mt-2"
                            style={{ height: '40px' }}
                        >
                            <source src={fullUrl} type={fileInfo.mimeType} />
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                </div>
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleDownload}
                        className={`text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors ${
                            isOwnMessage ? 'text-white' : 'text-primary'
                        }`}
                        aria-label="Download audio"
                    >
                        ⬇️ Download
                    </button>
                </div>
            </div>
        );
    }

    // Render Document/File Attachment (PDF, DOC, etc.)
    if (fileInfo.type === 'document' || fileInfo.type === 'unknown') {
        return (
            <div className={`${className}`}>
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${
                    isOwnMessage 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}>
                    <span className="text-3xl">{getFileTypeIcon(fileInfo.type)}</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                            isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                            {fileInfo.fileName}
                        </p>
                        <p className={`text-xs ${
                            isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {fileInfo.extension.toUpperCase()} File
                        </p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            isOwnMessage
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-primary hover:bg-primary-dark text-white'
                        }`}
                        aria-label={`Download ${fileInfo.fileName}`}
                    >
                        ⬇️ Download
                    </button>
                </div>
            </div>
        );
    }

    // Fallback for any unhandled cases
    return (
        <div className={`${className}`}>
            <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isOwnMessage
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-primary hover:bg-primary-dark text-white'
                }`}
            >
                <span>📎</span>
                <span>View Attachment</span>
            </a>
        </div>
    );
};

export default MessageAttachment;

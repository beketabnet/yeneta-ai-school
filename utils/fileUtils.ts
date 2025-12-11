/**
 * File Utility Functions for Message Attachments
 * Handles file type detection, MIME type parsing, and file metadata extraction
 */

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'unknown';

export interface FileInfo {
    type: FileType;
    extension: string;
    mimeType: string;
    fileName: string;
    isPlayable: boolean;
    isViewable: boolean;
    isDownloadable: boolean;
}

/**
 * Extract file extension from URL or filename
 */
export const getFileExtension = (url: string): string => {
    try {
        // Remove query parameters and hash
        const cleanUrl = url.split('?')[0].split('#')[0];
        const parts = cleanUrl.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    } catch {
        return '';
    }
};

/**
 * Extract filename from URL
 */
export const getFileName = (url: string): string => {
    try {
        const cleanUrl = url.split('?')[0].split('#')[0];
        const parts = cleanUrl.split('/');
        return parts[parts.length - 1] || 'attachment';
    } catch {
        return 'attachment';
    }
};

/**
 * Determine MIME type from file extension
 */
export const getMimeTypeFromExtension = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon',
        
        // Videos
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        
        // Audio
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'flac': 'audio/flac',
        'aac': 'audio/aac',
        
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',
        
        // Archives
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Determine file type category from MIME type or extension
 */
export const getFileType = (mimeType: string, extension: string): FileType => {
    const mime = mimeType.toLowerCase();
    const ext = extension.toLowerCase();
    
    // Check MIME type first
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    
    // Check extension as fallback
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
    
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (documentExts.includes(ext)) return 'document';
    
    return 'unknown';
};

/**
 * Check if file type is playable in browser
 */
export const isPlayableInBrowser = (fileType: FileType, mimeType: string): boolean => {
    if (fileType === 'video') {
        // Modern browsers support these video formats
        return ['video/mp4', 'video/webm', 'video/ogg'].includes(mimeType);
    }
    
    if (fileType === 'audio') {
        // Modern browsers support these audio formats
        return ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'].includes(mimeType);
    }
    
    return false;
};

/**
 * Check if file type is viewable inline in browser
 */
export const isViewableInBrowser = (fileType: FileType, mimeType: string): boolean => {
    if (fileType === 'image') {
        // All common image formats are viewable
        return true;
    }
    
    if (fileType === 'document') {
        // PDF can be viewed inline
        return mimeType === 'application/pdf';
    }
    
    return false;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get comprehensive file information from URL
 */
export const getFileInfo = (url: string): FileInfo => {
    const extension = getFileExtension(url);
    const fileName = getFileName(url);
    const mimeType = getMimeTypeFromExtension(extension);
    const type = getFileType(mimeType, extension);
    const isPlayable = isPlayableInBrowser(type, mimeType);
    const isViewable = isViewableInBrowser(type, mimeType);
    const isDownloadable = true; // All files are downloadable
    
    return {
        type,
        extension,
        mimeType,
        fileName,
        isPlayable,
        isViewable,
        isDownloadable,
    };
};

/**
 * Get icon name for file type (for UI display)
 */
export const getFileTypeIcon = (fileType: FileType): string => {
    const icons: Record<FileType, string> = {
        'image': '🖼️',
        'video': '🎥',
        'audio': '🎵',
        'document': '📄',
        'unknown': '📎',
    };
    
    return icons[fileType];
};

/**
 * Trigger file download
 */
export const downloadFile = async (url: string, fileName?: string): Promise<void> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || getFileName(url);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
};

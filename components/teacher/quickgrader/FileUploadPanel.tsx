import React, { useState, useRef } from 'react';
import { UploadCloudIcon, DocumentTextIcon, XMarkIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';

interface FileUploadPanelProps {
  onFileUpload: (content: string, fileName: string) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

const FileUploadPanel: React.FC<FileUploadPanelProps> = ({
  onFileUpload,
  acceptedFormats = ['.txt', '.pdf', '.doc', '.docx'],
  maxSizeMB = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Validate file type
    const validExtensions = acceptedFormats;
    const isValidType = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType) {
      setError(`Please upload a valid file (${acceptedFormats.join(', ')})`);
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // Handle text files directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const content = await file.text();
        onFileUpload(content, file.name);
      } 
      // Handle PDF and Word files via backend
      else if (file.name.match(/\.(pdf|docx?|doc)$/i)) {
        try {
          const result = await apiService.extractFileText(file);
          onFileUpload(result.text, file.name);
        } catch (extractError: any) {
          console.error('Error extracting text from file:', extractError);
          setError(extractError.message || 'Failed to extract text from file. Please try again.');
          setUploadedFile(null);
        }
      } 
      else {
        setError(`Unsupported file format. Please upload ${acceptedFormats.join(', ')}`);
        setUploadedFile(null);
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file. Please try again.');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <DocumentTextIcon className="inline w-4 h-4 mr-1" />
        Upload Submission File
      </label>

      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
            isDragging
              ? 'border-primary bg-primary-light/20 dark:bg-primary-dark/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-medium"
              >
                Choose File
              </button>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                or drag and drop
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {acceptedFormats.join(', ')} up to {maxSizeMB}MB
            </p>
          </div>

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary-light/30 dark:bg-primary-dark/30 rounded-lg pointer-events-none">
              <p className="text-lg font-medium text-primary-dark dark:text-primary-light">
                Drop file here
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Remove file"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <svg className="animate-spin h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-700 dark:text-gray-300">Processing file...</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload submission file"
      />
    </div>
  );
};

export default FileUploadPanel;

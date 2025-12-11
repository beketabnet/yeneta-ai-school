import React, { useState, useRef } from 'react';
import { DocumentTextIcon, ArrowPathIcon } from '../../icons/Icons';

interface SubmissionTextInputProps {
    value: string;
    onChange: (value: string) => void;
    onFileUpload?: (content: string) => void;
    readOnly?: boolean;
    studentName?: string;
}

const SubmissionTextInput: React.FC<SubmissionTextInputProps> = ({
    value,
    onChange,
    onFileUpload,
    readOnly = true,
    studentName
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        const validTypes = ['text/plain', 'application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const validExtensions = ['.txt', '.pdf', '.doc', '.docx'];
        
        const isValidType = validTypes.includes(file.type) || 
                          validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValidType) {
            alert('Please upload a text file (.txt, .pdf, .doc, or .docx)');
            return;
        }

        try {
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const content = await file.text();
                if (onFileUpload) {
                    onFileUpload(content);
                } else {
                    onChange(content);
                }
            } else {
                // For PDF/DOC files, we'd need backend processing
                alert('PDF and DOC file support requires backend processing. Please use text files or paste content directly.');
            }
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Failed to read file');
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

    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    const charCount = value.length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <DocumentTextIcon className="inline w-4 h-4 mr-1" />
                    {studentName ? `${studentName}'s Submission` : 'Essay Text'}
                </label>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{wordCount} words</span>
                    <span>{charCount} chars</span>
                    <span>~{estimatedReadTime} min read</span>
                </div>
            </div>

            <div
                className={`relative border-2 rounded-md transition-colors ${
                    isDragging
                        ? 'border-primary bg-primary-light/20'
                        : 'border-gray-300 dark:border-gray-600'
                } ${readOnly ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    readOnly={readOnly}
                    rows={18}
                    placeholder={readOnly ? "Select a submission to view..." : "Paste essay text here or drag & drop a file..."}
                    className="w-full p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-sm"
                />

                {isDragging && !readOnly && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-light/30 dark:bg-primary-dark/30 rounded-md pointer-events-none">
                        <div className="text-center">
                            <ArrowPathIcon className="w-12 h-12 mx-auto text-primary" />
                            <p className="mt-2 text-sm font-medium text-primary-dark dark:text-primary-light">
                                Drop submission file here
                            </p>
                        </div>
                    </div>
                )}

                {!value && readOnly && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-gray-400 dark:text-gray-500">
                            <DocumentTextIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No submission selected</p>
                        </div>
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Upload File
                    </button>

                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    >
                        Clear
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx,text/plain"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload submission file"
            />

            {wordCount > 0 && (
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div>
                        <span className="font-medium">Length:</span>{' '}
                        {wordCount < 100 ? '🟡 Short' : wordCount < 500 ? '🟢 Medium' : '🔵 Long'}
                    </div>
                    <div>
                        <span className="font-medium">Estimated Grade Time:</span>{' '}
                        {Math.ceil(estimatedReadTime * 1.5)} min
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionTextInput;

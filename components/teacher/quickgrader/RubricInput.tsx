import React, { useState, useRef } from 'react';
import { DocumentTextIcon, SparklesIcon, ArrowPathIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';

interface RubricInputProps {
    value: string;
    onChange: (value: string) => void;
    onImportFromGenerator?: () => void;
    onFileUpload?: (content: string) => void;
    readOnly?: boolean;
    placeholder?: string;
}

const RubricInput: React.FC<RubricInputProps> = ({
    value,
    onChange,
    onImportFromGenerator,
    onFileUpload,
    readOnly = false,
    placeholder = "Enter grading rubric here...\n\nExample:\n1. Content Quality (30 points)\n   - Depth and accuracy of information\n2. Organization (20 points)\n   - Clear structure and flow\n..."
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        setError(null);
        setIsProcessing(true);

        try {
            let content: string;
            
            // Handle text files directly
            if (file.type === 'text/plain' || file.name.match(/\.(txt|md|json)$/i)) {
                content = await file.text();
            }
            // Handle PDF and Word files via backend
            else if (file.name.match(/\.(pdf|docx?|doc)$/i)) {
                try {
                    const result = await apiService.extractFileText(file);
                    content = result.text;
                } catch (extractError: any) {
                    console.error('Error extracting text from file:', extractError);
                    setError(extractError.message || 'Failed to extract text from file');
                    setIsProcessing(false);
                    return;
                }
            }
            else {
                setError('Please upload a valid file (.txt, .md, .json, .pdf, .docx, .doc)');
                setIsProcessing(false);
                return;
            }

            if (onFileUpload) {
                onFileUpload(content);
            } else {
                onChange(content);
            }
        } catch (err) {
            console.error('Error reading file:', err);
            setError('Failed to read file. Please try again.');
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
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    const charCount = value.length;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <DocumentTextIcon className="inline w-4 h-4 mr-1" />
                    Grading Rubric
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {wordCount} words, {charCount} chars
                    </span>
                </div>
            </div>

            <div
                className={`relative border-2 rounded-md transition-colors ${
                    isDragging
                        ? 'border-primary bg-primary-light/20'
                        : 'border-gray-300 dark:border-gray-600'
                } ${readOnly ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    readOnly={readOnly}
                    rows={12}
                    placeholder={placeholder}
                    className="w-full p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-transparent text-sm font-mono"
                />

                {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-light/30 dark:bg-primary-dark/30 rounded-md pointer-events-none">
                        <div className="text-center">
                            <ArrowPathIcon className="w-12 h-12 mx-auto text-primary" />
                            <p className="mt-2 text-sm font-medium text-primary-dark dark:text-primary-light">
                                Drop rubric file here
                            </p>
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

                    {onImportFromGenerator && (
                        <button
                            type="button"
                            onClick={onImportFromGenerator}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition"
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            Import from Library
                        </button>
                    )}

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
                accept=".txt,.md,.json,.pdf,.docx,.doc,text/plain,text/markdown,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileInputChange}
                className="hidden"
            />

            {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {isProcessing && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs text-gray-700 dark:text-gray-300">Extracting text from file...</span>
                </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>💡 <strong>Tips:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Write rubric criteria with point values</li>
                    <li>Drag & drop PDF, Word, or text files to import</li>
                    <li>Use Rubric Generator for AI-powered rubrics</li>
                    <li>Supports large rubrics (10,000+ characters)</li>
                </ul>
            </div>
        </div>
    );
};

export default RubricInput;

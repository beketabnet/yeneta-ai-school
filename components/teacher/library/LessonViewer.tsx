import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SavedLesson } from '../../../types';
import { XMarkIcon, DownloadIcon } from '../../icons/Icons';

interface LessonViewerProps {
    lesson: SavedLesson;
    onClose: () => void;
    onExport: (format: 'pdf' | 'docx' | 'txt') => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, onClose, onExport }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{lesson.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {lesson.subject} • {lesson.grade} • {new Date(lesson.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block z-10">
                                <button onClick={() => onExport('pdf')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">PDF</button>
                                <button onClick={() => onExport('docx')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Word</button>
                                <button onClick={() => onExport('txt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Text</button>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {lesson.rag_enabled && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">✅ Enhanced with Ethiopian Curriculum</span>
                            </div>
                            {lesson.curriculum_sources && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Sources: {lesson.curriculum_sources.join(', ')}
                                </p>
                            )}
                        </div>
                    )}
                    
                    <div className="prose dark:prose-invert max-w-none">
                         <ReactMarkdown>{lesson.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonViewer;

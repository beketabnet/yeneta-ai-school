import React from 'react';
import { SavedLesson } from '../../../types';
import { ClockIcon, UserCircleIcon, BookOpenIcon, TrashIcon, EyeIcon, ShareIcon, DownloadIcon } from '../../icons/Icons';

interface LessonCardProps {
    lesson: SavedLesson;
    onView: (lesson: SavedLesson) => void;
    onDelete: (id: number) => void;
    onShare: (lesson: SavedLesson) => void;
    onExport: (lesson: SavedLesson) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onView, onDelete, onShare, onExport }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            {lesson.grade}
                        </span>
                        {lesson.rag_enabled && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Enhanced
                            </span>
                        )}
                    </div>
                    <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <span className="sr-only">Options</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        {/* Dropdown menu would go here */}
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary cursor-pointer" onClick={() => onView(lesson)}>
                    {lesson.title}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>{lesson.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Topic:</span>
                        <span className="truncate">{lesson.topic}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 px-5 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-xl flex justify-between items-center">
                <button 
                    onClick={() => onView(lesson)}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary flex items-center gap-1.5"
                >
                    <EyeIcon className="w-4 h-4" />
                    View
                </button>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onExport(lesson)}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Export"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(lesson.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonCard;

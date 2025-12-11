import React from 'react';
import { XMarkIcon, AcademicCapIcon, BookOpenIcon, ClockIcon, SparklesIcon } from '../../icons/Icons';
import { SavedQuiz } from '../../../types';

interface QuizViewerProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: SavedQuiz | null;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ isOpen, onClose, quiz }) => {
    if (!isOpen || !quiz) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {quiz.title}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <AcademicCapIcon className="w-4 h-4" />
                                <span>{quiz.grade_level}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookOpenIcon className="w-4 h-4" />
                                <span>{quiz.subject}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{quiz.duration_minutes} mins</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                    {quiz.difficulty}
                                </span>
                            </div>
                            {quiz.use_rag && (
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>AI Enhanced</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        aria-label="Close viewer"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Description
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">{quiz.description}</p>
                    </section>

                    {/* Questions */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Questions ({quiz.questions?.length || 0})
                        </h3>
                        <div className="space-y-6">
                            {quiz.questions && quiz.questions.map((question, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-medium text-gray-900 dark:text-white flex-1">
                                            <span className="font-bold mr-2">Q{index + 1}.</span>
                                            {question.text}
                                        </h4>
                                        <span className="ml-4 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                                            {question.points} pts
                                        </span>
                                    </div>

                                    {/* Options for Multiple Choice */}
                                    {question.type === 'multiple_choice' && question.options && (
                                        <div className="ml-6 space-y-2 mb-3">
                                            {question.options.map((option, optIndex) => {
                                                const isCorrect = String(optIndex) === String(question.correct_answer) ||
                                                    option === question.correct_answer ||
                                                    String.fromCharCode(65 + optIndex) === question.correct_answer;

                                                return (
                                                    <div
                                                        key={optIndex}
                                                        className={`p-2 rounded text-sm flex items-center ${isCorrect
                                                            ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                                                            }`}
                                                    >
                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 text-xs font-bold ${isCorrect
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                            }`}>
                                                            {String.fromCharCode(65 + optIndex)}
                                                        </span>
                                                        <span className={isCorrect ? 'font-medium text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'}>
                                                            {option}
                                                        </span>
                                                        {isCorrect && (
                                                            <span className="ml-auto text-xs font-bold text-green-600 dark:text-green-400">
                                                                Correct Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* True/False */}
                                    {question.type === 'true_false' && (
                                        <div className="ml-6 flex gap-4 mb-3">
                                            {['True', 'False'].map((val) => {
                                                const isCorrect = val.toLowerCase() === String(question.correct_answer).toLowerCase();
                                                return (
                                                    <div
                                                        key={val}
                                                        className={`px-4 py-2 rounded text-sm font-medium border ${isCorrect
                                                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200'
                                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'
                                                            }`}
                                                    >
                                                        {val} {isCorrect && '✓'}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                                            <span className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">Explanation:</span>
                                            <p className="text-blue-800 dark:text-blue-300">{question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created by: {quiz.teacher_name || 'Unknown'}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizViewer;

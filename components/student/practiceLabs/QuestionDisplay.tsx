import React, { useState } from 'react';
import { PracticeQuestion } from './types';
import { LightBulbIcon } from '../../icons/Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface QuestionDisplayProps {
    question: PracticeQuestion;
    userAnswer: string;
    onAnswerChange: (answer: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    showHint: boolean;
    onToggleHint: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    userAnswer,
    onAnswerChange,
    onSubmit,
    isLoading,
    showHint,
    onToggleHint
}) => {
    const [selectedOption, setSelectedOption] = useState<string>('');

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
        onAnswerChange(option);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-green-600/20';
            case 'medium':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 ring-yellow-600/20';
            case 'hard':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ring-red-600/20';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 ring-gray-600/20';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            {/* Decorative Top Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${question.difficulty === 'easy' ? 'bg-green-500' :
                    question.difficulty === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                }`} />

            {/* Question Header */}
            <div className="mb-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide uppercase">
                    Grade {question.gradeLevel}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ring-1 ring-inset ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                </span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold tracking-wide uppercase ring-1 ring-inset ring-blue-600/20">
                    {question.subject}
                </span>
                {question.topic && (
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold tracking-wide uppercase ring-1 ring-inset ring-purple-600/20">
                        {question.topic}
                    </span>
                )}
            </div>

            {/* RAG Status Badge */}
            {question.ragStatus && question.ragStatus !== 'disabled' && (
                <div className="mb-6">
                    {question.ragStatus === 'success' && question.curriculumSources && question.curriculumSources.length > 0 && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                            <span className="text-green-600 dark:text-green-400 text-sm font-bold">
                                ✅ Based on {typeof question.curriculumSources[0] === 'object' && question.curriculumSources[0].type === 'exam'
                                    ? `${question.curriculumSources[0].exam_type} Exam`
                                    : 'Curriculum Content'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Passage (if present) */}
            {question.passage && (
                <div className="mb-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-xl">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
                        📖 Reading Passage
                    </h4>
                    <div className="prose dark:prose-invert max-w-none prose-sm">
                        <MarkdownRenderer
                            content={question.passage}
                            className="text-gray-800 dark:text-gray-200 leading-relaxed font-serif"
                        />
                    </div>
                </div>
            )}

            {/* Question Text */}
            <div className="mb-8">
                <MarkdownRenderer
                    content={question.question}
                    className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white leading-relaxed"
                />
            </div>

            {/* Answer Input Based on Question Type */}
            <div className="mb-8 space-y-4">
                {question.questionType === 'multiple_choice' && question.options && (
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all group relative overflow-hidden ${selectedOption === option
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedOption === option
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400 group-hover:border-indigo-400'
                                        }`}>
                                        {selectedOption === option ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="font-bold text-sm">{String.fromCharCode(65 + index)}</span>
                                        )}
                                    </div>
                                    <span className={`text-base font-medium transition-colors ${selectedOption === option ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {option}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {question.questionType === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                        {['True', 'False'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleOptionSelect(option)}
                                className={`p-6 rounded-xl border-2 text-center transition-all ${selectedOption === option
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md transform scale-[1.02]'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className={`text-xl font-bold ${selectedOption === option ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {option}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {(question.questionType === 'short_answer' ||
                    question.questionType === 'essay' ||
                    question.questionType === 'fill_blank') && (
                        <div className="relative">
                            <textarea
                                value={userAnswer}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={question.questionType === 'essay' ? 8 : 4}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 transition-all resize-none text-base font-medium placeholder:text-gray-400"
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
                                {userAnswer.length} chars
                            </div>
                        </div>
                    )}
            </div>

            {/* Hint & Submit Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                <button
                    onClick={onToggleHint}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${showHint
                            ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                        }`}
                >
                    <LightBulbIcon className={`w-5 h-5 ${showHint ? 'animate-pulse' : ''}`} />
                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                </button>

                <div className="w-full sm:w-auto">
                    <button
                        onClick={onSubmit}
                        disabled={(!userAnswer && !selectedOption) || isLoading}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/30 font-bold text-lg"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Evaluating...
                            </span>
                        ) : (
                            'Submit Answer'
                        )}
                    </button>
                </div>
            </div>

            {showHint && question.hints && question.hints.length > 0 && (
                <div className="mt-4 p-5 bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                        <span>💡</span> Helpful Hint
                    </h4>
                    <ul className="space-y-2">
                        {question.hints.map((hint, index) => (
                            <li key={index} className="text-sm text-yellow-800 dark:text-yellow-100 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                                {hint}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default QuestionDisplay;

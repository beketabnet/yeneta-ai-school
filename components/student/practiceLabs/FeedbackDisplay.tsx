import React from 'react';
import { AdaptiveFeedback } from './types';
import { CheckCircleIcon, LightBulbIcon } from '../../icons/Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface FeedbackDisplayProps {
    feedback: AdaptiveFeedback;
    onNextQuestion: () => void;
    onNewSession: () => void;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
    feedback,
    onNextQuestion,
    onNewSession
}) => {
    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score and Status */}
            <div className={`relative p-8 rounded-2xl border-2 mb-6 overflow-hidden ${feedback.isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg shadow-green-500/10'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 shadow-lg shadow-yellow-500/10'
                }`}>
                {/* Background Decorator */}
                <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10 filter blur-2xl ${feedback.isCorrect ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${feedback.isCorrect ? 'bg-green-100 dark:bg-green-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'
                            }`}>
                            {feedback.isCorrect ? (
                                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                            ) : (
                                <LightBulbIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {feedback.isCorrect ? '🎉 Excellent Work!' : '💡 Good Try!'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                                {feedback.isCorrect ? 'You nailed it!' : 'Let\'s learn from this and improve.'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                        <span className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Score</span>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                {feedback.score}
                            </span>
                            <span className="text-lg font-bold text-gray-500 dark:text-gray-400">/100</span>
                        </div>
                    </div>
                </div>

                {/* XP Earned */}
                {feedback.xpEarned && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg inline-flex border border-purple-200 dark:border-purple-800">
                        <span>⭐</span>
                        <span>+{feedback.xpEarned} XP Earned!</span>
                    </div>
                )}
            </div>

            {/* Motivational Message */}
            {feedback.motivationalMessage && (
                <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 mb-6 text-center shadow-sm">
                    <p className="text-base font-semibold text-purple-900 dark:text-purple-200">
                        "{feedback.motivationalMessage}"
                    </p>
                </div>
            )}

            <div className="space-y-6">
                {/* Feedback */}
                <div className="p-6 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        💬 Detailed Feedback
                    </h4>
                    <MarkdownRenderer
                        content={feedback.feedback}
                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    />
                </div>

                {/* Explanation */}
                {feedback.explanation && (
                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2 uppercase text-sm tracking-wide">
                            <span className="w-1.5 h-6 bg-blue-400 rounded-full"></span>
                            📚 Deep Dive Explanation
                        </h4>
                        <MarkdownRenderer
                            content={feedback.explanation}
                            className="text-gray-800 dark:text-gray-200 leading-relaxed"
                        />
                    </div>
                )}

                {/* Hints */}
                {feedback.hints && feedback.hints.length > 0 && (
                    <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
                        <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2 uppercase text-sm tracking-wide">
                            <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
                            💡 Hints for Next Time
                        </h4>
                        <ul className="space-y-2">
                            {feedback.hints.map((hint, index) => (
                                <li key={index} className="flex items-start gap-3 text-gray-800 dark:text-gray-200">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                                    <span>{hint}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Skills Improved & Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.skillsImproved && feedback.skillsImproved.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
                                🎯 Skills Demonstrated
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {feedback.skillsImproved.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-xs font-bold border border-green-200 dark:border-green-800"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {feedback.difficultyAdjustment && feedback.difficultyAdjustment !== 'same' && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide">
                                📈 Path Adjustment
                            </h4>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {feedback.difficultyAdjustment === 'harder'
                                    ? 'Leveled Up! Next question will be more challenging.'
                                    : 'Adjusting pace. Next question will align with your current needs.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Next Steps */}
                {feedback.nextSteps && (
                    <div className="p-6 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-900/30">
                        <h4 className="font-bold text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2 uppercase text-sm tracking-wide">
                            <span className="w-1.5 h-6 bg-violet-400 rounded-full"></span>
                            🚀 Recommended Next Steps
                        </h4>
                        <MarkdownRenderer
                            content={feedback.nextSteps}
                            className="text-gray-800 dark:text-gray-200 leading-relaxed"
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onNextQuestion}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 font-bold text-lg flex items-center justify-center gap-2"
                >
                    Continue Journey <span className="text-xl">→</span>
                </button>
                <button
                    onClick={onNewSession}
                    className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-bold text-lg"
                >
                    Wrap Up
                </button>
            </div>
        </div>
    );
};

export default FeedbackDisplay;

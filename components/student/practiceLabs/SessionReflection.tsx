import React from 'react';
import { SessionReflection as SessionReflectionType } from './types';
import { CheckCircleIcon, TrophyIcon } from '../../icons/Icons';

interface SessionReflectionProps {
    reflection: SessionReflectionType;
    onClose: () => void;
}

const SessionReflection: React.FC<SessionReflectionProps> = ({ reflection, onClose }) => {
    const getPerformanceColor = (performance: string) => {
        switch (performance.toLowerCase()) {
            case 'excellent':
                return 'text-green-600 dark:text-green-400';
            case 'good':
                return 'text-blue-600 dark:text-blue-400';
            case 'fair':
                return 'text-yellow-600 dark:text-yellow-400';
            default:
                return 'text-orange-600 dark:text-orange-400';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrophyIcon className="w-10 h-10" />
                            <div>
                                <h2 className="text-2xl font-bold">Session Complete!</h2>
                                <p className="text-purple-100">Here's how you did</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">+{reflection.xpEarned}</div>
                            <div className="text-sm text-purple-100">XP Earned</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Overall Performance */}
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Performance</p>
                        <p className={`text-3xl font-bold ${getPerformanceColor(reflection.overallPerformance)}`}>
                            {reflection.overallPerformance}
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Summary</h3>
                        <p className="text-gray-700 dark:text-gray-300">{reflection.summary}</p>
                    </div>

                    {/* Achievements Unlocked */}
                    {reflection.achievementsUnlocked && reflection.achievementsUnlocked.length > 0 && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                🏆 Achievements Unlocked!
                            </h3>
                            <div className="space-y-2">
                                {reflection.achievementsUnlocked.map((achievement, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded"
                                    >
                                        <CheckCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            {achievement}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Strengths */}
                    {reflection.strengths && reflection.strengths.length > 0 && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💪 Strengths</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {reflection.strengths.map((strength, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                        {strength}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Areas for Improvement */}
                    {reflection.areasForImprovement && reflection.areasForImprovement.length > 0 && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Areas for Improvement</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {reflection.areasForImprovement.map((area, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                        {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Patterns Observed */}
                    {reflection.patterns && reflection.patterns.length > 0 && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔍 Patterns Observed</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {reflection.patterns.map((pattern, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                        {pattern}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {reflection.recommendations && reflection.recommendations.length > 0 && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Recommendations</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {reflection.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Study Tips */}
                    {reflection.studyTips && reflection.studyTips.length > 0 && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📚 Study Tips</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {reflection.studyTips.map((tip, index) => (
                                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Next Session Focus */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Next Session Focus</h3>
                        <p className="text-gray-700 dark:text-gray-300">{reflection.nextSessionFocus}</p>
                    </div>

                    {/* Motivational Message */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {reflection.motivationalMessage}
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionReflection;

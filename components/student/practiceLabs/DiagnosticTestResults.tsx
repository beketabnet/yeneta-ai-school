import React from 'react';
import { DiagnosticTest, PracticeQuestion } from './types';

interface DiagnosticTestResultsProps {
    test: DiagnosticTest;
    answers: Record<string, string>;
    evaluation: DiagnosticEvaluation;
    onRetry: () => void;
    onContinuePractice: () => void;
}

interface DiagnosticEvaluation {
    overallScore: number;
    totalQuestions: number;
    correctAnswers: number;
    skillAssessment: SkillAssessment[];
    recommendations: string[];
    strengthAreas: string[];
    improvementAreas: string[];
    suggestedTopics: string[];
}

interface SkillAssessment {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    score: number;
    feedback: string;
}

const DiagnosticTestResults: React.FC<DiagnosticTestResultsProps> = ({
    test,
    answers,
    evaluation,
    onRetry,
    onContinuePractice
}) => {
    const scorePercentage = (evaluation.correctAnswers / evaluation.totalQuestions) * 100;
    
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600 dark:text-green-400';
        if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
        if (percentage >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (percentage >= 60) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        if (percentage >= 40) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'advanced':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'intermediate':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Overall Score */}
            <div className={`rounded-lg p-6 border ${getScoreBgColor(scorePercentage)}`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Diagnostic Test Complete! 🎉
                    </h2>
                    <div className={`text-6xl font-bold mb-4 ${getScoreColor(scorePercentage)}`}>
                        {scorePercentage.toFixed(0)}%
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        {evaluation.correctAnswers} out of {evaluation.totalQuestions} correct
                    </p>
                </div>
            </div>

            {/* Skill Assessment */}
            {evaluation.skillAssessment && evaluation.skillAssessment.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        📊 Skill Assessment
                    </h3>
                    <div className="space-y-4">
                        {evaluation.skillAssessment.map((skill, index) => (
                            <div key={index} className="border-l-4 border-purple-500 pl-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {skill.skill}
                                    </h4>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelBadgeColor(skill.level)}`}>
                                        {skill.level}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${skill.score}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {skill.feedback}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strengths and Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                {evaluation.strengthAreas && evaluation.strengthAreas.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            💪 Strengths
                        </h3>
                        <ul className="space-y-2">
                            {evaluation.strengthAreas.map((strength, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Areas for Improvement */}
                {evaluation.improvementAreas && evaluation.improvementAreas.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            📈 Focus Areas
                        </h3>
                        <ul className="space-y-2">
                            {evaluation.improvementAreas.map((area, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">→</span>
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        💡 Recommendations
                    </h3>
                    <ul className="space-y-2">
                        {evaluation.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                <span>{recommendation}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Suggested Topics */}
            {evaluation.suggestedTopics && evaluation.suggestedTopics.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        🎯 Suggested Practice Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {evaluation.suggestedTopics.map((topic, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-sm rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onRetry}
                    className="flex-1 px-6 py-3 rounded-lg border-2 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                >
                    🔄 Retake Diagnostic Test
                </button>
                <button
                    onClick={onContinuePractice}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium"
                >
                    ✨ Start Targeted Practice
                </button>
            </div>
        </div>
    );
};

export default DiagnosticTestResults;

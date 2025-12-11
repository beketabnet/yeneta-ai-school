import React from 'react';
import { ExamReviewReport as ExamReviewReportType, QuestionReview } from './types';
import Card from '../../Card';

interface ExamReviewReportProps {
    report: ExamReviewReportType;
    onClose: () => void;
}

const ExamReviewReport: React.FC<ExamReviewReportProps> = ({ report, onClose }) => {
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (score: number): string => {
        if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
        if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                📊 Exam Review Report
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Detailed analysis of your exam performance
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Overall Score */}
                    <div className={`${getScoreBgColor(report.score)} rounded-lg p-6 border-2 ${
                        report.score >= 80 ? 'border-green-300 dark:border-green-700' :
                        report.score >= 60 ? 'border-yellow-300 dark:border-yellow-700' :
                        'border-red-300 dark:border-red-700'
                    }`}>
                        <div className="text-center">
                            <div className={`text-6xl font-bold ${getScoreColor(report.score)} mb-2`}>
                                {report.score}%
                            </div>
                            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {report.correctAnswers} / {report.totalQuestions} Correct
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Time Spent: {formatTime(report.timeSpent)}
                            </div>
                        </div>
                    </div>

                    {/* Performance by Topic */}
                    <Card title="📚 Performance by Topic">
                        <div className="space-y-3">
                            {Object.entries(report.performanceByTopic).map(([topic, stats]) => {
                                const topicStats = stats as { correct: number; total: number };
                                const topicScore = (topicStats.correct / topicStats.total) * 100;
                                return (
                                    <div key={topic} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {topic}
                                            </span>
                                            <span className={`text-sm font-bold ${getScoreColor(topicScore)}`}>
                                                {topicStats.correct}/{topicStats.total} ({Math.round(topicScore)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    topicScore >= 80 ? 'bg-green-500' :
                                                    topicScore >= 60 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${topicScore}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Misconceptions Detected */}
                    {report.misconceptions && report.misconceptions.length > 0 && (
                        <Card title="⚠️ Misconceptions Detected">
                            <div className="space-y-3">
                                {report.misconceptions.map((misconception, idx) => (
                                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">❌</span>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                                                    {misconception.topic}: {misconception.misconceptionType}
                                                </h4>
                                                <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                                                    Occurred {misconception.frequency} time(s)
                                                </p>
                                                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <strong>Remediation:</strong> {misconception.remediation}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Question-by-Question Review */}
                    <Card title="📝 Question-by-Question Review">
                        <div className="space-y-4">
                            {report.questionReviews.map((review, idx) => (
                                <div key={idx} className={`border-l-4 ${
                                    review.isCorrect ? 'border-green-500' : 'border-red-500'
                                } pl-4 py-2`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">
                                                Question {idx + 1}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                review.isCorrect 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                                {review.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {review.score}%
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <strong>Q:</strong> {review.question.question}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                        <div>
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Your Answer:</span>
                                            <div className={`mt-1 ${review.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                                {review.studentAnswer}
                                            </div>
                                        </div>
                                        {!review.isCorrect && (
                                            <div>
                                                <span className="font-medium text-gray-600 dark:text-gray-400">Correct Answer:</span>
                                                <div className="mt-1 text-green-700 dark:text-green-400">
                                                    {review.question.correctAnswer}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm text-blue-900 dark:text-blue-200">
                                        <strong>Explanation:</strong> {review.explanation}
                                    </div>

                                    {review.misconceptionsDetected && review.misconceptionsDetected.length > 0 && (
                                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                            <strong>Misconceptions:</strong> {review.misconceptionsDetected.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recommendations */}
                    {report.recommendations && report.recommendations.length > 0 && (
                        <Card title="💡 Recommendations">
                            <ul className="space-y-2">
                                {report.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="text-blue-500 mt-0.5">→</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Start New Practice Session
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            📄 Print Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamReviewReport;

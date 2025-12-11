import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '../icons/Icons';

interface GradeInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (score: number, feedback: string) => Promise<void>;
    studentName: string;
    subject: string;
    assignmentType?: string;
    examType?: string;
    currentScore?: number;
    maxScore?: number;
    currentFeedback?: string;
    isLoading?: boolean;
}

export const GradeInputModal: React.FC<GradeInputModalProps> = ({
    isOpen,
    onClose,
    onSave,
    studentName,
    subject,
    assignmentType,
    examType,
    currentScore,
    maxScore = 100,
    currentFeedback = '',
    isLoading = false
}) => {
    const [score, setScore] = useState<string>(currentScore?.toString() || '');
    const [feedback, setFeedback] = useState<string>(currentFeedback);
    const [error, setError] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setScore(currentScore?.toString() || '');
            setFeedback(currentFeedback);
            setError('');
        }
    }, [isOpen, currentScore, currentFeedback]);

    const handleSave = async () => {
        setError('');

        // Validation
        if (!score.trim()) {
            setError('Please enter a score');
            return;
        }

        const scoreNum = parseFloat(score);
        if (isNaN(scoreNum)) {
            setError('Please enter a valid number');
            return;
        }

        if (scoreNum < 0) {
            setError('Score cannot be negative');
            return;
        }

        if (scoreNum > maxScore) {
            setError(`Score cannot exceed ${maxScore}`);
            return;
        }

        try {
            setIsSaving(true);
            await onSave(scoreNum, feedback);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save grade');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const gradeType = assignmentType || examType || 'Grade';

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Enter Grade
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        aria-label="Close"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Student Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Student:</span> {studentName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Subject:</span> {subject}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Type:</span> {gradeType}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">❌ {error}</p>
                        </div>
                    )}

                    {/* Score Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Score (out of {maxScore}) *
                        </label>
                        <input
                            type="number"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            min="0"
                            max={maxScore}
                            step="0.5"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            disabled={isSaving || isLoading}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Enter a value between 0 and {maxScore}
                        </p>
                    </div>

                    {/* Feedback */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Feedback (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Add feedback for the student..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            disabled={isSaving || isLoading}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isSaving || isLoading}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Grade'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeInputModal;

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '../../icons/Icons';

export interface GradeTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gradeData: any) => Promise<void>;
  studentName: string;
  subject: string;
  gradeType: 'assignment' | 'quiz' | 'mid_exam' | 'final_exam';
  currentScore?: number;
  isSaving?: boolean;
}

const SCORE_CONFIGS = {
  assignment: {
    label: 'Assignment Score',
    max: 100,
    description: 'Enter the assignment score',
  },
  quiz: {
    label: 'Quiz Score',
    max: 100,
    description: 'Enter the quiz score',
  },
  mid_exam: {
    label: 'Mid Exam Score',
    max: 100,
    description: 'Enter the mid exam score',
  },
  final_exam: {
    label: 'Final Exam Score',
    max: 100,
    description: 'Enter the final exam score',
  },
};

const GradeTypeModal: React.FC<GradeTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentName,
  subject,
  gradeType,
  currentScore = 0,
  isSaving = false,
}) => {
  const [score, setScore] = useState(currentScore);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setScore(currentScore);
    setFeedback('');
    setError('');
  }, [isOpen, currentScore]);

  const config = SCORE_CONFIGS[gradeType];
  const isValid = score >= 0 && score <= config.max;

  const handleSave = async () => {
    if (!isValid) {
      setError(`Score must be between 0 and ${config.max}`);
      return;
    }

    try {
      await onSave({
        score,
        feedback,
        gradeType,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {config.label}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {studentName} - {subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isSaving}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {config.description}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Score (0 - {config.max})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={config.max}
                step="0.5"
                value={score}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScore(isNaN(val) ? 0 : val);
                  setError('');
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                /{config.max}
              </span>
            </div>
            {isValid && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Percentage: {((score / config.max) * 100).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add any comments or feedback for the student..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeTypeModal;

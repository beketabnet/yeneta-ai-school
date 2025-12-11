import React, { useState } from 'react';
import { PencilIcon } from '../icons/Icons';

interface GradeEntryFieldProps {
  gradeId?: number;
  score: number | null;
  maxScore: number;
  feedback?: string;
  gradeType: string; // e.g., "Quiz", "Assignment", "Mid Exam"
  onSave: (score: number, feedback: string) => Promise<void>;
  onEdit?: () => void;
  isLoading?: boolean;
}

const GradeEntryField: React.FC<GradeEntryFieldProps> = ({
  gradeId,
  score,
  maxScore,
  feedback = '',
  gradeType,
  onSave,
  onEdit,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editScore, setEditScore] = useState(score?.toString() || '');
  const [editFeedback, setEditFeedback] = useState(feedback);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const percentage = score !== null ? ((score / maxScore) * 100).toFixed(1) : null;

  const getScoreColor = (pct: number | null) => {
    if (pct === null) return 'text-gray-500';
    if (pct >= 80) return 'text-green-600 dark:text-green-400';
    if (pct >= 60) return 'text-blue-600 dark:text-blue-400';
    if (pct >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleSave = async () => {
    setError(null);
    
    // Validate score
    const scoreNum = parseFloat(editScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
      setError(`Score must be between 0 and ${maxScore}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(scoreNum, editFeedback);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditScore(score?.toString() || '');
    setEditFeedback(feedback);
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max={maxScore}
            step="0.1"
            value={editScore}
            onChange={(e) => setEditScore(e.target.value)}
            placeholder="Score"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 py-1">/ {maxScore}</span>
        </div>
        
        <textarea
          value={editFeedback}
          onChange={(e) => setEditFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          rows={2}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSaving}
        />

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex-1">
        {score !== null ? (
          <div>
            <p className={`font-bold ${getScoreColor(parseFloat(percentage || '0'))}`}>
              {score.toFixed(1)} / {maxScore}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {percentage}%
            </p>
            {feedback && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                {feedback.substring(0, 50)}{feedback.length > 50 ? '...' : ''}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No grade entered</p>
        )}
      </div>
      
      <button
        onClick={() => {
          setIsEditing(true);
          onEdit?.();
        }}
        disabled={isLoading}
        className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors disabled:opacity-50"
        title="Edit grade"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default GradeEntryField;

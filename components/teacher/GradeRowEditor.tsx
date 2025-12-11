import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '../icons/Icons';

export interface StudentGrade {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  graded_at: string;
}

interface GradeRowEditorProps {
  grade: StudentGrade;
  onEdit: (grade: StudentGrade) => void;
  onDelete: (gradeId: number) => void;
  onUpdate: (gradeId: number, updatedData: Partial<StudentGrade>) => Promise<void>;
  isDeleting?: boolean;
}

const GradeRowEditor: React.FC<GradeRowEditorProps> = ({
  grade,
  onEdit,
  onDelete,
  onUpdate,
  isDeleting = false
}) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editedScore, setEditedScore] = useState(grade.score.toString());
  const [editedFeedback, setEditedFeedback] = useState(grade.feedback);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveInline = async () => {
    setIsSaving(true);
    try {
      const score = parseFloat(editedScore);
      if (isNaN(score) || score < 0 || score > grade.max_score) {
        alert(`Score must be between 0 and ${grade.max_score}`);
        return;
      }

      await onUpdate(grade.id, {
        score,
        feedback: editedFeedback,
        percentage: (score / grade.max_score) * 100
      });

      setIsInlineEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedScore(grade.score.toString());
    setEditedFeedback(grade.feedback);
    setIsInlineEditing(false);
  };

  if (isInlineEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/20 border-b">
        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
          {grade.student_name}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
          {grade.subject}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
            {grade.assignment_type || grade.exam_type || 'N/A'}
          </span>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm">
          <input
            type="number"
            min="0"
            max={grade.max_score}
            step="0.1"
            value={editedScore}
            onChange={(e) => setEditedScore(e.target.value)}
            placeholder="Score"
            aria-label={`Score for ${grade.student_name}`}
            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
          />
          <span className="ml-1 text-gray-600 dark:text-gray-400">/ {grade.max_score}</span>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
          {((parseFloat(editedScore) / grade.max_score) * 100).toFixed(1)}%
        </td>
        <td className="px-4 py-2 text-sm">
          <input
            type="text"
            value={editedFeedback}
            onChange={(e) => setEditedFeedback(e.target.value)}
            placeholder="Add feedback..."
            aria-label={`Feedback for ${grade.student_name}`}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
          />
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2 flex">
          <button
            onClick={handleSaveInline}
            disabled={isSaving}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 disabled:opacity-50"
            title="Save changes"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            title="Cancel editing"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
        {grade.student_name}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {grade.subject}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
          {grade.assignment_type || grade.exam_type || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {grade.score}/{grade.max_score}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
        {grade.percentage.toFixed(1)}%
      </td>
      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
        {grade.feedback || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2 flex">
        <button
          onClick={() => setIsInlineEditing(true)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          title="Edit grade"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(grade.id)}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
          title="Delete grade"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default GradeRowEditor;

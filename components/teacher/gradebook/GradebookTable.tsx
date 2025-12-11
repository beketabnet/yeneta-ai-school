import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '../../icons/Icons';
import ScrollableListContainer from '../../common/ScrollableListContainer';

export interface GradeRow {
  id: number;
  student_id?: number;
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

interface GradebookTableProps {
  grades: GradeRow[];
  isLoading: boolean;
  onEdit: (gradeId: number, updatedData: Partial<GradeRow>) => Promise<void>;
  onDelete: (gradeId: number) => Promise<void>;
  selectedSubject: string;
}

const GradebookTable: React.FC<GradebookTableProps> = ({
  grades,
  isLoading,
  onEdit,
  onDelete,
  selectedSubject,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<GradeRow>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = (grade: GradeRow) => {
    setEditingId(grade.id);
    setEditData({
      score: grade.score,
      feedback: grade.feedback,
    });
  };

  const handleEditSave = async (gradeId: number) => {
    setIsSaving(true);
    try {
      await onEdit(gradeId, editData);
      setEditingId(null);
      setEditData({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (percentage >= 60) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedSubject) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">Select a subject to view grades</p>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No grades found for this selection</p>
      </div>
    );
  }

  return (
    <ScrollableListContainer className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Score
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Grade
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Feedback
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr
              key={grade.id}
              className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                editingId === grade.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              {/* Student Name */}
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                {grade.student_name}
              </td>

              {/* Grade Type */}
              <td className="px-4 py-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                  {grade.assignment_type || grade.exam_type || 'N/A'}
                </span>
              </td>

              {/* Score */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                {editingId === grade.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={grade.max_score}
                      step="0.1"
                      aria-label={`Score for ${grade.student_name}`}
                      placeholder="Score"
                      value={editData.score || grade.score}
                      onChange={(e) => setEditData({ ...editData, score: parseFloat(e.target.value) })}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <span className="text-gray-600 dark:text-gray-400">/ {grade.max_score}</span>
                  </div>
                ) : (
                  `${grade.score} / ${grade.max_score}`
                )}
              </td>

              {/* Percentage Grade */}
              <td className="px-4 py-3 text-sm font-semibold">
                <div className={`inline-block px-3 py-1 rounded-full ${getGradeColor(grade.percentage)}`}>
                  {grade.percentage.toFixed(1)}%
                </div>
              </td>

              {/* Feedback */}
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                {editingId === grade.id ? (
                  <input
                    type="text"
                    value={editData.feedback || grade.feedback}
                    onChange={(e) => setEditData({ ...editData, feedback: e.target.value })}
                    placeholder="Add feedback..."
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                  />
                ) : (
                  grade.feedback || '-'
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-sm space-x-2 flex">
                {editingId === grade.id ? (
                  <>
                    <button
                      onClick={() => handleEditSave(grade.id)}
                      disabled={isSaving}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 disabled:opacity-50"
                      title="Save changes"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                      title="Cancel editing"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditStart(grade)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      title="Edit grade"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this grade?')) {
                          onDelete(grade.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                      title="Delete grade"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableListContainer>
  );
};

export default GradebookTable;

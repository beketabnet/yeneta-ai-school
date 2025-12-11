import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '../icons/Icons';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';

interface GradeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gradeData: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
  studentName?: string;
  subject?: string;
}


const EXAM_TYPES = ['Quiz', 'Mid Exam', 'Final Exam'];

const GradeInputModal: React.FC<GradeInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  studentName,
  subject
}) => {
  const [formData, setFormData] = useState({
    score: '',
    max_score: '100',
    assignment_type: '',
    exam_type: '',
    feedback: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [gradeType, setGradeType] = useState<'assignment' | 'exam'>('assignment');
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();

  useEffect(() => {
    if (initialData) {
      setFormData({
        score: initialData.score?.toString() || '',
        max_score: initialData.max_score?.toString() || '100',
        assignment_type: initialData.assignment_type || '',
        exam_type: initialData.exam_type || '',
        feedback: initialData.feedback || ''
      });
      setGradeType(initialData.exam_type ? 'exam' : 'assignment');
    } else {
      setFormData({
        score: '',
        max_score: '100',
        assignment_type: '',
        exam_type: '',
        feedback: ''
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const score = parseFloat(formData.score);
    const maxScore = parseFloat(formData.max_score);

    if (isNaN(score) || isNaN(maxScore)) {
      setError('Please enter valid numbers for score and max score');
      return;
    }

    if (score < 0 || score > maxScore) {
      setError(`Score must be between 0 and ${maxScore}`);
      return;
    }

    if (gradeType === 'assignment' && !formData.assignment_type) {
      setError('Please select an assignment type');
      return;
    }

    if (gradeType === 'exam' && !formData.exam_type) {
      setError('Please select an exam type');
      return;
    }

    try {
      const submitData = {
        score,
        max_score: maxScore,
        assignment_type: gradeType === 'assignment' ? formData.assignment_type : null,
        exam_type: gradeType === 'exam' ? formData.exam_type : null,
        feedback: formData.feedback
      };

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {initialData ? 'Edit Grade' : 'Add Grade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {studentName && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Student:</span> {studentName}
              </p>
              {subject && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Subject:</span> {subject}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="assignment"
                  checked={gradeType === 'assignment'}
                  onChange={(e) => setGradeType(e.target.value as 'assignment' | 'exam')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Assignment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="exam"
                  checked={gradeType === 'exam'}
                  onChange={(e) => setGradeType(e.target.value as 'assignment' | 'exam')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Exam</span>
              </label>
            </div>
          </div>

          {gradeType === 'assignment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignment Type *
              </label>
              <select
                value={formData.assignment_type}
                onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoadingTypes}
              >
                <option value="">Select assignment type</option>
                {isLoadingTypes ? (
                  <option disabled>Loading types...</option>
                ) : (
                  assignmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))
                )}
              </select>
            </div>
          )}

          {gradeType === 'exam' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Type *
              </label>
              <select
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select exam type</option>
                {EXAM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Score *
              </label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                step="0.5"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Score *
              </label>
              <input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                step="0.5"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add feedback for the student..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeInputModal;

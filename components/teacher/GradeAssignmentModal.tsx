import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '../icons/Icons';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

interface Assignment {
  id: number;
  name: string;
  type: 'assignment' | 'exam';
  subject: string;
}

interface EnrolledSubject {
  subject_id: number;
  subject_name: string;
  grade_level: number;
  student_id: number;
  student_name: string;
  enrollment_date: string;
}

interface GradeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gradeData: any) => Promise<void>;
  subject: EnrolledSubject;
  isSubmitting?: boolean;
}

const GradeAssignmentModal: React.FC<GradeAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subject,
  isSubmitting = false
}) => {
  const { addNotification } = useNotification();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [score, setScore] = useState<number | ''>('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAssignments();
    }
  }, [isOpen, subject]);

  const loadAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const data = await apiService.getSubjectAssignmentsExams(subject.subject_id);
      
      const allItems: Assignment[] = [];
      
      // Add assignments
      if (data.assignments && Array.isArray(data.assignments)) {
        data.assignments.forEach((item: any) => {
          allItems.push({
            id: item.id,
            name: item.title,
            type: 'assignment',
            subject: subject.subject_name
          });
        });
      }
      
      // Add exams
      if (data.exams && Array.isArray(data.exams)) {
        data.exams.forEach((item: any) => {
          allItems.push({
            id: item.id,
            name: item.title,
            type: 'exam',
            subject: subject.subject_name
          });
        });
      }
      
      setAssignments(allItems);
      if (allItems.length > 0) {
        setSelectedAssignment(allItems[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assignments';
      addNotification(errorMessage, 'error');
      console.error('Error loading assignments:', err);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const validateAndSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!selectedAssignment) {
      newErrors.assignment = 'Please select an assignment or exam';
    }

    if (score === '' || score === null) {
      newErrors.score = 'Score is required';
    } else {
      const scoreNum = typeof score === 'string' ? parseFloat(score) : score;
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
        newErrors.score = `Score must be between 0 and ${maxScore}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const gradeData = {
        student_id: subject.student_id,
        subject: subject.subject_name,
        assignment_type: selectedAssignment?.type === 'assignment' ? selectedAssignment.name : undefined,
        exam_type: selectedAssignment?.type === 'exam' ? selectedAssignment.name : undefined,
        score: typeof score === 'string' ? parseFloat(score) : score,
        max_score: maxScore,
        feedback: ''
      };

      await onSubmit(gradeData);
      resetForm();
    } catch (err) {
      console.error('Error submitting grade:', err);
    }
  };

  const resetForm = () => {
    setScore('');
    setMaxScore(100);
    setSelectedAssignment(assignments.length > 0 ? assignments[0] : null);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add Grade</h2>
            <p className="text-sm text-blue-100">{subject.student_name}</p>
            <p className="text-sm text-blue-100">{subject.subject_name} - Grade {subject.grade_level}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:bg-blue-700 dark:hover:bg-blue-700 p-2 rounded transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Assignment/Exam Dropdown */}
          <div>
            <label htmlFor="assignment-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment or Exam *
            </label>
            {isLoadingAssignments ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            ) : (
              <select
                id="assignment-select"
                value={selectedAssignment?.id || ''}
                onChange={(e) => {
                  const selected = assignments.find(a => a.id === parseInt(e.target.value));
                  setSelectedAssignment(selected || null);
                  if (errors.assignment) {
                    const newErrors = { ...errors };
                    delete newErrors.assignment;
                    setErrors(newErrors);
                  }
                }}
                disabled={isSubmitting}
                aria-label="Select assignment or exam"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Assignment or Exam --</option>
                {assignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.name} ({assignment.type === 'assignment' ? 'Assignment' : 'Exam'})
                  </option>
                ))}
              </select>
            )}
            {errors.assignment && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.assignment}</p>}
          </div>

          {/* Score Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="score-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Score *
              </label>
              <input
                id="score-input"
                type="number"
                min="0"
                max={maxScore}
                step="0.1"
                value={score}
                onChange={(e) => {
                  setScore(e.target.value ? parseFloat(e.target.value) : '');
                  if (errors.score) {
                    const newErrors = { ...errors };
                    delete newErrors.score;
                    setErrors(newErrors);
                  }
                }}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.score && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.score}</p>}
            </div>

            <div>
              <label htmlFor="max-score-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Score
              </label>
              <input
                id="max-score-input"
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(parseFloat(e.target.value) || 100)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Score Display */}
          {score !== '' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Score: <span className="font-bold text-blue-600 dark:text-blue-400">{score}/{maxScore}</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  ({((typeof score === 'string' ? parseFloat(score) : score) / maxScore * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={validateAndSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeAssignmentModal;

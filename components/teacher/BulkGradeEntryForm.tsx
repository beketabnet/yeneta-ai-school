import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '../icons/Icons';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';

interface StudentRow {
  student_id: number;
  student_name: string;
  score: number | '';
  gradeType: 'assignment' | 'exam';
  gradeSubType: string;
  feedback: string;
}

interface BulkGradeEntryFormProps {
  subjectName: string;
  gradeLevel: string;
  stream?: string;
  students: Array<{ student_id: number; student_name: string }>;
  onSubmit: (grades: any[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}


const EXAM_TYPES = ['Quiz', 'Mid Exam', 'Final Exam'];

const BulkGradeEntryForm: React.FC<BulkGradeEntryFormProps> = ({
  subjectName,
  gradeLevel,
  stream = '',
  students,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();
  const [rows, setRows] = useState<StudentRow[]>(
    students.map(s => ({
      student_id: s.student_id,
      student_name: s.student_name,
      score: '',
      gradeType: 'assignment' as const,
      gradeSubType: 'Quiz',
      feedback: ''
    }))
  );

  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleRowChange = (index: number, field: keyof StudentRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
    
    // Clear error for this row if user is correcting it
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const validateAndSubmit = async () => {
    const newErrors: Record<number, string> = {};
    const gradesData: any[] = [];

    rows.forEach((row, index) => {
      if (row.score === '' || row.score === null) {
        newErrors[index] = 'Score is required';
        return;
      }

      const scoreNum = typeof row.score === 'string' ? parseFloat(row.score) : row.score;
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        newErrors[index] = 'Score must be between 0 and 100';
        return;
      }

      if (!row.gradeSubType) {
        newErrors[index] = 'Grade type is required';
        return;
      }

      gradesData.push({
        student_id: row.student_id,
        subject: subjectName,
        grade_level: gradeLevel,
        stream: stream,
        assignment_type: row.gradeType === 'assignment' ? row.gradeSubType : undefined,
        exam_type: row.gradeType === 'exam' ? row.gradeSubType : undefined,
        score: scoreNum,
        max_score: 100,
        feedback: row.feedback
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(gradesData);
    } catch (err) {
      console.error('Error submitting grades:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Grade Entry</h2>
            <p className="text-sm text-blue-100">{subjectName}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-white hover:bg-blue-700 dark:hover:bg-blue-700 p-2 rounded transition-colors"
            title="Close bulk grade entry"
            aria-label="Close bulk grade entry"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.student_id}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  errors[index]
                    ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Student Name */}
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Student</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{row.student_name}</p>
                  </div>

                  {/* Grade Type */}
                  <div>
                    <label htmlFor={`grade-type-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
                    <select
                      id={`grade-type-${index}`}
                      value={row.gradeType}
                      onChange={(e) => {
                        handleRowChange(index, 'gradeType', e.target.value as 'assignment' | 'exam');
                        handleRowChange(index, 'gradeSubType', row.gradeType === 'assignment' ? (assignmentTypes.length > 0 ? assignmentTypes[0].value : '') : EXAM_TYPES[0]);
                      }}
                      disabled={isSubmitting}
                      aria-label="Select grade type"
                      className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                    </select>
                  </div>

                  {/* Grade SubType */}
                  <div>
                    <label htmlFor={`grade-subtype-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {row.gradeType === 'assignment' ? 'Assignment Type' : 'Exam Type'}
                    </label>
                    <select
                      id={`grade-subtype-${index}`}
                      value={row.gradeSubType}
                      onChange={(e) => handleRowChange(index, 'gradeSubType', e.target.value)}
                      disabled={isSubmitting || (row.gradeType === 'assignment' && isLoadingTypes)}
                      aria-label={row.gradeType === 'assignment' ? 'Select assignment type' : 'Select exam type'}
                      className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {row.gradeType === 'assignment' ? (
                        isLoadingTypes ? (
                          <option disabled>Loading...</option>
                        ) : (
                          assignmentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))
                        )
                      ) : (
                        EXAM_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Score */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={row.score}
                      onChange={(e) => handleRowChange(index, 'score', e.target.value ? parseFloat(e.target.value) : '')}
                      disabled={isSubmitting}
                      className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-100"
                    />
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Feedback</label>
                    <input
                      type="text"
                      value={row.feedback}
                      onChange={(e) => handleRowChange(index, 'feedback', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {errors[index] && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">{errors[index]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {rows.filter(r => r.score !== '').length} / {rows.length} grades entered
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
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
              {isSubmitting ? 'Submitting...' : 'Submit Grades'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkGradeEntryForm;

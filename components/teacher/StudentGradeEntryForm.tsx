import React, { useState, useMemo } from 'react';
import { EnrolledStudent, EnrolledSubject } from '../../hooks/useTeacherEnrolledStudents';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';
import Card from '../Card';
import { AcademicCapIcon, CheckCircleIcon } from '../icons/Icons';

interface GradeEntry {
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  feedback: string;
}

interface StudentGradeEntryFormProps {
  student: EnrolledStudent | null;
  onSubmit: (subject: EnrolledSubject, gradeData: GradeEntry) => Promise<void>;
  isSubmitting: boolean;
}


const EXAM_TYPES = [
  'Quiz',
  'Mid Exam',
  'Final Exam'
];

const StudentGradeEntryForm: React.FC<StudentGradeEntryFormProps> = ({
  student,
  onSubmit,
  isSubmitting
}) => {
  const [selectedSubject, setSelectedSubject] = useState<EnrolledSubject | null>(null);
  const [gradeType, setGradeType] = useState<'assignment' | 'exam'>('assignment');
  const [selectedType, setSelectedType] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();

  const typeOptions = useMemo(() => {
    return gradeType === 'assignment' 
      ? assignmentTypes.map(t => t.label) 
      : EXAM_TYPES;
  }, [gradeType, assignmentTypes]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedSubject) {
      newErrors.subject = 'Please select a subject';
    }
    if (!selectedType) {
      newErrors.type = `Please select a ${gradeType} type`;
    }
    if (!score || isNaN(Number(score))) {
      newErrors.score = 'Please enter a valid score';
    }
    if (!maxScore || isNaN(Number(maxScore)) || Number(maxScore) <= 0) {
      newErrors.maxScore = 'Please enter a valid maximum score';
    }
    if (Number(score) > Number(maxScore)) {
      newErrors.score = 'Score cannot exceed maximum score';
    }
    if (Number(score) < 0) {
      newErrors.score = 'Score cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedSubject) return;

    try {
      const gradeData: GradeEntry = {
        score: Number(score),
        max_score: Number(maxScore),
        feedback: feedback.trim()
      };

      if (gradeType === 'assignment') {
        gradeData.assignment_type = selectedType;
      } else {
        gradeData.exam_type = selectedType;
      }

      await onSubmit(selectedSubject, gradeData);

      setSuccessMessage(`Grade recorded for ${student?.student_name} in ${selectedSubject.subject}`);
      setScore('');
      setMaxScore('100');
      setFeedback('');
      setSelectedType('');
      setSelectedSubject(null);
      setGradeType('assignment');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting grade:', error);
      setErrors({ submit: 'Failed to submit grade. Please try again.' });
    }
  };

  if (!student) {
    return (
      <Card title="Grade Entry">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Select a student to enter grades</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Enter Grade for ${student.student_name}`}>
      <div className="flex items-center gap-3 mb-6">
        <AcademicCapIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Enter Grade for {student.student_name}
        </h3>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject *
          </label>
          <select
            aria-label="Select subject"
            value={selectedSubject?.id || ''}
            onChange={(e) => {
              const subject = student.subjects.find(s => s.id === Number(e.target.value));
              setSelectedSubject(subject || null);
            }}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select a subject...</option>
            {student.subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.subject}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
          )}
        </div>

        {/* Grade Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grade Type *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gradeType"
                value="assignment"
                checked={gradeType === 'assignment'}
                onChange={(e) => {
                  setGradeType(e.target.value as 'assignment' | 'exam');
                  setSelectedType('');
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700 dark:text-gray-300">Assignment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gradeType"
                value="exam"
                checked={gradeType === 'exam'}
                onChange={(e) => {
                  setGradeType(e.target.value as 'assignment' | 'exam');
                  setSelectedType('');
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700 dark:text-gray-300">Exam</span>
            </label>
          </div>
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {gradeType === 'assignment' ? 'Assignment Type' : 'Exam Type'} *
          </label>
          <select
            aria-label={`Select ${gradeType} type`}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select {gradeType} type...</option>
            {gradeType === 'assignment' ? (
              isLoadingTypes ? (
                <option disabled>Loading...</option>
              ) : (
                assignmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))
              )
            ) : (
              EXAM_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))
            )}
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type}</p>
          )}
        </div>

        {/* Score Input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Score *
            </label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.score ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.score && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.score}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Score *
            </label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="100"
              min="1"
              step="1"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxScore ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.maxScore && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.maxScore}</p>
            )}
          </div>
        </div>

        {/* Percentage Display */}
        {score && maxScore && !isNaN(Number(score)) && !isNaN(Number(maxScore)) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Percentage: <span className="font-bold">{((Number(score) / Number(maxScore)) * 100).toFixed(1)}%</span>
            </p>
          </div>
        )}

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add any feedback or comments for the student..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <span className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 text-lg">⚠</span>
            <p className="text-red-800 dark:text-red-200">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSubmitting ? 'Saving Grade...' : 'Save Grade'}
        </button>
      </form>
    </Card>
  );
};

export default StudentGradeEntryForm;

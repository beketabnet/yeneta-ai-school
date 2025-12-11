import React, { useState, useMemo } from 'react';
import { XMarkIcon } from '../icons/Icons';
import { EnrolledStudent } from '../../hooks/useTeacherEnrolledStudents';
import { useAssignmentTypes, useExamTypes } from '../../hooks/useAssignmentTypes';

export interface GradeFormData {
  student_id: number;
  subject: string;
  grade_level?: string;
  stream?: string;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  feedback: string;
}

interface GradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (gradeData: GradeFormData) => Promise<void>;
  enrolledStudents: EnrolledStudent[];
  isSubmitting?: boolean;
  prefilledSubject?: string;
  prefilledStudentId?: number;
}

const GradeEntryModal: React.FC<GradeEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  enrolledStudents,
  isSubmitting = false,
  prefilledSubject = '',
  prefilledStudentId = 0,
}) => {
  const [formData, setFormData] = useState<GradeFormData>({
    student_id: prefilledStudentId,
    subject: prefilledSubject,
    assignment_type: '',
    exam_type: '',
    score: 0,
    max_score: 100,
    feedback: '',
  });

  const { types: assignmentTypes, isLoading: isLoadingAssignmentTypes } = useAssignmentTypes();
  const { types: examTypes, isLoading: isLoadingExamTypes } = useExamTypes();

  const [gradeType, setGradeType] = useState<'assignment' | 'exam'>('assignment');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to generate a unique key for subject-grade-stream combination
  // Format: "Subject|Grade|Stream"
  const getSubjectKey = (subject: string, gradeLevel: string, stream?: string) => {
    return `${subject}|${gradeLevel}|${stream || ''}`;
  };

  const getSubjectLabel = (subject: string, gradeLevel: string, stream?: string) => {
    let label = `${subject} - Grade ${gradeLevel}`;
    if (stream) label += ` (${stream})`;
    return label;
  };

  // Get unique subjects options from enrolled students
  const uniqueSubjectOptions = useMemo(() => {
    const options = new Map<string, { value: string, label: string, subject: string, grade_level: string, stream?: string }>();

    if (Array.isArray(enrolledStudents)) {
      enrolledStudents.forEach(student => {
        if (student) {
          const subjectsArray = student.subjects || student.courses || [];
          if (Array.isArray(subjectsArray)) {
            subjectsArray.forEach(subj => {
              if (subj && subj.subject) {
                const key = getSubjectKey(subj.subject, subj.grade_level, subj.stream);
                if (!options.has(key)) {
                  options.set(key, {
                    value: key,
                    label: getSubjectLabel(subj.subject, subj.grade_level, subj.stream),
                    subject: subj.subject,
                    grade_level: subj.grade_level,
                    stream: subj.stream
                  });
                }
              }
            });
          }
        }
      });
    }
    return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [enrolledStudents]);

  // Handle composite subject change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    if (!selectedKey) {
      setFormData({ ...formData, subject: '', grade_level: '', stream: '', student_id: 0 });
      return;
    }

    // Find the option details
    const option = uniqueSubjectOptions.find(opt => opt.value === selectedKey);
    if (option) {
      setFormData({
        ...formData,
        subject: option.subject,
        grade_level: option.grade_level,
        stream: option.stream,
        student_id: 0 // Reset student when subject changes
      });
    }
  };

  // Get matching students for selected subject/grade/stream
  const studentsForSubject = useMemo(() => {
    if (!formData.subject) return [];

    return enrolledStudents.filter(student => {
      if (!student) return false;
      const subjectsArray = student.subjects || student.courses || [];
      return Array.isArray(subjectsArray) &&
        subjectsArray.some(s =>
          s &&
          s.subject === formData.subject &&
          // Optional: match grade and stream if they are set in formData (which they should be from the dropdown)
          (!formData.grade_level || s.grade_level === formData.grade_level) &&
          (!formData.stream || s.stream === formData.stream)
        );
    });
  }, [enrolledStudents, formData.subject, formData.grade_level, formData.stream]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.student_id) {
      newErrors.student_id = 'Student is required';
    }
    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }
    if (gradeType === 'assignment' && !formData.assignment_type) {
      newErrors.assignment_type = 'Assignment type is required';
    }
    if (gradeType === 'exam' && !formData.exam_type) {
      newErrors.exam_type = 'Exam type is required';
    }
    if (formData.score < 0 || formData.score > formData.max_score) {
      newErrors.score = `Score must be between 0 and ${formData.max_score}`;
    }
    if (formData.max_score <= 0) {
      newErrors.max_score = 'Max score must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Use formData which already has grade_level and stream set from the subject dropdown
    const submitData: GradeFormData = {
      student_id: formData.student_id,
      subject: formData.subject,
      grade_level: formData.grade_level,
      stream: formData.stream,
      score: formData.score,
      max_score: formData.max_score,
      feedback: formData.feedback,
      assignment_type: gradeType === 'assignment' ? formData.assignment_type : undefined,
      exam_type: gradeType === 'exam' ? formData.exam_type : undefined,
    };

    try {
      await onSubmit(submitData);
      // Reset form
      setFormData({
        student_id: 0,
        subject: '',
        grade_level: '',
        stream: '',
        assignment_type: '',
        exam_type: '',
        score: 0,
        max_score: 100,
        feedback: '',
      });
      setGradeType('assignment');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting grade:', error);
    }
  };

  if (!isOpen) return null;

  // Determine current selected subject value for the dropdown
  const currentSubjectValue = formData.subject ? getSubjectKey(formData.subject, formData.grade_level || '', formData.stream) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Enter Grade Score</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            title="Close modal"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <select
              aria-label="Select subject"
              value={currentSubjectValue}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject...</option>
              {uniqueSubjectOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.subject && <p className="text-red-600 text-sm mt-1">{errors.subject}</p>}
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student *
            </label>
            <select
              aria-label="Select student"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
              disabled={!formData.subject}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>Select a student...</option>
              {studentsForSubject.map(student => (
                <option key={student.student_id} value={student.student_id}>
                  {student.student_name}
                </option>
              ))}
            </select>
            {errors.student_id && <p className="text-red-600 text-sm mt-1">{errors.student_id}</p>}
          </div>

          {/* Grade Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGradeType('assignment')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${gradeType === 'assignment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                Assignment
              </button>
              <button
                type="button"
                onClick={() => setGradeType('exam')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${gradeType === 'exam'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                Exam
              </button>
            </div>
          </div>

          {/* Assignment Type */}
          {gradeType === 'assignment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignment Type *
              </label>
              <select
                aria-label="Select assignment type"
                value={formData.assignment_type || ''}
                onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingAssignmentTypes}
              >
                <option value="">Select type...</option>
                {isLoadingAssignmentTypes ? (
                  <option disabled>Loading types...</option>
                ) : (
                  assignmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))
                )}
              </select>
              {errors.assignment_type && <p className="text-red-600 text-sm mt-1">{errors.assignment_type}</p>}
            </div>
          )}

          {/* Exam Type */}
          {gradeType === 'exam' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exam Type *
              </label>
              <select
                aria-label="Select exam type"
                value={formData.exam_type || ''}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingExamTypes}
              >
                <option value="">Select type...</option>
                {isLoadingExamTypes ? (
                  <option disabled>Loading types...</option>
                ) : (
                  examTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))
                )}
              </select>
              {errors.exam_type && <p className="text-red-600 text-sm mt-1">{errors.exam_type}</p>}
            </div>
          )}

          {/* Score */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade Score *
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                aria-label="Grade Score"
                placeholder="0"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.score && <p className="text-red-600 text-sm mt-1">{errors.score}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Score *
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                aria-label="Max score"
                placeholder="100"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.max_score && <p className="text-red-600 text-sm mt-1">{errors.max_score}</p>}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Feedback (Optional)
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Add feedback for the student..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Grade Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeEntryModal;

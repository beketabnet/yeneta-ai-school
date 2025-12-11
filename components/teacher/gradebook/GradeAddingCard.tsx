import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';
import { useAssignmentTypes } from '../../../hooks/useAssignmentTypes';

interface GradeAddingCardProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId?: number;
  subjectName: string;
  gradeLevel: string;
  onGradeSaved?: () => void;
}

interface Student {
  student_id: number;
  student_name: string;
  username: string;
  email?: string;
}

interface GradeEntry {
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  feedback: string;
}

interface StudentGrades {
  [studentId: number]: {
    [key: string]: GradeEntry;
  };
}


const EXAM_TYPES = [
  'Quiz',
  'Mid Exam',
  'Final Exam',
];

const GradeAddingCardEnhanced: React.FC<GradeAddingCardProps> = ({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  gradeLevel,
  onGradeSaved,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGrades>({});
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();

  useEffect(() => {
    if (isOpen && subjectId !== undefined && subjectId !== null) {
      loadStudents();
    }
  }, [isOpen, subjectId]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get(
        `/academics/subject-students-for-grading/${subjectId}/`
      );
      if (response.students) {
        setStudents(response.students);
        if (response.students.length > 0) {
          setSelectedStudent(response.students[0].student_id);
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (
    studentId: number,
    key: string,
    field: 'score' | 'max_score' | 'feedback',
    value: any
  ) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [key]: {
          ...(prev[studentId]?.[key] || { score: 0, max_score: 0, feedback: '' }),
          [field]: value,
        },
      },
    }));
    setEditingKey(key);
  };

  const handleSaveGrade = async (
    studentId: number,
    key: string,
    gradeType: 'assignment' | 'exam'
  ) => {
    const grade = studentGrades[studentId]?.[key];
    if (!grade) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const gradeData = {
        student_id: studentId,
        subject: subjectName,
        grade_level: gradeLevel,
        stream: '', // Stream can be empty for now
        score: grade.score,
        max_score: grade.max_score,
        feedback: grade.feedback,
      };

      if (gradeType === 'assignment') {
        // Extract type value from key (assignment_typeValue)
        const typeValue = key.replace('assignment_', '');
        gradeData['assignment_type'] = typeValue;
      } else {
        gradeData['exam_type'] = EXAM_TYPES.find((_, i) => `exam_${i}` === key);
      }

      const response = await apiService.post('/academics/save-student-grade/', gradeData);
      if (response.success) {
        setSaveStatus('Grade saved successfully!');
        setEditingKey(null);
        setTimeout(() => setSaveStatus(null), 3000);
        onGradeSaved?.();
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      setSaveStatus('Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  const calculatePercentage = (score: number, maxScore: number): number => {
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  const calculateAverageScore = (studentId: number, gradeType: 'assignment' | 'exam'): number | null => {
    const grades = studentGrades[studentId];
    if (!grades) return null;

    const typePrefix = gradeType === 'assignment' ? 'assignment_' : 'exam_';
    const relevantGrades = Object.entries(grades)
      .filter(([key]) => key.startsWith(typePrefix))
      .map(([, grade]) => {
        const gradeEntry = grade as GradeEntry;
        return calculatePercentage(gradeEntry.score, gradeEntry.max_score);
      })
      .filter(percentage => percentage > 0);

    if (relevantGrades.length === 0) return null;
    return relevantGrades.reduce((a, b) => a + b, 0) / relevantGrades.length;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  };

  const getCleanStudentName = (student: Student): string => {
    if (!student.student_name || student.student_name.trim() === '' || 
        student.student_name === 'None None' || student.student_name === 'None') {
      return student.username || 'Unknown Student';
    }
    return student.student_name;
  };

  if (!isOpen) return null;

  const currentStudent = students.find(s => s.student_id === selectedStudent);
  const assignmentAverage = selectedStudent ? calculateAverageScore(selectedStudent, 'assignment') : null;
  const examAverage = selectedStudent ? calculateAverageScore(selectedStudent, 'exam') : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 border-b border-blue-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">📝 Add Grade</h2>
            <p className="text-blue-100 mt-1">{subjectName} • Grade {gradeLevel}</p>
          </div>
          <button
            onClick={onClose}
            title="Close grade entry"
            className="text-blue-100 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Selection */}
              <div>
                <label htmlFor="student-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Student *
                </label>
                <select
                  id="student-select"
                  aria-label="Select student for grading"
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {getCleanStudentName(student)}
                    </option>
                  ))}
                </select>
              </div>

              {currentStudent && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Assignment Average</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {assignmentAverage !== null ? `${assignmentAverage.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Exam Average</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {examAverage !== null ? `${examAverage.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Assignment Grades Section */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">✏️ Assignment Grades</h3>
                      {assignmentAverage !== null && (
                        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100">
                          Avg: {assignmentAverage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {isLoadingTypes ? (
                        <div className="text-center py-4 text-gray-500">Loading assignment types...</div>
                      ) : (
                        assignmentTypes.map((type) => {
                          const key = `assignment_${type.value}`;
                          const grade = studentGrades[selectedStudent!]?.[key] || {
                            score: 0,
                            max_score: 0,
                            feedback: '',
                          };
                          const percentage = calculatePercentage(grade.score, grade.max_score);
                          const isEditing = editingKey === key;

                          return (
                            <div
                              key={key}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">{type.label}</label>
                                {grade.score > 0 && (
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${getGradeColor(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-12 gap-2 mb-3">
                                <div className="col-span-4">
                                  <label htmlFor={`score-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Score
                                  </label>
                                  <input
                                    id={`score-${key}`}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="0"
                                    value={grade.score}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        selectedStudent!,
                                        key,
                                        'score',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label htmlFor={`max-score-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Max Score
                                  </label>
                                  <input
                                    id={`max-score-${key}`}
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    placeholder="100"
                                    value={grade.max_score}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        selectedStudent!,
                                        key,
                                        'max_score',
                                        parseFloat(e.target.value) || 100
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                                  />
                                </div>
                                <div className="col-span-4 flex gap-2 items-end">
                                  <button
                                    onClick={() => handleSaveGrade(selectedStudent!, key, 'assignment')}
                                    disabled={isSaving}
                                    title="Save this grade"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save
                                  </button>
                                  {isEditing && (
                                    <button
                                      onClick={() => setEditingKey(null)}
                                      title="Cancel editing"
                                      className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded px-3 py-2 text-sm font-semibold transition-colors"
                                    >
                                      <XCircleIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label htmlFor={`feedback-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                  Feedback (Optional)
                                </label>
                                <textarea
                                  id={`feedback-${key}`}
                                  value={grade.feedback}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      selectedStudent!,
                                      key,
                                      'feedback',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add constructive feedback for the student..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Exam Grades Section */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 Exam Grades</h3>
                      {examAverage !== null && (
                        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100">
                          Avg: {examAverage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {EXAM_TYPES.map((type, idx) => {
                        const key = `exam_${idx}`;
                        const grade = studentGrades[selectedStudent!]?.[key] || {
                          score: 0,
                          max_score: 0,
                          feedback: '',
                        };
                        const percentage = calculatePercentage(grade.score, grade.max_score);
                        const isEditing = editingKey === key;

                        return (
                          <div
                            key={key}
                            className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-semibold text-gray-900 dark:text-white">{type}</label>
                              {grade.score > 0 && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getGradeColor(percentage)}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-12 gap-2 mb-3">
                              <div className="col-span-4">
                                <label htmlFor={`exam-score-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                  Score
                                </label>
                                <input
                                  id={`exam-score-${key}`}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="0"
                                  value={grade.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      selectedStudent!,
                                      key,
                                      'score',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                                />
                              </div>
                              <div className="col-span-4">
                                <label htmlFor={`exam-max-score-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                  Max Score
                                </label>
                                <input
                                  id={`exam-max-score-${key}`}
                                  type="number"
                                  min="1"
                                  step="0.1"
                                  placeholder="100"
                                  value={grade.max_score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      selectedStudent!,
                                      key,
                                      'max_score',
                                      parseFloat(e.target.value) || 100
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                                />
                              </div>
                              <div className="col-span-4 flex gap-2 items-end">
                                <button
                                  onClick={() => handleSaveGrade(selectedStudent!, key, 'exam')}
                                  disabled={isSaving}
                                  title="Save this grade"
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Save
                                </button>
                                {isEditing && (
                                  <button
                                    onClick={() => setEditingKey(null)}
                                    title="Cancel editing"
                                    className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded px-3 py-2 text-sm font-semibold transition-colors"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <label htmlFor={`exam-feedback-${key}`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Feedback (Optional)
                              </label>
                              <textarea
                                id={`exam-feedback-${key}`}
                                value={grade.feedback}
                                onChange={(e) =>
                                  handleScoreChange(
                                    selectedStudent!,
                                    key,
                                    'feedback',
                                    e.target.value
                                  )
                                }
                                placeholder="Add constructive feedback for the student..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {saveStatus && (
                    <div className={`p-4 rounded-lg text-center font-medium ${
                      saveStatus.includes('successfully')
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                      {saveStatus}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeAddingCardEnhanced;

import React, { useState } from 'react';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { PencilIcon, PlusIcon, TrashIcon } from '../icons/Icons';

interface Grade {
  id: number;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  feedback: string;
  graded_at: string;
}

interface Student {
  student_id: number;
  student_name: string;
  grade_level: string;
  enrollment_date: string;
  grades: Grade[];
  assignment_grades: Grade[];
  exam_grades: Grade[];
  total_grades: number;
}

interface SubjectGradeEntryPanelProps {
  subject: {
    subject_id: number;
    subject_name: string;
    grade_level: string;
    students: Student[];
    total_students: number;
  } | null;
  isLoading?: boolean;
  onAddGrade?: (studentId: number, subjectName: string) => void;
  onEditGrade?: (gradeId: number) => void;
  onDeleteGrade?: (gradeId: number) => void;
}

const SubjectGradeEntryPanel: React.FC<SubjectGradeEntryPanelProps> = ({
  subject,
  isLoading = false,
  onAddGrade,
  onEditGrade,
  onDeleteGrade
}) => {
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">Select a subject to view and manage grades</p>
      </div>
    );
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900';
  };

  return (
    <div className="space-y-4">
      {/* Subject Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{subject.subject_name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Grade {subject.grade_level} • {subject.total_students} students</p>
      </div>

      {/* Students List */}
      <ScrollableListContainer className="space-y-2 max-h-[600px]">
        {subject.students.map(student => (
          <div
            key={student.student_id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Student Header */}
            <div
              onClick={() => setExpandedStudentId(expandedStudentId === student.student_id ? null : student.student_id)}
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{student.student_name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.total_grades} grades</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {student.assignment_grades.length} assignments, {student.exam_grades.length} exams
                  </p>
                </div>

                {onAddGrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddGrade(student.student_id, subject.subject_name);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                    title="Add grade"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                )}

                <div className={`transform transition-transform ${expandedStudentId === student.student_id ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Grades */}
            {expandedStudentId === student.student_id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700 space-y-3">
                {student.grades.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No grades entered yet</p>
                ) : (
                  student.grades.map(grade => (
                    <div
                      key={grade.id}
                      className={`p-3 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between ${getGradeColor((grade.score / grade.max_score) * 100)}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {grade.assignment_type || grade.exam_type || 'Grade'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {grade.score} / {grade.max_score} ({((grade.score / grade.max_score) * 100).toFixed(1)}%)
                        </p>
                        {grade.feedback && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{grade.feedback}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onEditGrade && (
                          <button
                            onClick={() => onEditGrade(grade.id)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                            title="Edit grade"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onDeleteGrade && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this grade?')) {
                                onDeleteGrade(grade.id);
                              }
                            }}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                            title="Delete grade"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </ScrollableListContainer>
    </div>
  );
};

export default SubjectGradeEntryPanel;

import React from 'react';
import { SubjectGrades } from '../../../hooks/useStudentGradesEnhanced';

interface StudentGradeBreakdownProps {
  subject: SubjectGrades;
}

const getGradeColor = (grade: number | null): string => {
  if (grade === null) return 'text-gray-500 dark:text-gray-400';
  if (grade >= 90) return 'text-green-600 dark:text-green-400';
  if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
  if (grade >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (grade >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getGradeBadge = (grade: number | null): string => {
  if (grade === null) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  if (grade >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  if (grade >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
  if (grade >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (grade >= 60) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
  return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
};

const StudentGradeBreakdown: React.FC<StudentGradeBreakdownProps> = ({ subject }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assignment Average */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Assignment Average</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${getGradeColor(subject.assignmentAverage)}`}>
              {subject.assignmentAverage !== null ? subject.assignmentAverage.toFixed(1) : 'N/A'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">%</span>
          </div>
          {subject.assignmentAverage !== null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Based on {subject.assignmentGrades?.length || 0} grades
            </p>
          )}
        </div>

        {/* Exam Average */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Exam Average</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${getGradeColor(subject.examAverage)}`}>
              {subject.examAverage !== null ? subject.examAverage.toFixed(1) : 'N/A'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">%</span>
          </div>
          {subject.examAverage !== null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Based on {subject.examGrades?.length || 0} grades
            </p>
          )}
        </div>

        {/* Overall Grade */}
        <div className={`rounded-lg p-4 ${getGradeBadge(subject.overallGrade)}`}>
          <p className="text-sm font-medium mb-2">Overall Grade</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${getGradeColor(subject.overallGrade)}`}>
              {subject.overallGrade !== null ? subject.overallGrade.toFixed(1) : 'N/A'}
            </span>
            <span className="text-sm mb-1">%</span>
          </div>
          <p className="text-xs mt-2">40% Assignments + 60% Exams</p>
        </div>
      </div>
    </div>
  );
};

export default StudentGradeBreakdown;

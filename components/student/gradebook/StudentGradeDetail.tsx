import React from 'react';
import { StudentGradeData } from '../../../hooks/useStudentGradesEnhanced';

interface StudentGradeDetailProps {
  grade: StudentGradeData;
  subject?: string;
}

const getScoreColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-green-600 dark:text-green-400';
  if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
  if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const StudentGradeDetail: React.FC<StudentGradeDetailProps> = ({ grade }) => {
  const formattedDate = grade.graded_at 
    ? new Date(grade.graded_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Date not available';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {grade.assignment_type || grade.exam_type}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
          {grade.feedback && (
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              "{grade.feedback}"
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-bold ${getScoreColor(grade.percentage || 0)}`}>
              {grade.percentage ? grade.percentage.toFixed(1) : 'N/A'}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {grade.score}/{grade.max_score}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentGradeDetail;

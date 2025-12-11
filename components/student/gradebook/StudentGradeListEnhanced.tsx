import React from 'react';
import ScrollableListContainer from '../../common/ScrollableListContainer';

interface Grade {
  id: number;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  graded_at: string;
  assignment_type?: string;
  exam_type?: string;
}

interface StudentGradeListEnhancedProps {
  grades: Grade[];
  gradeType: 'assignment' | 'exam';
  isLoading?: boolean;
}

const StudentGradeListEnhanced: React.FC<StudentGradeListEnhancedProps> = ({
  grades,
  gradeType,
  isLoading = false
}) => {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTypeLabel = (grade: Grade) => {
    if (gradeType === 'assignment') {
      return grade.assignment_type || 'Unknown';
    } else {
      return grade.exam_type || 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No {gradeType} grades available</p>
      </div>
    );
  }

  return (
    <ScrollableListContainer>
      <div className="space-y-2">
        {grades.map(grade => (
          <div
            key={grade.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {getTypeLabel(grade)}
              </h4>
              <span className={`text-lg font-bold ${getGradeColor(grade.percentage)}`}>
                {grade.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Score: {grade.score} / {grade.max_score}</span>
              <span>{formatDate(grade.graded_at)}</span>
            </div>

            {grade.feedback && (
              <div className="text-sm bg-gray-50 dark:bg-gray-700 rounded p-2 text-gray-700 dark:text-gray-300">
                <p className="font-medium text-xs text-gray-600 dark:text-gray-400 mb-1">Feedback:</p>
                <p>{grade.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollableListContainer>
  );
};

export default StudentGradeListEnhanced;

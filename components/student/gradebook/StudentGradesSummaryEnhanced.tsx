import React from 'react';

interface StudentGradesSummaryEnhancedProps {
  subject: string;
  assignmentAverage: number | null;
  examAverage: number | null;
  overallGrade: number | null;
  totalGrades: number;
  completedGrades: number;
}

const StudentGradesSummaryEnhanced: React.FC<StudentGradesSummaryEnhancedProps> = ({
  subject,
  assignmentAverage,
  examAverage,
  overallGrade,
  totalGrades,
  completedGrades
}) => {
  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500';
    if (grade >= 80) return 'text-green-600 dark:text-green-400';
    if (grade >= 60) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (grade: number | null) => {
    if (grade === null) return 'bg-gray-100 dark:bg-gray-700';
    if (grade >= 80) return 'bg-green-100 dark:bg-green-900';
    if (grade >= 60) return 'bg-blue-100 dark:bg-blue-900';
    if (grade >= 40) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{subject}</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedGrades} / {totalGrades} grades
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Assignment Average */}
        <div className={`${getGradeBadgeColor(assignmentAverage)} rounded-lg p-3 text-center`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Assignment Avg</p>
          <p className={`text-2xl font-bold ${getGradeColor(assignmentAverage)}`}>
            {assignmentAverage !== null ? assignmentAverage.toFixed(1) : 'N/A'}
          </p>
        </div>

        {/* Exam Average */}
        <div className={`${getGradeBadgeColor(examAverage)} rounded-lg p-3 text-center`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Exam Avg</p>
          <p className={`text-2xl font-bold ${getGradeColor(examAverage)}`}>
            {examAverage !== null ? examAverage.toFixed(1) : 'N/A'}
          </p>
        </div>

        {/* Overall Grade */}
        <div className={`${getGradeBadgeColor(overallGrade)} rounded-lg p-3 text-center border-2 border-current`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall</p>
          <p className={`text-2xl font-bold ${getGradeColor(overallGrade)}`}>
            {overallGrade !== null ? overallGrade.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Grade Formula Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
        <p>Overall = (Assignment × 0.4) + (Exam × 0.6)</p>
      </div>
    </div>
  );
};

export default StudentGradesSummaryEnhanced;

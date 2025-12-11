import React from 'react';
import { useStudentPerformanceSummary } from '../../hooks/useStudentPerformanceSummary';
import Card from '../Card';

interface ChildGradeOverviewProps {
  childId: number;
  childName: string;
}

const ChildGradeOverview: React.FC<ChildGradeOverviewProps> = ({ childId, childName }) => {
  const { summary, isLoading, error } = useStudentPerformanceSummary(childId);

  if (isLoading) {
    return (
      <Card title={`${childName}'s Grade Overview`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={`${childName}'s Grade Overview`}>
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card title={`${childName}'s Grade Overview`}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No grades available yet</p>
        </div>
      </Card>
    );
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500';
    if (grade >= 80) return 'text-green-600 dark:text-green-400';
    if (grade >= 60) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card title={`${childName}'s Grade Overview`}>
      <div className="space-y-4">
        {/* Overall Average */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Average</p>
          <p className={`text-3xl font-bold ${getGradeColor(summary.overall_average)}`}>
            {summary.overall_average !== null ? summary.overall_average.toFixed(1) : 'N/A'}%
          </p>
        </div>

        {/* Subject Breakdown */}
        {summary.total_subjects > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Subjects</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(summary.subjects).map(([subject, data]: [string, any]) => (
                <div
                  key={subject}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{subject}</p>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Overall: <span className={getGradeColor(data.overall)}>{data.overall !== null ? data.overall.toFixed(1) : 'N/A'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <p className="text-gray-600 dark:text-gray-400">Total Subjects</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary.total_subjects}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <p className="text-gray-600 dark:text-gray-400">Total Grades</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary.total_grades}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChildGradeOverview;

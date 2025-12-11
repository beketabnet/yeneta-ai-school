import React from 'react';
import { AcademicCapIcon, UserGroupIcon, SparklesIcon, CheckCircleIcon } from '../../icons/Icons';

interface GradebookManagerStatsProps {
  totalStudents: number;
  totalSubjects: number;
  avgScore: number | null;
  gradeCount: number;
}

const GradebookManagerStats: React.FC<GradebookManagerStatsProps> = ({
  totalStudents,
  totalSubjects,
  avgScore,
  gradeCount,
}) => {
  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: UserGroupIcon,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Subjects',
      value: totalSubjects,
      icon: AcademicCapIcon,
      color: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Grades Entered',
      value: gradeCount,
      icon: CheckCircleIcon,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Average Score',
      value: avgScore !== null ? `${avgScore.toFixed(1)}%` : 'N/A',
      icon: SparklesIcon,
      color: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`${stat.color} p-4 rounded-lg border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.textColor}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${stat.textColor} opacity-75`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GradebookManagerStats;

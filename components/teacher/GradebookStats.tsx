import React from 'react';
import { UsersIcon, CheckCircleIcon, ChartBarIcon, ClockIcon } from '../icons/Icons';

interface GradebookStatsProps {
  totalStudents: number;
  totalGrades: number;
  averageScore: number | null;
  pendingEntries: number;
  completedEntries: number;
  isLoading?: boolean;
}

const GradebookStats: React.FC<GradebookStatsProps> = ({
  totalStudents,
  totalGrades,
  averageScore,
  pendingEntries,
  completedEntries,
  isLoading = false
}) => {
  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: <UsersIcon className="h-6 w-6" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconBg: 'bg-blue-200 dark:bg-blue-800'
    },
    {
      label: 'Total Grades',
      value: totalGrades,
      icon: <ChartBarIcon className="h-6 w-6" />,
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-800 dark:text-green-200',
      iconBg: 'bg-green-200 dark:bg-green-800'
    },
    {
      label: 'Average Score',
      value: averageScore !== null ? `${averageScore.toFixed(1)}%` : 'N/A',
      icon: <ChartBarIcon className="h-6 w-6" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-800 dark:text-purple-200',
      iconBg: 'bg-purple-200 dark:bg-purple-800'
    },
    {
      label: 'Pending Entries',
      value: pendingEntries,
      icon: <ClockIcon className="h-6 w-6" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconBg: 'bg-yellow-200 dark:bg-yellow-800'
    },
    {
      label: 'Completed Entries',
      value: completedEntries,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      textColor: 'text-emerald-800 dark:text-emerald-200',
      iconBg: 'bg-emerald-200 dark:bg-emerald-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} rounded-lg p-4 transition-all ${
            isLoading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                {isLoading ? '...' : stat.value}
              </p>
            </div>
            <div className={`${stat.iconBg} rounded-lg p-3 text-gray-700 dark:text-gray-300`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GradebookStats;

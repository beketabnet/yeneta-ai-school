import React from 'react';
import { AcademicCapIcon, ChartBarIcon, UsersIcon, BookOpenIcon } from '../../icons/Icons';

interface GradebookHeaderProps {
  totalGrades: number;
  totalStudents: number;
  totalSubjects: number;
  averageGrade: number | null;
}

const GradebookHeader: React.FC<GradebookHeaderProps> = ({
  totalGrades,
  totalStudents,
  totalSubjects,
  averageGrade,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 rounded-lg p-8 text-white mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <AcademicCapIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gradebook Manager</h1>
            <p className="text-blue-100 text-sm mt-1">Manage and track student performance</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Grades */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Grades</p>
              <p className="text-3xl font-bold mt-1">{totalGrades}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-200 opacity-50" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Students</p>
              <p className="text-3xl font-bold mt-1">{totalStudents}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-200 opacity-50" />
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Subjects</p>
              <p className="text-3xl font-bold mt-1">{totalSubjects}</p>
            </div>
            <BookOpenIcon className="h-8 w-8 text-blue-200 opacity-50" />
          </div>
        </div>

        {/* Average Grade */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Average Grade</p>
              <p className="text-3xl font-bold mt-1">
                {averageGrade !== null ? averageGrade.toFixed(1) : 'N/A'}%
              </p>
            </div>
            <div className="text-4xl font-bold text-blue-200 opacity-50">
              {averageGrade !== null && averageGrade >= 80 ? '✓' : '○'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradebookHeader;

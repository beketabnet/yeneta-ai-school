import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import { ChartBarIcon, AcademicCapIcon, ClipboardDocumentListIcon, BookOpenIcon, UserGroupIcon } from '../icons/Icons';

interface GradeStats {
  total_grades: number;
  average_score: number | null;
  subjects_count: number;
  students_count: number;
  assignment_count: number;
  exam_count: number;
}

const GradeAnalyticsWidget: React.FC = () => {
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getGradeStatistics();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grade statistics';
      setError(errorMessage);
      console.error('Error fetching grade statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading grade data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-3xl border border-red-200 dark:border-red-900/50 h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">Unavailable</p>
          <p className="text-xs text-red-400 max-w-[200px] mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No grade data available</p>
      </div>
    );
  }

  const getAverageColor = (avg: number | null) => {
    if (avg === null) return 'text-gray-500';
    if (avg >= 80) return 'text-green-600 dark:text-green-400';
    if (avg >= 60) return 'text-blue-600 dark:text-blue-400';
    if (avg >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const MetricCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
    <div className={`p-4 rounded-2xl bg-white/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-all group`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <div className={`p-1.5 rounded-lg ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Grade Analytics
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overview of academic performance</p>
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getAverageColor(stats.average_score)} bg-opacity-10 dark:bg-opacity-20 bg-current`}>
          Avg: {stats.average_score !== null ? stats.average_score.toFixed(1) : 'N/A'}%
        </div>
      </div>

      <div className="space-y-4">
        {/* Top Row: Primary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-blue-100 text-xs font-medium mb-1">Total Grades</p>
              <p className="text-3xl font-bold">{stats.total_grades}</p>
              <p className="text-[10px] text-blue-200 mt-2 flex items-center gap-1">
                <ChartBarIcon className="w-3 h-3" /> Across all subjects
              </p>
            </div>
            <ChartBarIcon className="absolute -right-2 -bottom-2 w-16 h-16 text-white opacity-10 group-hover:scale-110 transition-transform" />
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-lg shadow-purple-500/20 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-purple-100 text-xs font-medium mb-1">Students Graded</p>
              <p className="text-3xl font-bold">{stats.students_count}</p>
              <p className="text-[10px] text-purple-200 mt-2 flex items-center gap-1">
                <UserGroupIcon className="w-3 h-3" /> Active participants
              </p>
            </div>
            <UserGroupIcon className="absolute -right-2 -bottom-2 w-16 h-16 text-white opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Bottom Grid: Detailed Stats */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Subjects"
            value={stats.subjects_count}
            icon={BookOpenIcon}
            colorClass="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
          />
          <MetricCard
            title="Avg / Student"
            value={stats.students_count > 0 ? (stats.total_grades / stats.students_count).toFixed(1) : '0'}
            icon={AcademicCapIcon}
            colorClass="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
            subtext="Grades per student"
          />
          <MetricCard
            title="Assignments"
            value={stats.assignment_count}
            icon={ClipboardDocumentListIcon}
            colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            subtext={`${stats.total_grades > 0 ? ((stats.assignment_count / stats.total_grades) * 100).toFixed(0) : 0}% of total`}
          />
          <MetricCard
            title="Exams"
            value={stats.exam_count}
            icon={ClipboardDocumentListIcon}
            colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
            subtext={`${stats.total_grades > 0 ? ((stats.exam_count / stats.total_grades) * 100).toFixed(0) : 0}% of total`}
          />
        </div>
      </div>
    </div>
  );
};

export default GradeAnalyticsWidget;

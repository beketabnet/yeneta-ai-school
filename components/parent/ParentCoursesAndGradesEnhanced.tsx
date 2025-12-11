import React, { useMemo, useState, useEffect } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useParentEnrolledStudentGrades } from '../../hooks/useParentEnrolledStudentGrades';
import { useNotification } from '../../contexts/NotificationContext';
import { useGradeUpdateListener } from '../../hooks/useRealtimeGradeSync';
import {
  ArrowPathIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BookOpenIcon,
  SparklesIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  UserCircleIcon
} from '../icons/Icons';
import GradeHistoryChart from './GradeHistoryChart';

interface ParentCoursesAndGradesEnhancedProps {
  selectedChildId?: number | null;
  preSelectedSubject?: string | null;
}

const ParentCoursesAndGradesEnhanced: React.FC<ParentCoursesAndGradesEnhancedProps> = ({ selectedChildId, preSelectedSubject }) => {
  const { addNotification } = useNotification();
  const {
    enrolledSubjects,
    isLoading,
    error,
    refetch,
    getStudentGrades,
  } = useParentEnrolledStudentGrades();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    if (preSelectedSubject) {
      setSelectedSubject(preSelectedSubject);
      setViewMode('detailed');
    } else if (preSelectedSubject === null) {
      setSelectedSubject(null);
      setViewMode('overview');
    }
  }, [preSelectedSubject]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addNotification('Grades refreshed successfully', 'success');
    } catch (err) {
      addNotification(
        err instanceof Error ? err.message : 'Failed to refresh grades',
        'error'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for grade updates
  useGradeUpdateListener('parent-grades', async (payload) => {
    await refetch();
  });

  // Filter grades for selected child
  const studentGrades = useMemo(() => {
    if (!selectedChildId) {
      return enrolledSubjects;
    }
    return getStudentGrades(selectedChildId);
  }, [selectedChildId, enrolledSubjects, getStudentGrades]);

  // Enhanced grade statistics
  const gradeStats = useMemo(() => {
    if (studentGrades.length === 0) {
      return {
        minScore: 0,
        maxScore: 0,
        averageScore: 0,
        completedCount: 0,
        totalCount: 0,
        completionPercentage: 0,
        trend: 'stable' as const,
        improvement: 0,
      };
    }

    const scoresWithGrades = studentGrades.filter(g => g.overall_score !== undefined);
    const scores = scoresWithGrades.map(g => g.overall_score as number);

    const averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;

    const improvingCount = studentGrades.filter(s => s.trend === 'improving').length;
    const decliningCount = studentGrades.filter(s => s.trend === 'declining').length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (improvingCount > decliningCount) trend = 'up';
    else if (decliningCount > improvingCount) trend = 'down';

    const totalImprovement = studentGrades.reduce((sum, s) => sum + (s.trend_value || 0), 0);
    const avgImprovement = studentGrades.length > 0 ? totalImprovement / studentGrades.length : 0;

    return {
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      averageScore,
      completedCount: scoresWithGrades.length,
      totalCount: studentGrades.length,
      completionPercentage: studentGrades.length > 0 ? Math.round((scoresWithGrades.length / studentGrades.length) * 100) : 0,
      trend,
      improvement: Math.round(avgImprovement * 100) / 100,
    };
  }, [studentGrades]);

  // Subject performance analysis
  const subjectPerformance = useMemo(() => {
    return studentGrades.map((grade) => {
      const averageGrade = grade.overall_score !== undefined ? Math.round(grade.overall_score * 100) / 100 : 0;
      const trend = grade.trend || 'stable';
      const subjectName = grade.subject || 'Unknown Subject';

      return {
        subject: subjectName,
        averageGrade,
        totalGrades: 1,
        completedGrades: grade.overall_score !== undefined ? 1 : 0,
        latestGrade: grade.overall_score,
        trend,
        gradeLevel: grade.grade_level || '',
        stream: grade.stream,
        teacher: grade.teacher ? (grade.teacher.full_name || `${grade.teacher.first_name} ${grade.teacher.last_name}`) : '',
        id: grade.id
      };
    }).sort((a, b) => b.averageGrade - a.averageGrade);
  }, [studentGrades]);

  const getGradeColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-500';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-500/20';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-600/20';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-blue-600/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-yellow-600/20';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-600/20';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'down':
      case 'declining':
        return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-r-xl">
          <p className="font-bold">Error loading grades</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
              <BookOpenIcon className="w-8 h-8 text-blue-500" />
              Academic Performance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
              Comprehensive grade tracking and performance analytics
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setViewMode('overview')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${viewMode === 'overview'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-md transform scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${viewMode === 'detailed'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-md transform scale-[1.02]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                Detailed
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900/30 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <ChartBarIcon className="w-20 h-20" />
              </div>
              <div className="relative z-10">
                <p className="text-indigo-100 font-medium mb-1">Average Score</p>
                <h3 className="text-4xl font-black mb-2">{gradeStats.averageScore.toFixed(1)}%</h3>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-lg py-1 px-3 w-fit text-sm">
                  {gradeStats.improvement > 0 ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                  <span>{Math.abs(gradeStats.improvement).toFixed(1)}% vs last term</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-green-200 dark:hover:border-green-800 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Highest Score</p>
                </div>
                <h3 className={`text-3xl font-bold ${getGradeColor(gradeStats.maxScore)}`}>{gradeStats.maxScore.toFixed(1)}%</h3>
                <p className="text-xs text-gray-500 mt-2">Personal best this term</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <AcademicCapIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Completion Rate</p>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{gradeStats.completionPercentage}%</h3>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${gradeStats.completionPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Active Subjects</p>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{subjectPerformance.length}</h3>
                <p className="text-xs text-gray-500 mt-2">Currently enrolled courses</p>
              </div>
            </div>
          </div>

          {/* Subject Performance Overview */}
          {viewMode === 'overview' && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-yellow-500" />
                  Subject Performance
                </h2>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FunnelIcon className="w-4 h-4 text-gray-400 ml-2" />
                  <select className="bg-transparent border-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer">
                    <option>Grade (High to Low)</option>
                    <option>Grade (Low to High)</option>
                    <option>Subject Name</option>
                  </select>
                </div>
              </div>

              {subjectPerformance.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-bold text-gray-500">No enrolled subjects found</p>
                  <p className="text-sm mt-1 text-gray-400">Enroll in subjects to see performance data</p>
                </div>
              ) : (
                <ScrollableListContainer maxHeight="max-h-[500px]">
                  <div className="space-y-4 pr-2">
                    {subjectPerformance.map((subject, index) => (
                      <div
                        key={subject.id}
                        className="group flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {subject.subject}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-semibold">Grade {subject.gradeLevel}</span>
                              <span>•</span>
                              <span>{subject.teacher}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Current Grade</p>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold ring-1 ring-inset ${getGradeBadgeColor(subject.averageGrade)}`}>
                              {subject.averageGrade.toFixed(1)}%
                            </div>
                          </div>

                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Trend</p>
                            <div className="flex items-center gap-1 justify-end">
                              {getTrendIcon(subject.trend)}
                              <span className={`text-sm font-bold ${subject.trend === 'improving' ? 'text-green-600' : 'text-gray-500'}`}>
                                {subject.trend === 'improving' ? 'Rising' : 'Stable'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubject(subject.subject);
                              setViewMode('detailed');
                            }}
                            className="px-5 py-2.5 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-700 dark:hover:bg-indigo-900/30 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 rounded-xl border border-gray-200 hover:border-indigo-200 dark:border-gray-600 dark:hover:border-indigo-700 transition-all font-semibold text-sm"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollableListContainer>
              )}
            </div>
          )}

          {/* Detailed View */}
          {viewMode === 'detailed' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Subject Selection Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 h-full">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 px-2">Select Subject</h3>
                  <ScrollableListContainer maxHeight="max-h-[600px]">
                    <div className="space-y-2 pr-2">
                      {subjectPerformance.map((subject) => (
                        <button
                          key={subject.id}
                          onClick={() => setSelectedSubject(subject.subject)}
                          className={`w-full text-left p-3 rounded-xl transition-all border ${selectedSubject === subject.subject
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/20'
                            : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${selectedSubject === subject.subject
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                              }`}>
                              {subject.subject}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getGradeBadgeColor(subject.averageGrade)}`}>
                              {subject.averageGrade.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <UserCircleIcon className="w-3 h-3" />
                              <span className="truncate max-w-[100px]">{subject.teacher}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(subject.trend)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollableListContainer>
                </div>
              </div>

              {/* Detailed Grade View */}
              <div className="lg:col-span-8">
                {selectedSubject ? (
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                          {selectedSubject}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">Standard Curriculum</span>
                          <span className="text-gray-400 text-sm">•</span>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Performance Analysis</p>
                        </div>
                      </div>
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                          onClick={() => setTimeRange('all')}
                          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${timeRange === 'all'
                            ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                          All Time
                        </button>
                        <button
                          onClick={() => setTimeRange('recent')}
                          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${timeRange === 'recent'
                            ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                          Recent
                        </button>
                      </div>
                    </div>

                    {/* Grade History Chart */}
                    <div className="flex-1 min-h-[400px]">
                      <GradeHistoryChart
                        studentId={selectedChildId || enrolledSubjects[0]?.student_id}
                        subject={selectedSubject}
                        timeRange={timeRange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <BookOpenIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Select a Subject</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">Choose a subject from the list to view detailed grade history and performance trends.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentCoursesAndGradesEnhanced;
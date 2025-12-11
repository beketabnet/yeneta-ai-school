import React, { useMemo, useState, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useAcademicPerformanceAnalytics, FilterOptions } from '../../hooks/useAcademicPerformanceAnalytics';
import { useNotification } from '../../contexts/NotificationContext';
import { ArrowPathIcon, ChartBarIcon, AcademicCapIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, BellIcon } from '../icons/Icons';

interface Props {
  selectedChildId?: number | null;
}

const ParentAcademicPerformanceDashboard: React.FC<Props> = ({ selectedChildId }) => {
  const { addNotification } = useNotification();
  const { analytics, summary, isLoading, error, refetch, applyFilters, getSortedSubjects, getAlertsByStudent } = useAcademicPerformanceAnalytics();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'alerts'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(selectedChildId || null);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'trend'>('score');
  const [minScore, setMinScore] = useState<number | undefined>();
  const [maxScore, setMaxScore] = useState<number | undefined>();
  const [daysBack, setDaysBack] = useState<number | undefined>();
  const [performanceLevel, setPerformanceLevel] = useState<string>('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addNotification('Analytics refreshed', 'success');
    } catch (err) {
      addNotification('Failed to refresh', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplyFilters = useCallback(async () => {
    const filters: FilterOptions = {};
    if (minScore !== undefined) filters.min_score = minScore;
    if (maxScore !== undefined) filters.max_score = maxScore;
    if (daysBack !== undefined) filters.days_back = daysBack;
    if (performanceLevel) filters.performance_level = performanceLevel as any;
    await applyFilters(filters);
    addNotification('Filters applied', 'success');
  }, [minScore, maxScore, daysBack, performanceLevel, applyFilters, addNotification]);

  const currentStudent = useMemo(() => {
    if (!selectedStudent) return analytics[0] || null;
    return analytics.find(s => s.student_id === selectedStudent) || null;
  }, [selectedStudent, analytics]);

  const sortedSubjects = useMemo(() => {
    if (!currentStudent) return [];
    return getSortedSubjects(currentStudent.student_id, sortBy);
  }, [currentStudent, sortBy, getSortedSubjects]);

  const studentAlerts = useMemo(() => {
    if (!currentStudent) return [];
    return getAlertsByStudent(currentStudent.student_id);
  }, [currentStudent, getAlertsByStudent]);

  const getGradeColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-500';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  if (error) {
    return (
      <Card title="📊 Academic Performance Dashboard">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 font-medium">Error Loading Analytics</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          <button onClick={handleRefresh} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📊 Academic Performance Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced analytics with real-time insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {['overview', 'detailed', 'alerts'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === mode
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                  {mode === 'alerts' ? <BellIcon className="h-4 w-4" /> : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh analytics"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </Card>
      ) : analytics.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-500">No academic data available</p>
          </div>
        </Card>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Average Performance</p>
                  <p className={`text-3xl font-bold ${getGradeColor(summary.average_performance)}`}>
                    {summary.average_performance?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Children</p>
                  <p className="text-3xl font-bold text-purple-600">{summary.total_children}</p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Subjects</p>
                  <p className="text-3xl font-bold text-green-600">{summary.total_subjects}</p>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{summary.performance_alerts.length}</p>
                </div>
              </Card>
            </div>
          )}

          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input type="number" min="0" max="100" value={minScore || ''} onChange={(e) => setMinScore(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Min Score" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                <input type="number" min="0" max="100" value={maxScore || ''} onChange={(e) => setMaxScore(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Max Score" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                <select value={daysBack || ''} onChange={(e) => setDaysBack(e.target.value ? parseInt(e.target.value) : undefined)} title="Filter by time range" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <option value="">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <select value={performanceLevel} onChange={(e) => setPerformanceLevel(e.target.value)} title="Filter by performance level" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  <option value="">All Levels</option>
                  <option value="excellent">Excellent (90+)</option>
                  <option value="good">Good (80-89)</option>
                  <option value="average">Average (70-79)</option>
                  <option value="below_average">Below Average (60-69)</option>
                  <option value="needs_improvement">Needs Improvement (&lt;60)</option>
                </select>
                <button onClick={handleApplyFilters} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          </Card>

          {viewMode === 'overview' && currentStudent && (
            <Card>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{currentStudent.student_name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{currentStudent.subjects} subjects • {currentStudent.total_grades} grades</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-4xl font-bold ${getGradeColor(currentStudent.average_score)}`}>{currentStudent.average_score.toFixed(1)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Subject Performance</h3>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} title="Sort subjects by score, name, or trend" className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800">
                      <option value="score">Sort by Score</option>
                      <option value="name">Sort by Name</option>
                      <option value="trend">Sort by Trend</option>
                    </select>
                  </div>

                  <ScrollableListContainer maxHeight="max-h-[500px]">
                    <div className="space-y-3 pr-2">
                      {sortedSubjects.map(subject => (
                        <div key={subject.subject} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{subject.subject}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{subject.total_grades} grades • {subject.performance_level}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getGradeBadgeColor(subject.average_score)}`}>
                                {subject.average_score.toFixed(1)}
                              </div>
                              <span className="text-xs font-medium">{subject.trend === 'improving' ? `+${subject.trend_value}%` : subject.trend === 'declining' ? `-${subject.trend_value}%` : 'Stable'}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${subject.average_score >= 90 ? 'bg-green-600' : subject.average_score >= 80 ? 'bg-blue-600' : subject.average_score >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${Math.min((subject.average_score / 100) * 100, 100)}%` } as React.CSSProperties}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollableListContainer>
                </div>
              </div>
            </Card>
          )}

          {viewMode === 'alerts' && summary && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Performance Alerts ({summary.performance_alerts.length})</h3>
              {summary.performance_alerts.length > 0 ? (
                <div className="space-y-3">
                  {summary.performance_alerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${alert.severity === 'high' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'}`}>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{alert.student_name} - {alert.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.type === 'low_grade' ? `Score: ${alert.score}` : `Declining: ${alert.decline_percentage}%`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No alerts</p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentAcademicPerformanceDashboard;

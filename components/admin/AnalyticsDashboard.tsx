import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import Card from '../Card';
import { apiService } from '../../services/apiService';
import { EngagementTrendPoint, LearningOutcomePoint } from '../../types';
import eventService, { EVENTS } from '../../services/eventService';
import { ArrowPathIcon, ChartBarIcon, UserGroupIcon } from '../icons/Icons';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-bold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsDashboard: React.FC = () => {
  const [engagementData, setEngagementData] = useState<EngagementTrendPoint[]>([]);
  const [outcomesData, setOutcomesData] = useState<LearningOutcomePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [engagement, outcomes] = await Promise.all([
        apiService.getEngagementTrends(),
        apiService.getLearningOutcomes(),
      ]);

      const formattedEngagement = engagement.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      setEngagementData(formattedEngagement);
      setOutcomesData(outcomes);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to load analytics data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    // Listen for grade events to refresh analytics
    const handleGradeEvent = () => {
      fetchData();
    };

    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

    return () => {
      clearInterval(interval);
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [fetchData]);

  if (isLoading && engagementData.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center h-64 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex justify-center items-center h-64 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl border border-red-200 dark:border-red-900/50">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Actionable Analytics & Reporting
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
              Real-time Data • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-all shadow-sm active:scale-95"
          title="Refresh analytics data"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Users Chart */}
        <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/20 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <UserGroupIcon className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">User Engagement</h4>
          </div>

          {/* Decorative bg blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="active_users"
                  name="Active Users"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#8B5CF6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Outcomes Chart */}
        <div className="bg-gradient-to-br from-white to-teal-50/50 dark:from-gray-800 dark:to-teal-900/10 rounded-2xl p-5 border border-teal-100 dark:border-teal-900/20 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
              <ChartBarIcon className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Learning Outcomes</h4>
          </div>

          {/* Decorative bg blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-200 dark:bg-teal-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                <XAxis
                  dataKey="subject"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  dy={10}
                  interval={0}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }} />
                <Bar
                  dataKey="average_score"
                  name="Avg Score"
                  fill="#14B8A6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
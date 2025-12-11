import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChildSummary, ProgressTrend } from '../../types';
import Card from '../Card';
import { apiService } from '../../services/apiService';
import { ChartBarIcon, BellIcon, SparklesIcon, FireIcon } from '../icons/Icons';

interface AtAGlanceProps {
    child: ChildSummary;
}

const AtAGlance: React.FC<AtAGlanceProps> = ({ child }) => {
    const [childSummary, setChildSummary] = useState<ChildSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getChildSummary(child.id);
                setChildSummary(data);
            } catch (err) {
                setError("Failed to load child's summary data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (child?.id) {
            fetchSummary();
        }
    }, [child?.id]);

    const getEngagementLevel = (progress: number) => {
        if (progress >= 80) return 'High';
        if (progress >= 60) return 'Medium';
        return 'Low';
    };

    const engagement = childSummary ? getEngagementLevel(childSummary.overall_progress) : 'N/A';

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                <p className="text-sm text-red-700 font-medium">
                    Error loading summary: {error}
                </p>
            </div>
        );
    }

    if (!childSummary) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-indigo-500/10 border border-indigo-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <ChartBarIcon className="w-16 h-16 text-indigo-50 dark:text-indigo-900/20 transform translate-x-4 -translate-y-4" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <ChartBarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Overall Score</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                {childSummary.overall_progress}%
                            </h3>
                            <span className="text-green-500 text-sm font-bold flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2 1 1 0 010 2zM5 7a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                +2.4%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
                            <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${childSummary.overall_progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-amber-500/10 border border-amber-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <SparklesIcon className="w-16 h-16 text-amber-50 dark:text-amber-900/20 transform translate-x-4 -translate-y-4" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <FireIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Engagement</h3>
                        </div>
                        <h3 className={`text-4xl font-black ${engagement === 'High' ? 'text-emerald-600 dark:text-emerald-400' :
                                engagement === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-red-600 dark:text-red-400'
                            }`}>
                            {engagement}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Consistent participation this week</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg shadow-rose-500/10 border border-rose-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <BellIcon className="w-16 h-16 text-rose-50 dark:text-rose-900/20 transform translate-x-4 -translate-y-4" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                <BellIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Alerts</h3>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white">{childSummary.recent_alerts_count}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Requires your attention</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Progress Chart */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Progress Trend</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly performance overview</p>
                            </div>
                            <select className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                                <option>Last 6 Months</option>
                                <option>This Year</option>
                            </select>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={childSummary.progressTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        domain={[0, 100]}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            color: '#1f2937'
                                        }}
                                        itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                                        cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="averageScore"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Upcoming Assignments */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Tasks</h3>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                                {childSummary.upcoming_assignments.length} Pending
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {childSummary.upcoming_assignments.length > 0 ? (
                                childSummary.upcoming_assignments.map((assignment) => (
                                    <div key={assignment.id} className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-700/50 hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold uppercase tracking-wide">
                                                {assignment.subject || 'General'}
                                            </span>
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                Due: {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {assignment.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                            Complete this assignment before the deadline to maintain your streak.
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">All caught up!</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No upcoming assignments due soon.</p>
                                </div>
                            )}
                        </div>

                        {childSummary.upcoming_assignments.length > 0 && (
                            <button className="w-full mt-6 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800">
                                View Full Schedule
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AtAGlance;
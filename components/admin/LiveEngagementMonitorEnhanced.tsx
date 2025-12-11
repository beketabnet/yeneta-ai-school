import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import Card from '../Card';
import { Expression, User } from '../../types';
import { EngagementContext } from '../../contexts/EngagementContext';
import { apiService } from '../../services/apiService';

interface EngagementData {
    name: string;
    value: Expression;
    students: number;
}

interface HistoricalData {
    date: string;
    average_engagement_score: number;
    attention_required_percentage: number;
    happy_percentage: number;
    neutral_percentage: number;
    negative_percentage: number;
}

const COLORS: Record<Expression, string> = {
    happy: '#48BB78',
    neutral: '#60A5FA',
    surprised: '#FBBF24',
    sad: '#8B5CF6',
    angry: '#E53E3E',
    disgusted: '#9333EA',
    fearful: '#F97316',
    unknown: '#9CA3AF',
};

const ATTENTION_EXPRESSIONS: Expression[] = ['sad', 'angry', 'fearful', 'disgusted'];

const LiveEngagementMonitorEnhanced: React.FC = () => {
    const { engagementState } = useContext(EngagementContext);
    const [users, setUsers] = useState<Map<string, User>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [liveData, setLiveData] = useState<any>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
    const [showHistorical, setShowHistorical] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const userList = await apiService.getUsers();
            const userMap = new Map(userList.map(user => [user.id.toString(), user]));
            setUsers(userMap);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }, []);

    const fetchLiveData = useCallback(async () => {
        try {
            const data = await apiService.getLiveEngagement();
            setLiveData(data);
        } catch (error) {
            console.error("Failed to fetch live engagement data:", error);
        }
    }, []);

    const fetchHistoricalData = useCallback(async () => {
        try {
            const data = await apiService.getEngagementTrendsEnhanced(7);
            setHistoricalData(data);
        } catch (error) {
            console.error("Failed to fetch historical data:", error);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchUsers(),
                fetchLiveData(),
                fetchHistoricalData()
            ]);
            setIsLoading(false);
        };

        initialize();

        // Set up auto-refresh for live data every 5 seconds
        const interval = setInterval(() => {
            fetchLiveData();
        }, 5000);
        setRefreshInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchUsers, fetchLiveData, fetchHistoricalData]);

    const { engagementChartData, attentionStudents } = useMemo(() => {
        const counts: Record<Expression, number> = {
            happy: 0, neutral: 0, surprised: 0, sad: 0, angry: 0, disgusted: 0, fearful: 0, unknown: 0
        };

        const activeStudentIds = Object.keys(engagementState);
        activeStudentIds.forEach(studentId => {
            const state = engagementState[studentId];
            if (state) {
                counts[state.expression]++;
            }
        });
        
        const chartData = Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([expression, count]) => ({
                name: expression.charAt(0).toUpperCase() + expression.slice(1),
                value: expression as Expression,
                students: count,
            }));

        const attentionList = activeStudentIds
            .filter(id => engagementState[id] && ATTENTION_EXPRESSIONS.includes(engagementState[id].expression))
            .map(id => ({
                id,
                name: users.get(id)?.username || `Student #${id}`,
                reason: engagementState[id].expression.charAt(0).toUpperCase() + engagementState[id].expression.slice(1),
            }));

        return { engagementChartData: chartData, attentionStudents: attentionList };
    }, [engagementState, users]);
    
    const totalActiveStudents = Object.keys(engagementState).length;

    // Calculate statistics from live data
    const liveStats = useMemo(() => {
        if (!liveData) return null;

        const total = liveData.total_active || 0;
        const attentionCount = liveData.attention_required?.length || 0;
        const attentionPercentage = total > 0 ? (attentionCount / total) * 100 : 0;

        return {
            total,
            attentionCount,
            attentionPercentage: attentionPercentage.toFixed(1)
        };
    }, [liveData]);

    if (isLoading) {
        return (
            <Card title="Live Engagement Monitor">
                <p className="text-center py-8">Loading engagement data...</p>
            </Card>
        );
    }

    return (
        <Card title="Live Engagement Monitor">
            <div className="space-y-6">
                {/* Toggle for Historical View */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowHistorical(false)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                !showHistorical
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Live View
                        </button>
                        <button
                            onClick={() => setShowHistorical(true)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                showHistorical
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Historical Trends
                        </button>
                    </div>
                    {liveStats && !showHistorical && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{liveStats.total}</span> active students
                            {liveStats.attentionCount > 0 && (
                                <span className="ml-2 text-red-500 dark:text-danger">
                                    • {liveStats.attentionCount} need attention ({liveStats.attentionPercentage}%)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {!showHistorical ? (
                    <>
                        {/* Live Sentiment Distribution */}
                        <div>
                            <h4 className="text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-2">
                                Live Sentiment Distribution ({totalActiveStudents} Active)
                            </h4>
                            {totalActiveStudents > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={engagementChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" hide />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                                borderColor: '#4B5563'
                                            }}
                                        />
                                        <Bar dataKey="students" barSize={20} radius={[0, 10, 10, 0]}>
                                            {engagementChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[entry.value]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
                                    No students are currently active.
                                </div>
                            )}
                        </div>

                        {/* Students Requiring Attention */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Students Requiring Attention
                            </h4>
                            {attentionStudents.length > 0 ? (
                                <ul className="space-y-2">
                                    {attentionStudents.map(student => (
                                        <li key={student.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{student.name}</span>
                                            <span className="text-xs text-red-500 dark:text-danger font-semibold">{student.reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-sm text-gray-400 p-4">All active students seem engaged.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Historical Engagement Trends */}
                        <div>
                            <h4 className="text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-4">
                                Engagement Trends (Last 7 Days)
                            </h4>
                            {historicalData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#9CA3AF"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                                borderColor: '#4B5563',
                                                borderRadius: '8px'
                                            }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="average_engagement_score" 
                                            stroke="#48BB78" 
                                            strokeWidth={2}
                                            name="Engagement Score"
                                            dot={{ fill: '#48BB78', r: 4 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="attention_required_percentage" 
                                            stroke="#E53E3E" 
                                            strokeWidth={2}
                                            name="Attention Required %"
                                            dot={{ fill: '#E53E3E', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
                                    No historical data available.
                                </div>
                            )}
                        </div>

                        {/* Expression Distribution Over Time */}
                        {historicalData.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-center text-gray-500 dark:text-gray-400 mb-4">
                                    Expression Distribution Trends
                                </h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#9CA3AF"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                                borderColor: '#4B5563',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="happy_percentage" stroke="#48BB78" name="Happy %" strokeWidth={2} />
                                        <Line type="monotone" dataKey="neutral_percentage" stroke="#60A5FA" name="Neutral %" strokeWidth={2} />
                                        <Line type="monotone" dataKey="negative_percentage" stroke="#E53E3E" name="Negative %" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    Engagement data is aggregated for privacy. No video is stored or viewed by administrators.
                </p>
            </div>
        </Card>
    );
};

export default LiveEngagementMonitorEnhanced;

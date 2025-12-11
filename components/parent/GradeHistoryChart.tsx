import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useGradeUpdateListener } from '../../hooks/useRealtimeGradeSync';
import Card from '../Card';

interface GradeHistoryItem {
    id: number;
    date: string;
    score: number;
    max_score: number;
    percentage: number;
    type: string;
    category: string;
    feedback: string;
}

interface Props {
    studentId: number;
    subject: string;
    timeRange?: 'all' | 'recent';
}

const GradeHistoryChart: React.FC<Props> = ({ studentId, subject, timeRange = 'all' }) => {
    const [history, setHistory] = useState<GradeHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.getStudentGradesHistory(studentId, subject);
            setHistory(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load grade history');
        } finally {
            setLoading(false);
        }
    }, [studentId, subject]);

    useEffect(() => {
        if (studentId && subject) {
            fetchHistory();
        }
    }, [fetchHistory]);

    useGradeUpdateListener('grade-history', async () => {
        await fetchHistory();
    });

    const chartData = useMemo(() => {
        let filteredHistory = history;
        if (timeRange === 'recent') {
            // Filter for last 30 days or last 5 items if less than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filteredHistory = history.filter(item => new Date(item.date) >= thirtyDaysAgo);
            if (filteredHistory.length === 0 && history.length > 0) {
                filteredHistory = history.slice(-5);
            }
        }
        return filteredHistory.map(item => ({
            date: new Date(item.date).toLocaleDateString(),
            score: item.percentage,
            type: item.type,
            category: item.category
        }));
    }, [history, timeRange]);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (history.length === 0) return <div className="text-gray-500 text-center py-8">No grade history available for this subject.</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Performance History</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Line
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Bar
                    </button>
                </div>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Score (%)" strokeWidth={2} />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="score" fill="#3b82f6" name="Score (%)" />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="mt-4">
                <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Recent Assessments</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {history.slice().reverse().slice(0, 5).map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.type}</td>
                                    <td className="px-4 py-2 text-sm font-medium">
                                        <span className={`${item.percentage >= 90 ? 'text-green-600' : item.percentage >= 70 ? 'text-blue-600' : item.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {item.percentage.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GradeHistoryChart;

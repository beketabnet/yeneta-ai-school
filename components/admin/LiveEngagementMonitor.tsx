import React, { useContext, useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../Card';
import { Expression, User } from '../../types';
import { EngagementContext } from '../../contexts/EngagementContext';
import { apiService } from '../../services/apiService';

interface EngagementData {
    name: string; // Capitalized for display
    value: Expression;
    students: number;
}

const COLORS: Record<Expression, string> = {
    happy: '#48BB78', // success
    neutral: '#60A5FA', // blue-400
    surprised: '#FBBF24', // amber-400
    sad: '#8B5CF6', // primary
    angry: '#E53E3E', // danger
    disgusted: '#9333EA', // purple-600
    fearful: '#F97316', // orange-500
    unknown: '#9CA3AF', // gray-400
};

const ATTENTION_EXPRESSIONS: Expression[] = ['sad', 'angry', 'fearful', 'disgusted'];

const LiveEngagementMonitor: React.FC = () => {
    const { engagementState } = useContext(EngagementContext);
    const [users, setUsers] = useState<Map<string, User>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userList = await apiService.getUsers();
                const userMap = new Map(userList.map(user => [user.id.toString(), user]));
                setUsers(userMap);
            } catch (error) {
                console.error("Failed to fetch users for engagement monitor:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

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

    return (
        <Card title="Live Engagement Monitor">
            <div className="space-y-6">
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
                           {isLoading ? "Loading student data..." : "No students are currently active."}
                        </div>
                    )}
                </div>
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
                 <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    Engagement data is aggregated for privacy. No video is stored or viewed by administrators.
                </p>
            </div>
        </Card>
    );
};

export default LiveEngagementMonitor;
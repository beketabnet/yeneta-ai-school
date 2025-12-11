import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { StudentProgress, AIInsight, EngagementLevel, Expression, User } from '../../types';
import { apiService } from '../../services/apiService';
import { SparklesIcon, ArrowPathIcon } from '../icons/Icons';

// Enhanced function to add progress data with engagement history
const userToStudentProgress = (user: User, engagementData?: any): StudentProgress => {
    // Calculate engagement level based on recent engagement history
    let engagementLevel: EngagementLevel = 'Medium';
    let liveEngagement = undefined;
    
    if (engagementData) {
        const score = engagementData.engagement_score || 0;
        if (score >= 80) engagementLevel = 'High';
        else if (score >= 60) engagementLevel = 'Medium';
        else if (score >= 40) engagementLevel = 'Low';
        else engagementLevel = 'At Risk';
        
        // Add live engagement expression if available
        if (engagementData.dominant_expression) {
            liveEngagement = {
                expression: engagementData.dominant_expression as Expression
            };
        }
    } else {
        // Fallback to mock data if no engagement data available
        const MOCK_ENGAGEMENT: EngagementLevel[] = ['High', 'Medium', 'Low', 'At Risk'];
        engagementLevel = MOCK_ENGAGEMENT[Math.floor(Math.random() * MOCK_ENGAGEMENT.length)];
    }
    
    // Mock progress and scores - in production, fetch from grades/assignments
    const MOCK_PROGRESS = Math.floor(Math.random() * 50 + 50); // 50-100
    const MOCK_SCORE = Math.floor(Math.random() * 40 + 60); // 60-100
    
    return {
        id: user.id,
        name: user.username,
        overallProgress: MOCK_PROGRESS,
        recentScore: MOCK_SCORE,
        engagement: engagementLevel,
        liveEngagement: liveEngagement
    };
};

const EngagementBadge: React.FC<{ level: EngagementLevel, expression?: Expression }> = ({ level, expression }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const expressionEmojiMap: Record<Expression, string> = {
        happy: '😊',
        sad: '😟',
        angry: '😠',
        fearful: '😨',
        disgusted: '🤢',
        surprised: '😮',
        neutral: '😐',
        unknown: '🤔',
    };

    let colorClasses = '';
    switch (level) {
        case 'High': colorClasses = 'bg-success text-white'; break;
        case 'Medium': colorClasses = 'bg-blue-500 text-white'; break;
        case 'Low': colorClasses = 'bg-warning text-white'; break;
        case 'At Risk': colorClasses = 'bg-danger text-white'; break;
        default: colorClasses = 'bg-gray-400 text-white'; break;
    }
    return (
        <span className={`${baseClasses} ${colorClasses} inline-flex items-center`}>
            {expression && <span className="mr-1.5">{expressionEmojiMap[expression]}</span>}
            {level}
        </span>
    );
};

const StudentInsights: React.FC = () => {
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
    const [insights, setInsights] = useState<AIInsight | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [liveEngagementData, setLiveEngagementData] = useState<any>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch live engagement data
    const fetchLiveEngagement = useCallback(async () => {
        try {
            const data = await apiService.getLiveEngagement();
            setLiveEngagementData(data);
            return data;
        } catch (err) {
            console.error('Failed to fetch live engagement:', err);
            return null;
        }
    }, []);

    // Fetch students with engagement data
    const fetchStudents = useCallback(async () => {
        setIsLoadingStudents(true);
        setError(null);
        try {
            const users = await apiService.getStudents();
            
            // Fetch engagement history for each student
            const engagementPromises = users.map(async (user) => {
                try {
                    const history = await apiService.getStudentEngagementHistory(user.id, 7);
                    // Get most recent session data
                    return history && history.length > 0 ? history[0] : null;
                } catch {
                    return null;
                }
            });
            
            const engagementDataArray = await Promise.all(engagementPromises);
            
            // Map users to student progress with engagement data
            const studentProgressData = users.map((user, index) => 
                userToStudentProgress(user, engagementDataArray[index])
            );
            
            setStudents(studentProgressData);
            setLastRefresh(new Date());
        } catch (err) {
            setError("Failed to load student data. Please try again later.");
            console.error(err);
        } finally {
            setIsLoadingStudents(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchStudents();
        fetchLiveEngagement();
    }, [fetchStudents, fetchLiveEngagement]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            fetchStudents();
            fetchLiveEngagement();
        }, 30000); // 30 seconds
        
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStudents, fetchLiveEngagement]);

    const handleGetInsights = async (student: StudentProgress) => {
        setSelectedStudent(student);
        setIsLoadingInsights(true);
        setError(null);
        setInsights(null);
        try {
            const result = await apiService.getStudentAIInsights(student);
            setInsights(result);
        } catch (err: any) {
            setError(err.message || "Failed to generate insights. Please try again.");
        } finally {
            setIsLoadingInsights(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card 
                    title="Class Overview & Real-Time Insights"
                    className="max-h-96 overflow-y-auto"
                    action={
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="autoRefresh"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="autoRefresh" className="text-sm text-gray-600 dark:text-gray-400">
                                    Auto-refresh
                                </label>
                            </div>
                            <button
                                onClick={() => {
                                    fetchStudents();
                                    fetchLiveEngagement();
                                }}
                                disabled={isLoadingStudents}
                                className="flex items-center space-x-1 px-3 py-1 text-sm text-primary dark:text-secondary hover:bg-primary-light dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                                title="Refresh data"
                            >
                                <ArrowPathIcon className={isLoadingStudents ? 'animate-spin' : ''} />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {lastRefresh.toLocaleTimeString()}
                                </span>
                            </button>
                        </div>
                    }
                >
                    {isLoadingStudents && <p>Loading student data...</p>}
                    {error && <p className="text-danger">{error}</p>}
                    {!isLoadingStudents && !error && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Student Name</th>
                                        <th className="px-4 py-3">Overall Progress</th>
                                        <th className="px-4 py-3">Recent Score</th>
                                        <th className="px-4 py-3">Engagement</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{student.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${student.overallProgress}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{student.recentScore}%</td>
                                            <td className="px-4 py-3"><EngagementBadge level={student.engagement} expression={student.liveEngagement?.expression} /></td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => handleGetInsights(student)}
                                                    className="text-primary dark:text-secondary hover:underline disabled:text-gray-400"
                                                    disabled={isLoadingInsights && selectedStudent?.id === student.id}
                                                >
                                                    {isLoadingInsights && selectedStudent?.id === student.id ? 'Loading...' : 'Get Insights'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card title="AI Intervention Assistant">
                    {!selectedStudent && <p className="text-center text-gray-500">Select a student to get AI-powered insights.</p>}
                    {isLoadingInsights && <p className="text-center text-gray-500">Generating insights for {selectedStudent?.name}...</p>}
                    {error && !isLoadingInsights && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}
                    {insights && selectedStudent && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Report for {selectedStudent.name}</h3>
                            <div>
                                <h4 className="font-semibold text-primary-dark dark:text-gray-200">AI Summary</h4>
                                <p className="mt-1 text-sm p-3 bg-primary-light dark:bg-gray-700 rounded-md">{insights.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-primary-dark dark:text-gray-200">Intervention Suggestions</h4>
                                <ul className="mt-1 space-y-2 text-sm list-disc list-inside">
                                    {insights.interventionSuggestions.map((suggestion, index) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StudentInsights;
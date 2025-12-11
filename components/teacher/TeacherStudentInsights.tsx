import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { StudentProgress, AIInsight, EngagementLevel, Expression } from '../../types';
import { apiService } from '../../services/apiService';
import { useTeacherStudents } from '../../hooks/useTeacherStudents';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotification } from '../../contexts/NotificationContext';
import { SparklesIcon, ArrowPathIcon, PresentationChartLineIcon, ChartBarIcon, LightBulbIcon } from '../icons/Icons';

const EngagementBadge: React.FC<{ level: EngagementLevel; expression?: Expression }> = ({ level, expression }) => {
    const baseClasses = "px-3 py-1 text-xs font-bold rounded-full shadow-sm border border-opacity-20";
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
        case 'High': colorClasses = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'; break;
        case 'Medium': colorClasses = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'; break;
        case 'Low': colorClasses = 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'; break;
        case 'At Risk': colorClasses = 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'; break;
        default: colorClasses = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'; break;
    }
    return (
        <span className={`${baseClasses} ${colorClasses} inline-flex items-center gap-1.5 transition-transform hover:scale-105`}>
            {expression && <span className="text-base leading-none">{expressionEmojiMap[expression]}</span>}
            {level}
        </span>
    );
};

const TeacherStudentInsights: React.FC = () => {
    const { addNotification } = useNotification();
    const { students: enrolledStudents, isLoading: studentsLoading, error: studentsError, refetch: refetchStudents } = useTeacherStudents();
    const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
    const [insights, setInsights] = useState<AIInsight | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh hook
    useAutoRefresh({
        interval: 20000, // 20 seconds
        enabled: autoRefresh,
        onRefresh: refetchStudents
    });

    // Convert enrolled students to student progress
    useEffect(() => {
        if (enrolledStudents.length > 0) {
            const progress: StudentProgress[] = enrolledStudents.map(student => ({
                id: student.id,
                name: student.username || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
                overallProgress: 75, // TODO: Calculate from actual grades
                recentScore: 80, // TODO: Get from latest assignment
                engagement: 'Medium' as EngagementLevel,
                liveEngagement: undefined
            }));
            setStudentProgress(progress);
            setLastRefresh(new Date());
        }
    }, [enrolledStudents]);

    // Show error notification
    useEffect(() => {
        if (studentsError) {
            addNotification(studentsError, 'error');
        }
    }, [studentsError, addNotification]);

    const handleGetInsights = async (student: StudentProgress) => {
        setSelectedStudent(student);
        setIsLoadingInsights(true);
        setError(null);
        setInsights(null);
        try {
            console.log("Fetching insights for:", student.id);
            const result = await apiService.getStudentAIInsights(student);
            console.log("Received insights:", result);
            setInsights(result);
        } catch (err: any) {
            console.error("Error fetching insights:", err);
            const errorMsg = err.message || "Failed to generate insights. Please try again.";
            setError(errorMsg);
            addNotification(errorMsg, 'error');
        } finally {
            setIsLoadingInsights(false);
        }
    };

    if (studentsLoading && studentProgress.length === 0) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Class Overview & Real-Time Insights">
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card title="AI Intervention Assistant">
                        <p className="text-center text-gray-500">Loading...</p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl shadow-inner">
                    <PresentationChartLineIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-300 dark:to-indigo-300">
                        Class Insights & AI Analytics
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time engagement tracking and AI-powered recommendations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-gray-500" /> Class Roster & Progress
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="autoRefresh"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 w-4 h-4"
                                />
                                <label htmlFor="autoRefresh" className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Auto-refresh
                                </label>
                            </div>
                            <button
                                onClick={() => { refetchStudents(); }}
                                disabled={studentsLoading}
                                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh data"
                            >
                                <ArrowPathIcon className={`w-4 h-4 ${studentsLoading ? 'animate-spin' : ''}`} />
                                <span>{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </button>
                        </div>
                    </div>

                    {studentsError && <p className="text-red-500 bg-red-50 p-3 rounded-lg dark:bg-red-900/20">{studentsError}</p>}

                    {studentProgress.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300">
                            No students enrolled in your approved courses yet.
                        </div>
                    ) : (
                        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <ScrollableListContainer>
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Student Name</th>
                                            <th className="px-6 py-4 font-semibold">Overall Progress</th>
                                            <th className="px-6 py-4 font-semibold">Recent Score</th>
                                            <th className="px-6 py-4 font-semibold">Engagement</th>
                                            <th className="px-6 py-4 text-center font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {studentProgress.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full shadow-sm" style={{ width: `${student.overallProgress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1 block">{student.overallProgress}%</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{student.recentScore}%</td>
                                                <td className="px-6 py-4"><EngagementBadge level={student.engagement} expression={student.liveEngagement?.expression} /></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleGetInsights(student)}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={isLoadingInsights && selectedStudent?.id === student.id}
                                                    >
                                                        {isLoadingInsights && selectedStudent?.id === student.id ? (
                                                            <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</div>
                                                        ) : (
                                                            <div className="flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> AI Insights</div>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollableListContainer>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-800 dark:to-gray-900 border border-indigo-100 dark:border-gray-700 rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-indigo-100 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LightBulbIcon className="w-6 h-6 text-amber-500" /> AI Assistant
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Personalized intervention strategies
                            </p>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                            {!selectedStudent && (
                                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 space-y-3">
                                    <SparklesIcon className="w-12 h-12 opacity-20" />
                                    <p>Select a student from the list to generate AI-powered insights.</p>
                                </div>
                            )}

                            {isLoadingInsights && (
                                <div className="flex flex-col items-center justify-center h-48 text-center text-violet-600 dark:text-violet-400 space-y-4 animate-pulse">
                                    <div className="w-16 h-16 bg-violet-200 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                                        <SparklesIcon className="w-8 h-8 animate-spin-slow" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-lg">Analyzing Performance...</p>
                                        <p className="text-xs text-gray-500">Generating personalized recommendations for {selectedStudent?.name}</p>
                                    </div>
                                </div>
                            )}

                            {error && !isLoadingInsights && <div className="p-4 text-center text-red-700 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">{error}</div>}

                            {insights && selectedStudent && !isLoadingInsights && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Analysis for</h4>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.name}</p>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h4 className="font-bold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-2">
                                            <ChartBarIcon className="w-4 h-4" /> Performance Summary
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{insights.summary || "No summary available."}</p>
                                    </div>

                                    {/* Strengths */}
                                    {Array.isArray(insights.strengths) && insights.strengths.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 text-sm uppercase tracking-wide">Key Strengths</h4>
                                            <ul className="space-y-2">
                                                {insights.strengths.map((strength, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                                        <span className="mt-0.5 text-emerald-500">●</span>
                                                        <span className="text-gray-700 dark:text-gray-200">
                                                            {typeof strength === 'string' ? strength : (strength as any).strategy ? <span><strong>{(strength as any).strategy}:</strong> {(strength as any).details}</span> : JSON.stringify(strength)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Areas for Improvement */}
                                    {Array.isArray(insights.areasForImprovement) && insights.areasForImprovement.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2 text-sm uppercase tracking-wide">Areas for Growth</h4>
                                            <ul className="space-y-2">
                                                {insights.areasForImprovement.map((area, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                                        <span className="mt-0.5 text-amber-500">●</span>
                                                        <span className="text-gray-700 dark:text-gray-200">
                                                            {typeof area === 'string' ? area : (area as any).strategy ? <span><strong>{(area as any).strategy}:</strong> {(area as any).details}</span> : JSON.stringify(area)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Intervention Suggestions */}
                                    <div>
                                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2 text-sm uppercase tracking-wide">Suggested Interventions</h4>
                                        <div className="space-y-3">
                                            {Array.isArray(insights.interventionSuggestions) ? (
                                                insights.interventionSuggestions.map((suggestion, index) => (
                                                    <div key={index} className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                                        {typeof suggestion === 'string' ? (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
                                                        ) : (suggestion as any).strategy ? (
                                                            <>
                                                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">{(suggestion as any).strategy}</p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">{(suggestion as any).details}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{JSON.stringify(suggestion)}</p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">{String(insights.interventionSuggestions || "No suggestions available.")}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherStudentInsights;

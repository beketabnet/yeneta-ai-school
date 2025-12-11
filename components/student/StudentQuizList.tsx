import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import TakeQuiz from './TakeQuiz';
import {
    AssignmentIcon,
    TimerIcon,
    CheckCircleIcon,
    PlayIcon,
    ExclamationTriangleIcon,
    ClockIcon
} from '../icons/Icons';

interface Quiz {
    id: number;
    title: string;
    description: string;
    subject: string;
    grade_level: number;
    num_questions: number;
    duration_minutes?: number;
    created_at: string;
    is_completed?: boolean;
    score?: number;
}

const StudentQuizList: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const data = await apiService.getQuizzes();
            setQuizzes(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = (quizId: number) => {
        setActiveQuizId(quizId);
    };

    const handleQuizComplete = () => {
        setActiveQuizId(null);
        fetchQuizzes(); // Refresh list to show updated status
    };

    if (activeQuizId) {
        return (
            <TakeQuiz
                quizId={activeQuizId}
                onComplete={handleQuizComplete}
                onCancel={() => setActiveQuizId(null)}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12 min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl shadow-sm">
                    <AssignmentIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Quizzes & Exams</h2>
                    <p className="text-gray-500 dark:text-gray-400">View and take your assigned assessments</p>
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {quizzes.length === 0 && !error ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl text-center">
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
                        <AssignmentIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Quizzes Assigned</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        You don't have any pending quizzes at the moment. Great job keeping up!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 overflow-hidden"
                        >
                            {/* Decorative gradient header */}
                            <div className={`h-2 w-full ${quiz.is_completed ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}></div>

                            <div className="p-6 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                                        {quiz.subject}
                                    </span>
                                    {quiz.is_completed && (
                                        <span className="px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/50">
                                            <CheckCircleIcon className="w-3.5 h-3.5" />
                                            Score: {quiz.score}%
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {quiz.title}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 flex-grow">
                                    {quiz.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 mb-6 py-3 border-y border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-1.5">
                                        <AssignmentIcon className="w-4 h-4" />
                                        <span>{quiz.num_questions} Questions</span>
                                    </div>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="flex items-center gap-1.5">
                                        <TimerIcon className="w-4 h-4" />
                                        <span>~{quiz.duration_minutes || (quiz.num_questions * 2)} mins</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    disabled={!!quiz.is_completed}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${quiz.is_completed
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5'
                                        }`}
                                >
                                    {quiz.is_completed ? (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <span>Start Quiz</span>
                                            <PlayIcon className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentQuizList;

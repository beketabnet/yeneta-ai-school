import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import {
    TimerIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ExitIcon,
    ExclamationTriangleIcon
} from '../icons/Icons';

interface Question {
    id: number;
    text: string;
    question_type: string;
    points: number;
    options?: string[];
    hint?: string;
}

interface Quiz {
    id: number;
    title: string;
    description: string;
    duration_minutes: number;
    questions: Question[];
}

interface TakeQuizProps {
    quizId: number;
    onComplete: (result: any) => void;
    onCancel: () => void;
}

const TakeQuiz: React.FC<TakeQuizProps> = ({ quizId, onComplete, onCancel }) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const startQuiz = async () => {
            try {
                // 1. Fetch Quiz Details
                const foundQuiz = await apiService.getQuiz(quizId);

                if (foundQuiz && foundQuiz.questions && foundQuiz.questions.length > 0) {
                    setQuiz(foundQuiz);
                    setTimeLeft(foundQuiz.duration_minutes * 60);
                } else {
                    throw new Error("Quiz not found or has no questions.");
                }

                // 2. Start Attempt
                const attempt = await apiService.startQuizAttempt(quizId);
                setAttemptId(attempt.id);

                // Resume if existing attempt
                if (attempt.current_question_index > 0) {
                    setCurrentQuestionIndex(attempt.current_question_index);
                }

            } catch (err: any) {
                console.error("Error starting quiz:", err);
                setError(err.message || "Failed to start quiz");
            } finally {
                setLoading(false);
            }
        };

        startQuiz();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleSubmit(); // Auto-submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, isSubmitting]);

    const handleResponseChange = (questionId: number, value: string) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: value,
        }));

        // Auto-advance for multiple choice
        if (quiz && quiz.questions[currentQuestionIndex].question_type === 'multiple_choice' && currentQuestionIndex < quiz.questions.length - 1) {
            // Optional: Debounce or delay auto-advance
            // setTimeout(() => handleNext(), 800); 
        }
    };

    const handleNext = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!attemptId || isSubmitting) return;

        setIsSubmitting(true);
        setShowConfirmSubmit(false);

        try {
            // Format responses for API
            const formattedResponses = Object.entries(responses).map(([qId, text]) => ({
                question_id: parseInt(qId),
                response_text: text
            }));

            const result = await apiService.submitQuizAttempt(attemptId, formattedResponses);
            onComplete(result);
        } catch (err: any) {
            setError(err.message || "Failed to submit quiz");
            setIsSubmitting(false);
        }
    };

    const handleSaveAndExit = async () => {
        if (!attemptId || !quiz) return;
        try {
            await apiService.pauseQuizAttempt(quiz.id, currentQuestionIndex);
            onCancel(); // Go back to quiz list
        } catch (err: any) {
            console.error("Failed to pause quiz:", err);
            alert("Failed to save progress. Please try again.");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 text-red-700 dark:text-red-300 mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6" />
                    <p className="font-medium">{error || "Quiz not found or has no questions."}</p>
                </div>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Back
                </button>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!currentQuestion) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 text-red-700 dark:text-red-300 mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6" />
                    <p className="font-medium">Error loading question. Please try refreshing.</p>
                </div>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg">Back</button>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Sticky Progress */}
            <div className="sticky top-4 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}>
                            <TimerIcon className="w-5 h-5" />
                            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                        </div>

                        <button
                            onClick={handleSaveAndExit}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ExitIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Save & Exit</span>
                        </button>
                    </div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 min-h-[400px] flex flex-col">
                <div className="flex-grow">
                    <h3 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-8 leading-relaxed">
                        {currentQuestion.text}
                    </h3>

                    <div className="space-y-4">
                        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = responses[currentQuestion.id] === option;
                                    return (
                                        <label
                                            key={idx}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestion.id}`}
                                                value={option}
                                                checked={isSelected}
                                                onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className={`text-base ${isSelected ? 'font-medium text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {option}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea
                                rows={6}
                                placeholder="Type your answer here..."
                                value={responses[currentQuestion.id] || ''}
                                onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky bottom-0 z-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${currentQuestionIndex === 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                            }`}
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Previous
                    </button>

                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                        >
                            <span>Next</span>
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowConfirmSubmit(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5"
                        >
                            <span>Submit Quiz</span>
                            <CheckCircleIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Submit Quiz?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Are you sure you want to submit? You cannot change your answers after submission.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Questions Answered</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {Object.keys(responses).length} <span className="text-gray-400 font-normal">/ {quiz.questions.length}</span>
                            </span>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmSubmit(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all"
                            >
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeQuiz;

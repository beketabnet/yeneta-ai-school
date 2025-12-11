import React, { useState, useEffect } from 'react';

interface ExamModeTimerProps {
    timeLimit: number;  // In seconds
    onTimeUp: () => void;
    isPaused?: boolean;
}

const ExamModeTimer: React.FC<ExamModeTimerProps> = ({
    timeLimit,
    onTimeUp,
    isPaused = false
}) => {
    const [timeRemaining, setTimeRemaining] = useState(timeLimit);

    useEffect(() => {
        if (isPaused || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, timeRemaining, onTimeUp]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = (): number => {
        return (timeRemaining / timeLimit) * 100;
    };

    const getColorClass = (): string => {
        const percentage = getProgressPercentage();
        if (percentage > 50) return 'text-green-600 dark:text-green-400';
        if (percentage > 25) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getProgressBarColor = (): string => {
        const percentage = getProgressPercentage();
        if (percentage > 50) return 'bg-green-500';
        if (percentage > 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⏱️</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Time Remaining
                    </span>
                </div>
                <div className={`text-2xl font-bold font-mono ${getColorClass()}`}>
                    {formatTime(timeRemaining)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${getProgressBarColor()}`}
                    style={{ width: `${getProgressPercentage()}%` }}
                />
            </div>

            {/* Warning Messages */}
            {timeRemaining <= 60 && timeRemaining > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium animate-pulse">
                    ⚠️ Less than 1 minute remaining!
                </div>
            )}

            {timeRemaining === 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-bold">
                    ⏰ Time's up! Submitting your answers...
                </div>
            )}
        </div>
    );
};

export default ExamModeTimer;

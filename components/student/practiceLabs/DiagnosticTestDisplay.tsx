import React, { useState } from 'react';
import { DiagnosticTest, PracticeQuestion } from './types';
import MarkdownRenderer from './MarkdownRenderer';

interface DiagnosticTestDisplayProps {
    test: DiagnosticTest;
    onComplete: (answers: Record<string, string>) => void;
    onCancel: () => void;
}

const DiagnosticTestDisplay: React.FC<DiagnosticTestDisplayProps> = ({
    test,
    onComplete,
    onCancel
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    const currentQuestion = test.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

    const handleAnswerChange = (answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }));
    };

    const handleNext = () => {
        if (!answers[currentQuestion.id]) {
            alert('Please select an answer before proceeding');
            return;
        }

        if (isLastQuestion) {
            setShowConfirmation(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        onComplete(answers);
    };

    const answeredCount = Object.keys(answers).length;
    const unansweredCount = test.questions.length - answeredCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {test.testTitle}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {test.instructions}
                </p>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        ⏱️ Estimated Time: {test.estimatedTime}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                        📝 {test.questions.length} Questions
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Question {currentQuestionIndex + 1} of {test.questions.length}</span>
                    <span>{answeredCount} answered, {unansweredCount} remaining</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                {currentQuestion.difficulty}
                            </span>
                            {currentQuestion.topic && (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    {currentQuestion.topic}
                                </span>
                            )}
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <MarkdownRenderer content={currentQuestion.question} />
                        </div>
                    </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 mt-6">
                    {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
                        <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        answers[currentQuestion.id] === option
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion.id}`}
                                        value={option}
                                        checked={answers[currentQuestion.id] === option}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="ml-3 text-gray-900 dark:text-white">
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {currentQuestion.questionType === 'true_false' && (
                        <div className="space-y-2">
                            {['True', 'False'].map((option) => (
                                <label
                                    key={option}
                                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        answers[currentQuestion.id] === option
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion.id}`}
                                        value={option}
                                        checked={answers[currentQuestion.id] === option}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="ml-3 text-gray-900 dark:text-white font-medium">
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {currentQuestion.questionType === 'short_answer' && (
                        <textarea
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 resize-none"
                            rows={4}
                        />
                    )}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Cancel Test
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                    >
                        {isLastQuestion ? 'Review & Submit →' : 'Next →'}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Submit Diagnostic Test?
                        </h3>
                        <div className="space-y-3 mb-6">
                            <p className="text-gray-600 dark:text-gray-400">
                                You have answered <strong>{answeredCount}</strong> out of <strong>{test.questions.length}</strong> questions.
                            </p>
                            {unansweredCount > 0 && (
                                <p className="text-orange-600 dark:text-orange-400">
                                    ⚠️ {unansweredCount} question(s) remain unanswered.
                                </p>
                            )}
                            <p className="text-gray-600 dark:text-gray-400">
                                Once submitted, you cannot change your answers.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Review Answers
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                            >
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticTestDisplay;

import React, { useState } from 'react';
import { PracticeQuestion, PracticeFeedback } from '../../types';
// FIX: Changed import from deprecated geminiService to apiService.
import { apiService } from '../../services/apiService';
import Card from '../Card';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../icons/Icons';

// FIX: Changed string IDs to numbers to match the PracticeQuestion type.
// Added correct answers for backend evaluation
const mockQuestions: PracticeQuestion[] = [
    { 
        id: 1, 
        subject: 'Science', 
        topic: 'Photosynthesis', 
        question: 'What are the two main products of photosynthesis?',
        correctAnswer: 'Oxygen (O2) and Glucose (C6H12O6)'
    },
    { 
        id: 2, 
        subject: 'History', 
        topic: 'Axumite Kingdom', 
        question: 'What was the main religion of the Axumite Kingdom after King Ezana\'s conversion?',
        correctAnswer: 'Christianity'
    },
    { 
        id: 3, 
        subject: 'Math', 
        topic: 'Algebra', 
        question: 'Solve for x: 2x + 5 = 15',
        correctAnswer: 'x = 5'
    },
];

const ChatLabs: React.FC = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);

    const currentQuestion = mockQuestions[currentQuestionIndex];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim()) return;

        setIsLoading(true);
        setError(null);
        setFeedback(null);

        try {
            // FIX: Updated to call apiService with question text, answer, and correct answer
            const result = await apiService.evaluatePracticeAnswer(
                currentQuestion.question, 
                answer,
                currentQuestion.correctAnswer
            );
            setFeedback(result);
        } catch (err) {
            setError('Could not get feedback from the AI. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => (prev + 1) % mockQuestions.length);
        setAnswer('');
        setFeedback(null);
        setError(null);
        setShowHint(false);
    };

    return (
        <Card title={`ChatLab: ${currentQuestion.subject} Practice`}>
            <div className="max-w-2xl mx-auto">
                <div className="p-4 bg-primary-light dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-semibold text-primary-dark dark:text-gray-300">{currentQuestion.topic}</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{currentQuestion.question}</p>
                    
                    {/* Hint Button */}
                    <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="mt-3 text-sm text-primary dark:text-secondary hover:underline focus:outline-none"
                    >
                        {showHint ? '🙈 Hide Hint' : '💡 Need a Hint?'}
                    </button>
                    
                    {/* Hint Display */}
                    {showHint && currentQuestion.correctAnswer && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 rounded">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">💡 Hint:</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Think about the key concepts in {currentQuestion.topic}. The answer involves understanding the main components or results of this process.
                            </p>
                        </div>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="mt-4">
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Type your answer here..."
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 px-4 py-2 text-white font-semibold bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400"
                    >
                        {isLoading ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                </form>

                {error && <div className="mt-4 p-3 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}

                {feedback && (
                    <div className={`mt-4 p-6 rounded-lg animate-fade-in ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700' : 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700'}`}>
                        {/* Header with icon and title */}
                        <div className="flex items-start space-x-3 mb-4">
                            <div className="flex-shrink-0">
                                {feedback.isCorrect 
                                    ? <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    : <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                                }
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-xl font-bold ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                    {feedback.isCorrect ? '🎉 Excellent! You got it right!' : '💡 Good Try! Let\'s learn together'}
                                </h4>
                                {feedback.score !== undefined && (
                                    <p className={`text-sm font-semibold mt-1 ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                        Score: {feedback.score}/100
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="mb-4">
                            <h5 className={`text-sm font-bold uppercase tracking-wide mb-2 ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                Feedback
                            </h5>
                            <p className={`text-base ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                {feedback.feedback}
                            </p>
                        </div>

                        {/* Explanation */}
                        {feedback.explanation && (
                            <div className="mb-4">
                                <h5 className={`text-sm font-bold uppercase tracking-wide mb-2 ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                    📚 Explanation
                                </h5>
                                <p className={`text-base ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                    {feedback.explanation}
                                </p>
                            </div>
                        )}

                        {/* Hints */}
                        {feedback.hints && feedback.hints.length > 0 && (
                            <div className="mb-4">
                                <h5 className={`text-sm font-bold uppercase tracking-wide mb-2 ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                    💡 Hints for Next Time
                                </h5>
                                <ul className="list-disc list-inside space-y-1">
                                    {feedback.hints.map((hint, index) => (
                                        <li key={index} className={`text-base ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                            {hint}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Next Steps */}
                        {feedback.nextSteps && (
                            <div className={`mt-4 p-3 rounded-md ${feedback.isCorrect ? 'bg-green-100 dark:bg-green-800/50' : 'bg-yellow-100 dark:bg-yellow-800/50'}`}>
                                <h5 className={`text-sm font-bold uppercase tracking-wide mb-2 ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                    🎯 Next Steps
                                </h5>
                                <p className={`text-base ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                    {feedback.nextSteps}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                 <div className="mt-4 text-center">
                    <button onClick={handleNextQuestion} className="text-sm text-primary dark:text-secondary hover:underline">
                        Next Question &rarr;
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default ChatLabs;
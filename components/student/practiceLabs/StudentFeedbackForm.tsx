import React, { useState } from 'react';
import { StudentFeedback } from './types';

interface StudentFeedbackFormProps {
    questionId: string;
    onSubmitFeedback: (feedback: StudentFeedback) => void;
    onClose: () => void;
}

const StudentFeedbackForm: React.FC<StudentFeedbackFormProps> = ({
    questionId,
    onSubmitFeedback,
    onClose
}) => {
    const [struggleReason, setStruggleReason] = useState<StudentFeedback['struggleReason']>('concept');
    const [specificIssue, setSpecificIssue] = useState('');
    const [requestedHelp, setRequestedHelp] = useState<StudentFeedback['requestedHelp']>('hint');

    const handleSubmit = () => {
        if (!specificIssue.trim()) {
            alert('Please describe what you\'re struggling with');
            return;
        }

        onSubmitFeedback({
            questionId,
            struggleReason,
            specificIssue,
            requestedHelp
        });
    };

    const struggleReasons = [
        { value: 'formula' as const, label: '📐 Don\'t understand the formula', icon: '📐' },
        { value: 'concept' as const, label: '💡 Concept is unclear', icon: '💡' },
        { value: 'calculation' as const, label: '🔢 Stuck on calculations', icon: '🔢' },
        { value: 'reading' as const, label: '📖 Question is confusing', icon: '📖' },
        { value: 'time' as const, label: '⏰ Need more time', icon: '⏰' },
        { value: 'other' as const, label: '❓ Other issue', icon: '❓' }
    ];

    const helpTypes = [
        { value: 'hint' as const, label: '💡 Give me a hint', description: 'A gentle nudge in the right direction' },
        { value: 'explanation' as const, label: '📚 Explain the concept', description: 'Help me understand the theory' },
        { value: 'example' as const, label: '📝 Show me an example', description: 'A similar solved problem' },
        { value: 'simplification' as const, label: '🎯 Simplify the question', description: 'Break it down into smaller steps' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                🤔 Need Help?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Tell us what you're struggling with, and we'll provide personalized support
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Step 1: What's the issue? */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            1. What are you struggling with?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {struggleReasons.map((reason) => (
                                <button
                                    key={reason.value}
                                    onClick={() => setStruggleReason(reason.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${struggleReason === reason.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{reason.icon}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {reason.label.replace(reason.icon + ' ', '')}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Specific issue */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            2. Can you be more specific?
                        </label>
                        <textarea
                            value={specificIssue}
                            onChange={(e) => setSpecificIssue(e.target.value)}
                            placeholder="For example: 'I don't understand how to isolate the variable' or 'I got stuck on step 2'"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            The more specific you are, the better we can help you!
                        </p>
                    </div>

                    {/* Step 3: Type of help */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            3. What kind of help would you like?
                        </label>
                        <div className="space-y-2">
                            {helpTypes.map((help) => (
                                <button
                                    key={help.value}
                                    onClick={() => setRequestedHelp(help.value)}
                                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${requestedHelp === help.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${requestedHelp === help.value
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {requestedHelp === help.value && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {help.label}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {help.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!specificIssue.trim()}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                        >
                            Get Personalized Help
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentFeedbackForm;

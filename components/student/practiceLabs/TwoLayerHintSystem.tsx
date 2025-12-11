import React, { useState } from 'react';
import { LightBulbIcon } from '../../icons/Icons';
import Card from '../../Card';

interface TwoLayerHintSystemProps {
    minimalHint?: string;
    detailedHint?: string;
    hints?: string[];  // Fallback to old format
    disabled?: boolean;  // Disabled in exam mode
}

const TwoLayerHintSystem: React.FC<TwoLayerHintSystemProps> = ({
    minimalHint,
    detailedHint,
    hints,
    disabled = false
}) => {
    const [currentLayer, setCurrentLayer] = useState<'none' | 'minimal' | 'detailed'>('none');

    // Parse hints array if using old format
    const parsedMinimalHint = minimalHint || (hints && hints.length > 0 ? hints[0] : undefined);
    const parsedDetailedHint = detailedHint || (hints && hints.length > 1 ? hints.slice(1).join(' ') : undefined);

    if (disabled) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <LightBulbIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Hints disabled in Exam Mode</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Complete the exam to see detailed explanations in your review report
                </p>
            </div>
        );
    }

    if (!parsedMinimalHint && !parsedDetailedHint) {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Hint Controls */}
            <div className="flex items-center gap-3">
                <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Need Help?
                </span>
                <div className="flex gap-2 ml-auto">
                    {parsedMinimalHint && (
                        <button
                            onClick={() => setCurrentLayer(currentLayer === 'minimal' ? 'none' : 'minimal')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                currentLayer === 'minimal'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                            }`}
                        >
                            💡 Layer 1: Quick Hint
                        </button>
                    )}
                    {parsedDetailedHint && (
                        <button
                            onClick={() => setCurrentLayer(currentLayer === 'detailed' ? 'none' : 'detailed')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                currentLayer === 'detailed'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                            }`}
                        >
                            📚 Layer 2: Step-by-Step
                        </button>
                    )}
                </div>
            </div>

            {/* Layer 1: Minimal Hint */}
            {currentLayer === 'minimal' && parsedMinimalHint && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 animate-fadeIn">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            1
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                                Quick Hint
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                {parsedMinimalHint}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 italic">
                                💡 This is a gentle nudge in the right direction. Try to solve it yourself first!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Layer 2: Detailed Hint */}
            {currentLayer === 'detailed' && parsedDetailedHint && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fadeIn">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            2
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                Step-by-Step Breakdown
                            </h4>
                            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                                {parsedDetailedHint.split(/\d+\./).filter(s => s.trim()).map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <span>{step.trim()}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
                                📚 Follow these steps carefully to understand the solution process
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Tip */}
            {currentLayer === 'none' && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        💡 <strong>Two-Layer Hint System:</strong> Start with Layer 1 for a quick hint. 
                        If you need more help, use Layer 2 for a detailed breakdown.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TwoLayerHintSystem;

import React from 'react';

interface RubricConfigPanelProps {
    moeStandardId: string;
    setMoeStandardId: (value: string) => void;
    numCriteria: number;
    setNumCriteria: (value: number) => void;
    weightingEnabled: boolean;
    setWeightingEnabled: (value: boolean) => void;
    multimodalAssessment: boolean;
    setMultimodalAssessment: (value: boolean) => void;
    tonePreference: string;
    setTonePreference: (value: string) => void;
}

const RubricConfigPanel: React.FC<RubricConfigPanelProps> = ({
    moeStandardId,
    setMoeStandardId,
    numCriteria,
    setNumCriteria,
    weightingEnabled,
    setWeightingEnabled,
    multimodalAssessment,
    setMultimodalAssessment,
    tonePreference,
    setTonePreference,
}) => {
    return (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Configuration Options</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject input moved to main form */}

                {/* MoE Standard ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        MoE Standard ID (Optional)
                    </label>
                    <input
                        type="text"
                        value={moeStandardId}
                        onChange={(e) => setMoeStandardId(e.target.value)}
                        placeholder="e.g., G9-MTH-3.2"
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Number of Criteria */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Number of Criteria
                    </label>
                    <input
                        type="number"
                        min="3"
                        max="10"
                        value={numCriteria}
                        onChange={(e) => setNumCriteria(parseInt(e.target.value) || 5)}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Tone Preference */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tone Preference
                    </label>
                    <select
                        value={tonePreference}
                        onChange={(e) => setTonePreference(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="professional">Professional</option>
                        <option value="encouraging">Encouraging</option>
                        <option value="constructive">Constructive</option>
                        <option value="formal">Formal</option>
                    </select>
                </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={weightingEnabled}
                        onChange={(e) => setWeightingEnabled(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable Criterion Weighting (assign different weights to criteria)
                    </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={multimodalAssessment}
                        onChange={(e) => setMultimodalAssessment(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Multimodal Assessment (include visual, audio, and textual criteria)
                    </span>
                </label>
            </div>
        </div>
    );
};

export default RubricConfigPanel;

import React from 'react';
import { PracticeConfig } from './types';
import GradeLevelSelector from './GradeLevelSelector';
import StreamSelector from './StreamSelector';
import SubjectSelector from './SubjectSelector';
import CommonConfigOptions from './CommonConfigOptions';

interface DiagnosticModeConfigProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    curriculumConfig: any;
    availableSubjects: string[];
    regions: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    streams: { id: number; name: string }[];
}

const DiagnosticModeConfig: React.FC<DiagnosticModeConfigProps> = ({
    config,
    onConfigChange,
    curriculumConfig,
    availableSubjects,
    regions,
    gradeLevels,
    streams
}) => {
    return (
        <>
            {/* Info Banner */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    🎯 Diagnostic Assessment
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI will assess your current knowledge level across multiple subjects and identify areas for improvement.
                </p>
            </div>

            {/* Region Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                </label>
                <select
                    value={config.region || ''}
                    onChange={(e) => onConfigChange({ region: e.target.value, subject: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                        <option key={region.id} value={region.name}>
                            {region.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Grade Level */}
            <GradeLevelSelector
                config={config}
                onConfigChange={onConfigChange}
                gradeLevels={gradeLevels}
            />

            {/* Stream Selection (for grades 11-12) */}
            {(config.gradeLevel === 11 || config.gradeLevel === 12) && (
                <StreamSelector
                    config={config}
                    onConfigChange={onConfigChange}
                    curriculumConfig={curriculumConfig}
                    showAllStreamsOption={false}
                    streams={streams}
                />
            )}

            {/* Subject Selection */}
            <SubjectSelector
                config={config}
                onConfigChange={onConfigChange}
                availableSubjects={availableSubjects}
                showStreamInfo={true}
            />

            {/* Common Configuration Options */}
            <CommonConfigOptions
                config={config}
                onConfigChange={onConfigChange}
                showGradeLevel={false}
                showCurriculumRAG={false}
            />
        </>
    );
};

export default DiagnosticModeConfig;

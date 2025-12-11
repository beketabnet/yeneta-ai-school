import React from 'react';
import { PracticeConfig } from './types';
import GradeLevelSelector from './GradeLevelSelector';
import StreamSelector from './StreamSelector';
import SubjectSelector from './SubjectSelector';
import CommonConfigOptions from './CommonConfigOptions';

interface RandomModeConfigProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    curriculumConfig: any;
    availableSubjects: string[];
    regions: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    streams: { id: number; name: string }[];
}

const RandomModeConfig: React.FC<RandomModeConfigProps> = ({
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

            {/* Subject Selection (Optional for Random Mode) */}
            <SubjectSelector
                config={config}
                onConfigChange={onConfigChange}
                availableSubjects={availableSubjects}
                showStreamInfo={false}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2">
                💡 Leave empty to randomly select from all subjects, or choose a specific subject for random questions within that subject.
            </p>

            {/* Common Configuration Options */}
            <CommonConfigOptions
                config={config}
                onConfigChange={onConfigChange}
                showGradeLevel={false}
                showCurriculumRAG={true}
            />
        </>
    );
};

export default RandomModeConfig;

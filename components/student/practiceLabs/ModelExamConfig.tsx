import React from 'react';
import { PracticeConfig } from './types';
import GradeLevelSelector from './GradeLevelSelector';
import StreamSelector from './StreamSelector';
import SubjectSelector from './SubjectSelector';
import ExamYearInput from './ExamYearInput';
import CommonConfigOptions from './CommonConfigOptions';

interface ModelExamConfigProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    availableSubjects: string[];
    curriculumConfig: any;
    regions: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    streams: { id: number; name: string }[];
}

const ModelExamConfig: React.FC<ModelExamConfigProps> = ({
    config,
    onConfigChange,
    availableSubjects,
    curriculumConfig,
    regions,
    gradeLevels,
    streams
}) => {
    return (
        <>
            {/* Info Banner */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    📝 Grade 12 Model Exam Practice
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Practice with model exam questions designed to prepare you for the Grade 12 national leaving exam. These questions follow the same format and difficulty as the actual exam.
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

            {/* Grade Level - Fixed to 12 for Model */}
            <GradeLevelSelector
                config={config}
                onConfigChange={onConfigChange}
                disabled={true}
                gradeLevels={gradeLevels}
            />

            {/* Stream Selection */}
            <StreamSelector
                config={config}
                onConfigChange={onConfigChange}
                curriculumConfig={curriculumConfig}
                showAllStreamsOption={true}
                streams={streams}
            />

            {/* Subject Selection */}
            <SubjectSelector
                config={config}
                onConfigChange={onConfigChange}
                availableSubjects={availableSubjects}
                showStreamInfo={true}
            />

            {/* Chapter Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chapter (Optional)
                </label>
                <input
                    type="text"
                    value={config.topic || ''}
                    onChange={(e) => onConfigChange({ topic: e.target.value })}
                    placeholder="e.g., Chapter 1, Chapter 2, Ch 3, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="Enter chapter number or name"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter chapter number or name. AI understands "Chapter 1", "Ch 2", "Chapter Two", etc.
                </p>
            </div>

            {/* Exam Year */}
            <ExamYearInput
                config={config}
                onConfigChange={onConfigChange}
            />

            {/* Common Configuration Options (Difficulty, Adaptive, RAGs, Coach) */}
            <CommonConfigOptions
                config={config}
                onConfigChange={onConfigChange}
                showGradeLevel={false}
                showCurriculumRAG={false}
            />
        </>
    );
};

export default ModelExamConfig;

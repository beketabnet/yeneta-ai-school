import React from 'react';
import { PracticeConfig } from './types';
import GradeLevelSelector from './GradeLevelSelector';
import StreamSelector from './StreamSelector';
import SubjectSelector from './SubjectSelector';
import ChapterTopicInput from './ChapterTopicInput';
import CommonConfigOptions from './CommonConfigOptions';

interface SubjectModeConfigProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    availableSubjects: string[];
    curriculumConfig: any;
    topicsBySubject: Record<string, string[]>;
    regions: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    streams: { id: number; name: string }[];
}

const SubjectModeConfig: React.FC<SubjectModeConfigProps> = ({
    config,
    onConfigChange,
    availableSubjects,
    curriculumConfig,
    topicsBySubject,
    regions,
    gradeLevels,
    streams
}) => {
    return (
        <>
            {/* Grade Level */}
            {/* Curriculum RAG Toggle - Moved to Top */}
            <div className="mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                📚 Curriculum Books
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                                RAG
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Questions from Ethiopian curriculum textbooks
                        </p>
                    </div>
                    <button
                        type="button"
                        className={`${config.useCurriculumRAG ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                        onClick={() => onConfigChange({ useCurriculumRAG: !config.useCurriculumRAG })}
                        aria-label="Toggle curriculum books RAG"
                    >
                        <span
                            className={`${config.useCurriculumRAG ? 'translate-x-6' : 'translate-x-1'
                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
                    </button>
                </div>
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
                showStreamInfo={false}
            />

            {/* Topic/Chapter Input */}
            {config.subject && (
                <div className="mb-4">
                    <ChapterTopicInput
                        value={config.topic}
                        onChange={(value) => onConfigChange({ topic: value })}
                        availableTopics={topicsBySubject[config.subject] || []}
                        subject={config.subject}
                        placeholder="Enter topic or chapter (e.g., 'Algebra' or 'Chapter 3')"
                    />
                </div>
            )}

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

export default SubjectModeConfig;

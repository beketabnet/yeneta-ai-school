import React from 'react';
import { PracticeConfig } from './types';
import { STREAMS } from '../../../utils/curriculumData';

interface StreamSelectorProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    curriculumConfig?: any; // Kept for backward compatibility but unused
    showAllStreamsOption?: boolean;
    streams: { id: number; name: string }[];
}

const StreamSelector: React.FC<StreamSelectorProps> = ({
    config,
    onConfigChange,
    curriculumConfig,
    showAllStreamsOption = false,
    streams
}) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stream *
            </label>
            <select
                value={config.stream || 'N/A'}
                onChange={(e) => onConfigChange({ stream: e.target.value, subject: '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Select stream"
            >
                {showAllStreamsOption && <option value="N/A">All Streams</option>}
                {!showAllStreamsOption && <option value="N/A">Select stream...</option>}
                {streams.map((stream) => (
                    <option key={stream.id} value={stream.name}>{stream.name}</option>
                ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {showAllStreamsOption
                    ? 'Select "All Streams" to practice questions from both Natural and Social Science streams'
                    : 'Required for Grades 11-12. Choose based on your academic track.'
                }
            </p>
        </div>
    );
};

export default StreamSelector;

import React from 'react';
import { PracticeConfig } from './types';

interface SubjectSelectorProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    availableSubjects: string[];
    showStreamInfo?: boolean;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ 
    config, 
    onConfigChange,
    availableSubjects,
    showStreamInfo = false
}) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
            </label>
            <select
                value={config.subject || ''}
                onChange={(e) => {
                    const selectedSubject = e.target.value;
                    console.log('Subject selected:', selectedSubject);
                    onConfigChange({ subject: selectedSubject, topic: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={availableSubjects.length === 0}
                aria-label="Select subject"
            >
                <option value="">
                    {availableSubjects.length === 0 
                        ? (config.gradeLevel === 11 || config.gradeLevel === 12) && (!config.stream || config.stream === 'N/A')
                            ? 'Select stream first...'
                            : 'Loading subjects...'
                        : 'Select a subject...'
                    }
                </option>
                {availableSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                ))}
            </select>
            {showStreamInfo && config.stream && config.stream !== 'N/A' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Subjects for {config.stream} Stream
                </p>
            )}
            {config.gradeLevel && !showStreamInfo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Subjects for {config.gradeLevel === 'KG' ? 'Kindergarten' : `Grade ${config.gradeLevel}`}
                </p>
            )}
        </div>
    );
};

export default SubjectSelector;

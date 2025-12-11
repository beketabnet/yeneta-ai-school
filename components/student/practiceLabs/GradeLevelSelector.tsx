import React from 'react';
import { PracticeConfig } from './types';

interface GradeLevelSelectorProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    disabled?: boolean;
    gradeLevels: { id: number; name: string }[];
}

const GradeLevelSelector: React.FC<GradeLevelSelectorProps> = ({
    config,
    onConfigChange,
    disabled = false,
    gradeLevels
}) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade Level *
            </label>
            <select
                value={config.gradeLevel}
                onChange={(e) => {
                    const value = parseInt(e.target.value);
                    onConfigChange({
                        gradeLevel: value,
                        stream: (value === 11 || value === 12) ? config.stream : 'N/A',
                        subject: '' // Reset subject when grade changes
                    });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
                aria-label="Select grade level"
            >
                {gradeLevels.map(grade => {
                    // Extract number from "Grade X" or use ID if appropriate
                    // Assuming name is "Grade X" or "Kindergarten"
                    let value: number = grade.id;
                    if (grade.name.startsWith('Grade ')) {
                        value = parseInt(grade.name.replace('Grade ', ''));
                    } else if (grade.name === 'Kindergarten') {
                        value = 0; // Map KG to 0
                    }

                    return (
                        <option key={grade.id} value={value}>{grade.name}</option>
                    );
                })}
            </select>
            {config.gradeLevel !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {config.gradeLevel === 0 && 'Pre-primary Education'}
                    {[1, 2, 3, 4, 5, 6].includes(config.gradeLevel) && 'Primary Education'}
                    {[7, 8].includes(config.gradeLevel) && 'Middle Education'}
                    {[9, 10].includes(config.gradeLevel) && 'General Secondary'}
                    {[11, 12].includes(config.gradeLevel) && 'Preparatory Secondary'}
                </p>
            )}
        </div>
    );
};

export default GradeLevelSelector;

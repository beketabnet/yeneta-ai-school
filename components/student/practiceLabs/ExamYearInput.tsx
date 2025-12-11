import React from 'react';
import { PracticeConfig } from './types';

interface ExamYearInputProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
}

const ExamYearInput: React.FC<ExamYearInputProps> = ({ 
    config, 
    onConfigChange
}) => {
    const currentYear = new Date().getFullYear();

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Year (Optional)
            </label>
            <input
                type="text"
                value={config.examYear || ''}
                onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty, single year (1990-current), or year range (1990-1995)
                    if (value === '') {
                        onConfigChange({ examYear: value });
                        return;
                    }
                    // Validate format: single year or year range
                    const singleYearPattern = /^\d{4}$/;
                    const rangePattern = /^\d{4}-\d{4}$/;
                    
                    if (singleYearPattern.test(value)) {
                        const year = parseInt(value);
                        if (year >= 1990 && year <= currentYear) {
                            onConfigChange({ examYear: value });
                        }
                    } else if (rangePattern.test(value)) {
                        const [startYear, endYear] = value.split('-').map(y => parseInt(y));
                        if (startYear >= 1990 && endYear <= currentYear && startYear <= endYear) {
                            onConfigChange({ examYear: value });
                        }
                    } else if (/^\d{0,4}(-\d{0,4})?$/.test(value)) {
                        // Allow partial input while typing
                        onConfigChange({ examYear: value });
                    }
                }}
                placeholder={`e.g., ${currentYear}, 2020-2023, 1990-2000`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Enter exam year"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter single year (1990-{currentYear}) or range (e.g., 2020-2023)
            </p>
        </div>
    );
};

export default ExamYearInput;

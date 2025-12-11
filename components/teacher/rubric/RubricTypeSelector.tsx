import React from 'react';
import { RubricType } from '../../../types';

interface RubricTypeSelectorProps {
    selectedType: RubricType;
    onChange: (type: RubricType) => void;
}

const RubricTypeSelector: React.FC<RubricTypeSelectorProps> = ({ selectedType, onChange }) => {
    const rubricTypes: { value: RubricType; label: string; description: string }[] = [
        {
            value: 'analytic',
            label: 'Analytic Rubric',
            description: 'Breaks down criteria into parts with specific performance levels'
        },
        {
            value: 'holistic',
            label: 'Holistic Rubric',
            description: 'Overall impression of the entire work'
        },
        {
            value: 'single_point',
            label: 'Single-Point Rubric',
            description: 'Focuses on feedback with concerns, criteria, and advanced columns'
        },
        {
            value: 'checklist',
            label: 'Checklist Rubric',
            description: 'Simple yes/no or met/not met format'
        }
    ];

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rubric Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rubricTypes.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => onChange(type.value)}
                        className={`p-4 text-left border-2 rounded-lg transition-all ${
                            selectedType === type.value
                                ? 'border-primary bg-primary/10 dark:border-secondary dark:bg-secondary/10'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-secondary/50'
                        }`}
                    >
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                            {type.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RubricTypeSelector;

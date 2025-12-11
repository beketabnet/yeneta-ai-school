import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '../../icons/Icons';

interface LearningObjectivesInputProps {
    objectives: string[];
    onChange: (objectives: string[]) => void;
}

const LearningObjectivesInput: React.FC<LearningObjectivesInputProps> = ({ objectives, onChange }) => {
    const [newObjective, setNewObjective] = useState('');

    const addObjective = () => {
        if (newObjective.trim()) {
            onChange([...objectives, newObjective.trim()]);
            setNewObjective('');
        }
    };

    const removeObjective = (index: number) => {
        onChange(objectives.filter((_, i) => i !== index));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addObjective();
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Learning Objectives (Optional - Enables Alignment Validation)
            </label>
            
            {/* Existing Objectives */}
            {objectives.length > 0 && (
                <div className="space-y-2">
                    {objectives.map((obj, index) => (
                        <div
                            key={index}
                            className="flex items-start space-x-2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                        >
                            <span className="flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
                                {index + 1}.
                            </span>
                            <span className="flex-grow text-sm text-gray-700 dark:text-gray-300">
                                {obj}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeObjective(index)}
                                className="flex-shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                aria-label={`Remove objective ${index + 1}`}
                            >
                                <XMarkIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Objective */}
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a learning objective (e.g., Students will analyze...)"
                    className="flex-grow p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                    type="button"
                    onClick={addObjective}
                    disabled={!newObjective.trim()}
                    className="flex items-center space-x-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                    aria-label="Add objective"
                >
                    <PlusIcon />
                    <span>Add</span>
                </button>
            </div>

            {objectives.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    ✓ Alignment validation will be performed against these objectives
                </p>
            )}
        </div>
    );
};

export default LearningObjectivesInput;

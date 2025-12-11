import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { useCurriculum } from '../../hooks/useCurriculum';

interface EnhancedLessonConfigFormProps {
    onConfigChange: (config: LessonConfig) => void;
    onGenerateLesson: (config: LessonConfig) => Promise<void>;
    isLoading?: boolean;
    onBack?: () => void;
}

export interface LessonConfig {
    useEthiopianCurriculum: boolean;
    gradeLevel: string;
    stream: string;
    subject: string;
    chapter: string;
    topic: string;
    duration: number;
    objectives: string[];
}

const ToggleSwitch: React.FC<{
    isEnabled: boolean;
    onToggle: () => void;
    label: string;
}> = ({ isEnabled, onToggle, label }) => (
    <div className="flex items-center gap-3">
        <button
            type="button"
            className={`${isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            onClick={onToggle}
            aria-pressed={isEnabled}
        >
            <span
                className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </span>
    </div>
);

const EnhancedLessonConfigForm: React.FC<EnhancedLessonConfigFormProps> = ({
    onConfigChange,
    onGenerateLesson,
    isLoading = false,
    onBack,
}) => {
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();
    const [config, setConfig] = useState<LessonConfig>({
        useEthiopianCurriculum: true,
        gradeLevel: '',
        stream: '',
        subject: '',
        chapter: '',
        topic: '',
        duration: 45,
        objectives: [''],
    });

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [streamRequired, setStreamRequired] = useState(false);
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!config.gradeLevel) {
                setAvailableSubjects([]);
                setStreamRequired(false);
                return;
            }

            // Determine if stream is required based on grade name
            // This logic assumes gradeLevel stores the ID, so we need to find the name
            const selectedGrade = gradeLevels.find(g => g.id.toString() === config.gradeLevel || g.name === config.gradeLevel);
            const gradeName = selectedGrade ? selectedGrade.name : config.gradeLevel;

            const isStreamNeeded = gradeName === 'Grade 11' || gradeName === 'Grade 12';
            setStreamRequired(isStreamNeeded);

            if (isStreamNeeded && !config.stream) {
                setAvailableSubjects([]);
                return;
            }

            setIsSubjectsLoading(true);
            try {
                // Assuming region is not selected in this form, passing undefined. 
                // If region is needed, it should be added to the form or context.
                // For now, we'll fetch subjects for the grade/stream without region filter if possible, 
                // or we might need to default to a region if the backend requires it.
                // The getSubjectsFor method handles optional parameters.
                const subjects = await getSubjectsFor(undefined, config.gradeLevel, config.stream || undefined);
                setAvailableSubjects(subjects.map(s => s.name));
            } catch (err) {
                console.error('Failed to load subjects:', err);
                setAvailableSubjects([]);
            } finally {
                setIsSubjectsLoading(false);
            }
        };

        loadSubjects();
    }, [config.gradeLevel, config.stream, gradeLevels, getSubjectsFor]);

    const handleConfigUpdate = (updates: Partial<LessonConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        onConfigChange(newConfig);
    };

    const handleAddObjective = () => {
        handleConfigUpdate({
            objectives: [...config.objectives, ''],
        });
    };

    const handleRemoveObjective = (index: number) => {
        handleConfigUpdate({
            objectives: config.objectives.filter((_, i) => i !== index),
        });
    };

    const handleObjectiveChange = (index: number, value: string) => {
        const newObjectives = [...config.objectives];
        newObjectives[index] = value;
        handleConfigUpdate({ objectives: newObjectives });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config.gradeLevel || !config.topic) {
            alert('Please fill in Grade Level and Topic');
            return;
        }
        await onGenerateLesson(config);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create Your AI-Powered Lesson
                </h1>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                    >
                        ← Back
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ethiopian Curriculum Toggle */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <ToggleSwitch
                        isEnabled={config.useEthiopianCurriculum}
                        onToggle={() =>
                            handleConfigUpdate({
                                useEthiopianCurriculum: !config.useEthiopianCurriculum,
                            })
                        }
                        label="Use Ethiopian Curriculum"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Enable to align lesson content with Ethiopian curriculum textbooks
                        and standards
                    </p>
                </div>

                {config.useEthiopianCurriculum && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Grade Level */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Grade Level *
                            </label>
                            <select
                                value={config.gradeLevel}
                                onChange={(e) =>
                                    handleConfigUpdate({
                                        gradeLevel: e.target.value,
                                        stream: '',
                                        subject: '',
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select Grade</option>
                                {gradeLevels.map((grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stream (for Grades 11-12) */}
                        {streamRequired && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Stream
                                </label>
                                <select
                                    value={config.stream}
                                    onChange={(e) =>
                                        handleConfigUpdate({ stream: e.target.value, subject: '' })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Stream</option>
                                    {streams.map((stream) => (
                                        <option key={stream.id} value={stream.id}>{stream.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Subject */}
                        <div className={streamRequired ? '' : 'lg:col-span-2'}>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Subject
                            </label>
                            <select
                                value={config.subject}
                                onChange={(e) =>
                                    handleConfigUpdate({ subject: e.target.value })
                                }
                                disabled={
                                    !config.gradeLevel ||
                                    (streamRequired && !config.stream) ||
                                    isSubjectsLoading
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!config.gradeLevel
                                        ? 'Select grade first'
                                        : streamRequired && !config.stream
                                            ? 'Select stream first'
                                            : isSubjectsLoading
                                                ? 'Loading subjects...'
                                                : availableSubjects.length === 0
                                                    ? 'No subjects found'
                                                    : 'Select Subject (Optional)'}
                                </option>
                                {availableSubjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Chapter/Unit/Lesson */}
                        <div className={streamRequired ? 'md:col-span-2 lg:col-span-1' : ''}>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Chapter / Unit / Lesson
                            </label>
                            <input
                                type="text"
                                value={config.chapter}
                                onChange={(e) =>
                                    handleConfigUpdate({ chapter: e.target.value })
                                }
                                placeholder="e.g., Chapter 3, Unit 1, Lesson 5"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Guides extraction of full chapter content from textbooks
                            </p>
                        </div>
                    </div>
                )}

                {/* Topic/Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Topic/Title *
                    </label>
                    <input
                        type="text"
                        value={config.topic}
                        onChange={(e) => handleConfigUpdate({ topic: e.target.value })}
                        placeholder="e.g., Photosynthesis, The French Revolution, Chapter 3: Fractions"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supports: "Chapter 1", "Unit 2", "Chapter One", "Unit Two", etc.
                    </p>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={config.duration}
                        onChange={(e) =>
                            handleConfigUpdate({ duration: parseInt(e.target.value) || 45 })
                        }
                        min="15"
                        max="180"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Learning Objectives */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Learning Objectives
                    </label>
                    <div className="space-y-2">
                        {config.objectives.map((objective, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={objective}
                                    onChange={(e) =>
                                        handleObjectiveChange(index, e.target.value)
                                    }
                                    placeholder={`Objective ${index + 1}`}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {config.objectives.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveObjective(index)}
                                        className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-semibold"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddObjective}
                        className="mt-3 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-semibold"
                    >
                        + Add Objective
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-300 dark:border-gray-700">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={
                            isLoading ||
                            !config.topic ||
                            (config.useEthiopianCurriculum && !config.gradeLevel)
                        }
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Lesson'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EnhancedLessonConfigForm;

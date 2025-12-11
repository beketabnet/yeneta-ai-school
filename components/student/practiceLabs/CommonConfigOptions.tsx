import React from 'react';
import { PracticeConfig, Difficulty, CoachPersonality } from './types';

interface CommonConfigOptionsProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    showGradeLevel?: boolean;
    showCurriculumRAG?: boolean;
}

const CommonConfigOptions: React.FC<CommonConfigOptionsProps> = ({
    config,
    onConfigChange,
    showGradeLevel = true,
    showCurriculumRAG = true
}) => {
    return (
        <>
            {/* Grade Level and Difficulty */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {showGradeLevel && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Grade Level
                        </label>
                        <select
                            value={config.gradeLevel}
                            onChange={(e) => {
                                const value = e.target.value;
                                const gradeLevel = value === 'KG' ? 'KG' : parseInt(value);
                                onConfigChange({ 
                                    gradeLevel,
                                    stream: (gradeLevel === 11 || gradeLevel === 12) ? config.stream : 'N/A'
                                });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            aria-label="Select grade level"
                        >
                            <option value="KG">Kindergarten (KG)</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                            ))}
                        </select>
                        {config.gradeLevel && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {config.gradeLevel === 'KG' && 'Pre-primary Education'}
                                {[1, 2, 3, 4, 5, 6].includes(config.gradeLevel as number) && 'Primary Education'}
                                {[7, 8].includes(config.gradeLevel as number) && 'Middle Education'}
                                {[9, 10].includes(config.gradeLevel as number) && 'General Secondary'}
                                {[11, 12].includes(config.gradeLevel as number) && 'Preparatory Secondary'}
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty
                    </label>
                    <select
                        value={config.difficulty}
                        onChange={(e) => onConfigChange({ difficulty: e.target.value as Difficulty })}
                        disabled={config.adaptiveDifficulty}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Select difficulty level"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>

            {/* Adaptive Difficulty Toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            🧠 Adaptive Difficulty
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        AI adjusts difficulty based on your performance
                    </p>
                </div>
                <button
                    type="button"
                    className={`${
                        config.adaptiveDifficulty ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                    onClick={() => onConfigChange({ adaptiveDifficulty: !config.adaptiveDifficulty })}
                    aria-label="Toggle adaptive difficulty"
                >
                    <span
                        className={`${
                            config.adaptiveDifficulty ? 'translate-x-6' : 'translate-x-1'
                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                    />
                </button>
            </div>

            {/* RAG Toggles */}
            <div className="space-y-3 mb-4">
                {/* Curriculum RAG Toggle */}
                {showCurriculumRAG && (
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
                            className={`${
                                config.useCurriculumRAG ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                            onClick={() => onConfigChange({ useCurriculumRAG: !config.useCurriculumRAG })}
                            aria-label="Toggle curriculum books RAG"
                        >
                            <span
                                className={`${
                                    config.useCurriculumRAG ? 'translate-x-6' : 'translate-x-1'
                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                            />
                        </button>
                    </div>
                )}

                {/* National Exam RAG Toggle */}
                {config.gradeLevel === 12 && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    📝 National Exam Questions
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                    RAG
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Questions from Grade 12 national leaving exams archive
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`${
                                config.useExamRAG ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                            onClick={() => onConfigChange({ useExamRAG: !config.useExamRAG })}
                            aria-label="Toggle national exam questions RAG"
                        >
                            <span
                                className={`${
                                    config.useExamRAG ? 'translate-x-6' : 'translate-x-1'
                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                            />
                        </button>
                    </div>
                )}
            </div>

            {/* Coach Personality Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🎭 AI Coach Personality
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => onConfigChange({ coachPersonality: 'patient' })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            config.coachPersonality === 'patient'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        aria-label="Select patient mentor personality"
                    >
                        🧘 Patient Mentor
                    </button>
                    <button
                        onClick={() => onConfigChange({ coachPersonality: 'energetic' })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            config.coachPersonality === 'energetic'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        aria-label="Select energetic coach personality"
                    >
                        ⚡ Energetic Coach
                    </button>
                    <button
                        onClick={() => onConfigChange({ coachPersonality: 'analyst' })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            config.coachPersonality === 'analyst'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        aria-label="Select analyst personality"
                    >
                        📊 Analyst
                    </button>
                </div>
            </div>
        </>
    );
};

export default CommonConfigOptions;

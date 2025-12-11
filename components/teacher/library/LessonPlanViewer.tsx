import React from 'react';
import { XMarkIcon, AcademicCapIcon, BookOpenIcon } from '../../icons/Icons';
import { SavedLessonPlan } from '../../../types';

interface LessonPlanViewerProps {
    isOpen: boolean;
    onClose: () => void;
    lessonPlan: SavedLessonPlan | null;
}

export const LessonPlanViewer: React.FC<LessonPlanViewerProps> = ({ isOpen, onClose, lessonPlan }) => {
    if (!isOpen || !lessonPlan) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {lessonPlan.title}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <AcademicCapIcon className="w-4 h-4" />
                                <span>{lessonPlan.grade_level}</span>
                            </div>
                            {lessonPlan.subject && (
                                <div className="flex items-center gap-1">
                                    <BookOpenIcon className="w-4 h-4" />
                                    <span>{lessonPlan.subject}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <span>⏱️ {lessonPlan.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>📅 {new Date(lessonPlan.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        aria-label="Close viewer"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Learning Objectives */}
                    {lessonPlan.objectives && lessonPlan.objectives.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Learning Objectives
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                {lessonPlan.objectives.map((obj, idx) => (
                                    <li key={idx}>{obj}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Materials */}
                    {lessonPlan.materials && lessonPlan.materials.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Materials Needed
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {lessonPlan.materials.map((material, idx) => (
                                    <li key={idx}>{material}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* 5E Sequence or Activities */}
                    {lessonPlan.fiveESequence && lessonPlan.fiveESequence.length > 0 ? (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Instructional Sequence (5E Model)
                            </h3>
                            <div className="space-y-4">
                                {lessonPlan.fiveESequence.map((phase, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                            {phase.phase} ({phase.duration} min)
                                        </h4>
                                        {phase.activities && phase.activities.length > 0 && (
                                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                                {phase.activities.map((act, i) => (
                                                    <li key={i}>{act}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : lessonPlan.activities && lessonPlan.activities.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Main Activities
                            </h3>
                            <div className="space-y-4">
                                {lessonPlan.activities.map((activity, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                            Activity {idx + 1}
                                            {typeof activity === 'object' && activity.duration && ` (${activity.duration} min)`}
                                        </h4>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {typeof activity === 'string' ? activity : activity.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Assessment */}
                    {lessonPlan.assessment && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Assessment
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {lessonPlan.assessment}
                            </p>
                        </section>
                    )}

                    {/* Differentiation Strategies */}
                    {lessonPlan.differentiationStrategies && lessonPlan.differentiationStrategies.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Differentiation Strategies
                            </h3>
                            <div className="space-y-3">
                                {lessonPlan.differentiationStrategies.map((strategy, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            {strategy.level}
                                        </h4>
                                        {strategy.contentAdaptations && strategy.contentAdaptations.length > 0 && (
                                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                                {strategy.contentAdaptations.map((adapt, i) => (
                                                    <li key={i}>{adapt}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Homework */}
                    {lessonPlan.homework && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Homework
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {lessonPlan.homework}
                            </p>
                        </section>
                    )}

                    {/* Extensions */}
                    {lessonPlan.extensions && lessonPlan.extensions.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Extensions
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                {lessonPlan.extensions.map((ext, idx) => (
                                    <li key={idx}>{ext}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Reflection Prompts */}
                    {lessonPlan.reflection_prompts && lessonPlan.reflection_prompts.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Reflection Prompts
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                {lessonPlan.reflection_prompts.map((prompt, idx) => (
                                    <li key={idx}>{prompt}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Local Context */}
                    {lessonPlan.local_context && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Local Context
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {lessonPlan.local_context}
                            </p>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created by: {lessonPlan.created_by?.username || 'Unknown'}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonPlanViewer;

import React from 'react';
import { XMarkIcon, AcademicCapIcon, BookOpenIcon, ScaleIcon } from '../../icons/Icons';
import { SavedRubric } from '../../../types';

interface RubricViewerProps {
    isOpen: boolean;
    onClose: () => void;
    rubric: SavedRubric | null;
}

export const RubricViewer: React.FC<RubricViewerProps> = ({ isOpen, onClose, rubric }) => {
    if (!isOpen || !rubric) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {rubric.title}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <AcademicCapIcon className="w-4 h-4" />
                                <span>{rubric.grade_level}</span>
                            </div>
                            {rubric.subject && (
                                <div className="flex items-center gap-1">
                                    <BookOpenIcon className="w-4 h-4" />
                                    <span>{rubric.subject}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <ScaleIcon className="w-4 h-4" />
                                <span>{rubric.rubric_type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>📅 {new Date(rubric.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>⭐ {rubric.total_points} points</span>
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
                    {/* Topic */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Topic
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">{rubric.topic}</p>
                    </section>

                    {/* Learning Objectives */}
                    {rubric.learning_objectives && rubric.learning_objectives.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Learning Objectives
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                {rubric.learning_objectives.map((obj, idx) => (
                                    <li key={idx}>{obj}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Rubric Criteria */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Assessment Criteria
                        </h3>
                        <div className="space-y-4">
                            {rubric.criteria.map((criterion, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {criterion.criterion}
                                        </h4>
                                        {rubric.weighting_enabled && criterion.weight && (
                                            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                Weight: {criterion.weight}%
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Performance Levels */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                                        {criterion.performanceLevels.map((level, levelIdx) => (
                                            <div 
                                                key={levelIdx} 
                                                className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                        {level.level}
                                                    </span>
                                                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                        {level.points} pts
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {level.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Additional Information */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rubric.multimodal_assessment && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                    Multimodal Assessment
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    This rubric supports multiple assessment formats
                                </p>
                            </div>
                        )}
                        
                        {rubric.alignment_validated && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                                    Curriculum Aligned
                                </h4>
                                <p className="text-sm text-green-800 dark:text-green-300">
                                    Alignment Score: {(rubric.alignment_score * 100).toFixed(0)}%
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Usage Statistics */}
                    <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Usage Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {rubric.times_used}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Times Used
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {rubric.criteria.length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Criteria
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {rubric.total_points}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Total Points
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {rubric.average_rating?.toFixed(1) || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Avg Rating
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created by: {rubric.created_by?.username || 'Unknown'}
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

export default RubricViewer;

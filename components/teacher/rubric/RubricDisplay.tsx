import React, { useState } from 'react';
import { GeneratedRubric } from '../../../types';
import { CheckCircleIcon, DownloadIcon, SaveIcon } from '../../icons/Icons';
import ExportOptionsModal, { ExportFormat } from './ExportOptionsModal';
import SaveRubricModal, { SaveFormat } from './SaveRubricModal';

interface RubricDisplayProps {
    rubric: GeneratedRubric;
    onSave?: (format: SaveFormat) => void;
    onExport?: (format: ExportFormat) => void;
    onSaveToLibrary?: () => void;
    isSaving?: boolean;
    isExporting?: boolean;
    isSavingToLibrary?: boolean;
}

const RubricDisplay: React.FC<RubricDisplayProps> = ({ rubric, onSave, onExport, onSaveToLibrary, isSaving, isExporting = false, isSavingToLibrary = false }) => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const handleSaveClick = () => {
        setShowSaveModal(true);
    };

    const handleSave = (format: SaveFormat) => {
        if (onSave) {
            onSave(format);
        }
        setShowSaveModal(false);
    };

    const handleExportClick = () => {
        setShowExportModal(true);
    };

    const handleExport = (format: ExportFormat) => {
        if (onExport) {
            onExport(format);
        }
        setShowExportModal(false);
    };
    return (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-primary dark:text-secondary">{rubric.title}</h3>
                    {rubric.grade_level && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {rubric.grade_level} {rubric.subject && `• ${rubric.subject}`}
                        </p>
                    )}
                </div>
                <div className="flex space-x-2">
                    {onSaveToLibrary && (
                        <button
                            onClick={onSaveToLibrary}
                            disabled={isSavingToLibrary}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                            title="Save to Library"
                        >
                            <SaveIcon />
                            <span>{isSavingToLibrary ? 'Saving...' : 'Save to Library'}</span>
                        </button>
                    )}
                    {onSave && (
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                        >
                            {isSaving ? 'Saving...' : 'Save as File'}
                        </button>
                    )}
                    {onExport && (
                        <button
                            onClick={handleExportClick}
                            disabled={isExporting}
                            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                        >
                            <DownloadIcon />
                            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metadata */}
            {(rubric.alignment_validated || rubric.total_points || rubric.rubric_type) && (
                <div className="flex flex-wrap gap-3 text-sm">
                    {rubric.rubric_type && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {rubric.rubric_type.replace('_', ' ').toUpperCase()}
                        </span>
                    )}
                    {rubric.total_points && (
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                            Total: {rubric.total_points} points
                        </span>
                    )}
                    {rubric.alignment_validated && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center space-x-1">
                            <CheckCircleIcon />
                            <span>Aligned ({Math.round((rubric.alignment_score || 0) * 100)}%)</span>
                        </span>
                    )}
                    {rubric.weighting_enabled && (
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                            Weighted
                        </span>
                    )}
                    {rubric.multimodal_assessment && (
                        <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full">
                            Multimodal
                        </span>
                    )}
                </div>
            )}

            {/* Learning Objectives */}
            {rubric.learning_objectives && rubric.learning_objectives.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Learning Objectives:</h4>
                    <ul className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {rubric.learning_objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Rubric Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 font-semibold border border-gray-300 dark:border-gray-600">
                                Criterion
                            </th>
                            {rubric.weighting_enabled && (
                                <th className="px-4 py-3 font-semibold border border-gray-300 dark:border-gray-600 w-20">
                                    Weight
                                </th>
                            )}
                            {rubric.criteria[0]?.performanceLevels.map((level) => (
                                <th
                                    key={level.level}
                                    className="px-4 py-3 font-semibold border border-gray-300 dark:border-gray-600"
                                >
                                    {level.level}
                                    {level.points !== undefined && (
                                        <span className="ml-1 text-gray-500">({level.points})</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300">
                        {rubric.criteria.map((crit, index) => (
                            <tr key={index} className="border-b dark:border-gray-700">
                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 align-top border border-gray-300 dark:border-gray-600">
                                    {crit.criterion}
                                    {crit.description && (
                                        <div className="text-xs font-normal text-gray-600 dark:text-gray-400 mt-1">
                                            {crit.description}
                                        </div>
                                    )}
                                </td>
                                {rubric.weighting_enabled && (
                                    <td className="px-4 py-3 align-top border border-gray-300 dark:border-gray-600 text-center">
                                        {crit.weight}%
                                    </td>
                                )}
                                {crit.performanceLevels.map((level) => (
                                    <td
                                        key={level.level}
                                        className="px-4 py-3 align-top border border-gray-300 dark:border-gray-600"
                                    >
                                        {level.description}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Save Rubric Modal */}
            <SaveRubricModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSave}
                rubricTitle={rubric.title}
                isSaving={isSaving}
            />

            {/* Export Options Modal */}
            <ExportOptionsModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                rubricTitle={rubric.title}
                isExporting={isExporting}
            />
        </div>
    );
};

export default RubricDisplay;

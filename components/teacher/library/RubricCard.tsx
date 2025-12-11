import React from 'react';
import { SavedRubric } from '../../../types';
import {
    ScaleIcon,
    DownloadIcon,
    TrashIcon,
    ShareIcon,
    EyeIcon
} from '../../icons/Icons';

interface RubricCardProps {
    rubric: SavedRubric;
    viewMode: 'my' | 'public';
    onLoad?: (rubric: SavedRubric) => void;
    onExport: (id: number, format: 'pdf' | 'docx' | 'txt') => void;
    onShare?: (rubric: SavedRubric) => void;
    onDelete: (rubric: SavedRubric) => void;
}

const RubricCard: React.FC<RubricCardProps> = ({
    rubric,
    viewMode,
    onLoad,
    onExport,
    onShare,
    onDelete
}) => {
    const getRubricTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'analytic': 'Analytic',
            'holistic': 'Holistic',
            'single_point': 'Single-Point',
            'checklist': 'Checklist'
        };
        return labels[type] || type;
    };

    const getRubricTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'analytic': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
            'holistic': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            'single_point': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
            'checklist': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
        };
        return colors[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition bg-white dark:bg-gray-800">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                    {rubric.title}
                </h3>
                <div className="flex gap-1 ml-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${getRubricTypeColor(rubric.rubric_type)}`}>
                        {getRubricTypeLabel(rubric.rubric_type)}
                    </span>
                    {rubric.is_public && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                            Public
                        </span>
                    )}
                </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{rubric.grade_level}</span>
                    {rubric.subject && (
                        <>
                            <span>•</span>
                            <span>{rubric.subject}</span>
                        </>
                    )}
                </div>
                <div className="text-xs">{rubric.topic}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                    {rubric.total_points} pts • {rubric.criteria?.length || 0} criteria • By {rubric.created_by.username}
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{rubric.times_used}</span>
                </div>
                {rubric.alignment_validated && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <span>✓</span>
                        <span>Aligned ({(rubric.alignment_score * 100).toFixed(0)}%)</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {onLoad && (
                    <button
                        onClick={() => onLoad(rubric)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition"
                        title="Load Rubric"
                    >
                        <ScaleIcon className="w-3 h-3" />
                        Load
                    </button>
                )}
                
                <button
                    onClick={() => onExport(rubric.id, 'pdf')}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    title="Export PDF"
                >
                    <DownloadIcon className="w-3 h-3" />
                    PDF
                </button>
                
                <button
                    onClick={() => onExport(rubric.id, 'docx')}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    title="Export Word"
                >
                    <DownloadIcon className="w-3 h-3" />
                    Word
                </button>
                
                {viewMode === 'my' && (
                    <>
                        {onShare && (
                            <button
                                onClick={() => onShare(rubric)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                                title="Share with users"
                            >
                                <ShareIcon className="w-3 h-3" />
                                Share
                            </button>
                        )}
                        
                        <button
                            onClick={() => onDelete(rubric)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                            title="Delete"
                        >
                            <TrashIcon className="w-3 h-3" />
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RubricCard;

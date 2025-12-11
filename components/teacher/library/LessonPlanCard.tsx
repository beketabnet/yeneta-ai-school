import React from 'react';
import { SavedLessonPlan } from '../../../types';
import {
    EyeIcon,
    BookOpenIcon,
    DownloadIcon,
    TrashIcon,
    ShareIcon,
    StarIcon
} from '../../icons/Icons';

interface LessonPlanCardProps {
    plan: SavedLessonPlan;
    viewMode: 'my' | 'public';
    onLoad?: (plan: SavedLessonPlan) => void;
    onExport: (id: number) => void;
    onShare?: (plan: SavedLessonPlan) => void;
    onDelete: (plan: SavedLessonPlan) => void;
}

const LessonPlanCard: React.FC<LessonPlanCardProps> = ({
    plan,
    viewMode,
    onLoad,
    onExport,
    onShare,
    onDelete
}) => {
    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                        key={star} 
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                    ({rating.toFixed(1)})
                </span>
            </div>
        );
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition bg-white dark:bg-gray-800">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                    {plan.title}
                </h3>
                {plan.is_public && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                        Public
                    </span>
                )}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.grade}</span>
                    <span>•</span>
                    <span>{plan.subject}</span>
                </div>
                <div className="text-xs">{plan.topic}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                    {plan.duration} min • By {plan.created_by.username}
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{plan.times_used}</span>
                </div>
                {plan.rating_count > 0 && renderStars(plan.rating)}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {onLoad && (
                    <button
                        onClick={() => onLoad(plan)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition"
                        title="Load Plan"
                    >
                        <BookOpenIcon className="w-3 h-3" />
                        Load
                    </button>
                )}
                
                <button
                    onClick={() => onExport(plan.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    title="Export PDF"
                >
                    <DownloadIcon className="w-3 h-3" />
                    PDF
                </button>
                
                {viewMode === 'my' && (
                    <>
                        {onShare && (
                            <button
                                onClick={() => onShare(plan)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                                title="Share with users"
                            >
                                <ShareIcon className="w-3 h-3" />
                                Share
                            </button>
                        )}
                        
                        <button
                            onClick={() => onDelete(plan)}
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

export default LessonPlanCard;

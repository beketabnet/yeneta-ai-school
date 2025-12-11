import React from 'react';
import { Badge } from './types';
import { TrophyIcon } from '../../icons/Icons';

interface BadgesDisplayProps {
    badges: Badge[];
    compact?: boolean;
}

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ badges, compact = false }) => {
    const earnedBadges = badges.filter(b => b.earnedAt);
    const inProgressBadges = badges.filter(b => !b.earnedAt && b.progress && b.progress > 0);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {earnedBadges.length} Badges
                </span>
                <div className="flex gap-1">
                    {earnedBadges.slice(0, 5).map((badge) => (
                        <span key={badge.id} className="text-xl" title={badge.name}>
                            {badge.icon}
                        </span>
                    ))}
                    {earnedBadges.length > 5 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                            +{earnedBadges.length - 5}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <TrophyIcon className="w-4 h-4 text-yellow-500" />
                        Earned Badges ({earnedBadges.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {earnedBadges.map((badge) => (
                            <div
                                key={badge.id}
                                className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-center hover:scale-105 transition-transform cursor-pointer"
                                title={badge.description}
                            >
                                <div className="text-3xl mb-1">{badge.icon}</div>
                                <div className="text-xs font-bold text-yellow-900 dark:text-yellow-200">
                                    {badge.name}
                                </div>
                                <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                    {badge.category}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* In Progress Badges */}
            {inProgressBadges.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        In Progress ({inProgressBadges.length})
                    </h4>
                    <div className="space-y-2">
                        {inProgressBadges.map((badge) => (
                            <div
                                key={badge.id}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl opacity-50">{badge.icon}</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {badge.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {badge.requirement}
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {badge.progress}%
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-full rounded-full transition-all"
                                        style={{ width: `${badge.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {badges.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <TrophyIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No badges yet. Start practicing to earn your first badge!</p>
                </div>
            )}
        </div>
    );
};

export default BadgesDisplay;

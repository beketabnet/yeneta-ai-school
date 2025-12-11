import React from 'react';
import { Mission } from './types';

interface MissionsPanelProps {
    activeMissions: Mission[];
    completedMissions: Mission[];
}

const MissionsPanel: React.FC<MissionsPanelProps> = ({ activeMissions, completedMissions }) => {
    const getMissionIcon = (type: Mission['type']): string => {
        switch (type) {
            case 'daily': return '📅';
            case 'weekly': return '📆';
            case 'challenge': return '⚔️';
            case 'special': return '⭐';
            default: return '🎯';
        }
    };

    const getMissionColor = (type: Mission['type']): string => {
        switch (type) {
            case 'daily': return 'blue';
            case 'weekly': return 'purple';
            case 'challenge': return 'red';
            case 'special': return 'yellow';
            default: return 'gray';
        }
    };

    const formatTimeRemaining = (expiresAt?: Date): string => {
        if (!expiresAt) return '';
        const now = new Date();
        const diff = new Date(expiresAt).getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d remaining`;
        }
        return `${hours}h ${minutes}m remaining`;
    };

    return (
        <div className="space-y-4">
            {/* Active Missions */}
            {activeMissions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        Active Missions ({activeMissions.length})
                    </h4>
                    <div className="space-y-3">
                        {activeMissions.map((mission) => {
                            const progress = (mission.current / mission.target) * 100;
                            const color = getMissionColor(mission.type);
                            
                            return (
                                <div
                                    key={mission.id}
                                    className={`bg-${color}-50 dark:bg-${color}-900/20 border-2 border-${color}-200 dark:border-${color}-800 rounded-lg p-4`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getMissionIcon(mission.type)}</span>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {mission.title}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {mission.description}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                {mission.current}/{mission.target}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {Math.round(progress)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                        <div
                                            className={`bg-${color}-500 h-full rounded-full transition-all`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Reward and Time */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <span>💰 Reward:</span>
                                            <span className="font-medium">{mission.reward.xp} XP</span>
                                            {mission.reward.badge && (
                                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                                                    🏆 {mission.reward.badge}
                                                </span>
                                            )}
                                        </div>
                                        {mission.expiresAt && (
                                            <div className="text-gray-500 dark:text-gray-400">
                                                ⏰ {formatTimeRemaining(mission.expiresAt)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recently Completed */}
            {completedMissions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        Recently Completed ({completedMissions.slice(0, 3).length})
                    </h4>
                    <div className="space-y-2">
                        {completedMissions.slice(0, 3).map((mission) => (
                            <div
                                key={mission.id}
                                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getMissionIcon(mission.type)}</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {mission.title}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Completed • +{mission.reward.xp} XP
                                        </div>
                                    </div>
                                    <span className="text-green-500 text-xl">✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeMissions.length === 0 && completedMissions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-4xl mb-2 block">🎯</span>
                    <p className="text-sm">No active missions. Check back daily for new challenges!</p>
                </div>
            )}
        </div>
    );
};

export default MissionsPanel;

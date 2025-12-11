import React from 'react';
import { StudentPerformance } from './types';
import { FireIcon, TrophyIcon, ChartBarIcon, StarIcon } from '../../icons/Icons';

interface PerformanceTrackerProps {
    performance: StudentPerformance;
}

const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ performance }) => {
    const accuracy = performance.totalCount > 0
        ? Math.round((performance.correctCount / performance.totalCount) * 100)
        : 0;

    const xpToNextLevel = (performance.level + 1) * 100;
    const xpProgress = (performance.totalXP % 100) / xpToNextLevel * 100;

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span> Your Performance
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Level & XP */}
                <div className="group bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg group-hover:scale-110 transition-transform">
                            <TrophyIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                            {performance.level}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Level</p>
                    <div className="relative h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                        {performance.totalXP % 100}/{xpToNextLevel} XP
                    </p>
                </div>

                {/* Streak */}
                <div className="group bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg group-hover:scale-110 transition-transform">
                            <FireIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {performance.streak}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Streak</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg inline-block">
                        {performance.streak > 0 ? '🔥 On fire!' : 'Start a streak!'}
                    </p>
                </div>

                {/* Accuracy */}
                <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:scale-110 transition-transform">
                            <ChartBarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {accuracy}%
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Accuracy</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {performance.correctCount}/{performance.totalCount} Correct
                    </p>
                </div>

                {/* Total XP */}
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:scale-110 transition-transform">
                            <span className="text-blue-600 dark:text-blue-400 text-lg">⭐</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {performance.totalXP}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Total XP</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Keep learning!
                    </p>
                </div>
            </div>

            {/* Skills Progress */}
            {Object.keys(performance.skillsProgress).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Skills Mastery
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(performance.skillsProgress).slice(0, 4).map(([skill, progress]) => (
                            <div key={skill} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{skill}</span>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceTracker;

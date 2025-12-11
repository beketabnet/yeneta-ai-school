import React from 'react';
import { PracticeMode } from './types';

interface PracticeModeSelectorProps {
    selectedMode: PracticeMode;
    onModeChange: (mode: PracticeMode) => void;
}

const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({
    selectedMode,
    onModeChange
}) => {
    const modes = [
        {
            id: 'standard' as PracticeMode,
            name: '🏋️ Standard Practice',
            subtitle: 'Gym Floor',
            description: 'Unlimited attempts with hints and explanations. Perfect for mastery learning.',
            features: ['Hints on demand', 'Immediate explanations', 'No time pressure', 'Self-paced learning'],
            color: 'violet',
            gradient: 'from-violet-500 to-purple-500',
            bgStyles: {
                selected: 'border-violet-500 bg-violet-500 text-white',
                text: 'text-violet-600 dark:text-violet-400',
                badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
                check: 'text-violet-500'
            }
        },
        {
            id: 'exam' as PracticeMode,
            name: '📝 Exam Mode',
            subtitle: 'Assessment Booth',
            description: 'Timed sessions simulating real exams. No hints during test, detailed review after.',
            features: ['Timed sessions', 'No hints during test', 'Detailed review report', 'Exam simulation'],
            color: 'indigo',
            gradient: 'from-indigo-500 to-blue-600',
            bgStyles: {
                selected: 'border-indigo-500 bg-indigo-500 text-white',
                text: 'text-indigo-600 dark:text-indigo-400',
                badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                check: 'text-indigo-500'
            }
        },
        {
            id: 'game' as PracticeMode,
            name: '🎮 Game Mode',
            subtitle: 'Level-Up Chamber',
            description: 'Gamified learning with missions, badges, and challenges. Make learning fun!',
            features: ['Missions & badges', 'Streaks & combos', 'Leaderboards', 'Special challenges'],
            color: 'fuchsia',
            gradient: 'from-fuchsia-500 to-pink-500',
            bgStyles: {
                selected: 'border-fuchsia-500 bg-fuchsia-500 text-white',
                text: 'text-fuchsia-600 dark:text-fuchsia-400',
                badge: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300',
                check: 'text-fuchsia-500'
            }
        }
    ];

    const getModeClasses = (modeId: string, isSelected: boolean, color: string) => {
        const baseClasses = 'relative p-1 rounded-2xl transition-all duration-300 cursor-pointer group';

        if (isSelected) {
            return `${baseClasses} scale-[1.02] shadow-xl`;
        }
        return `${baseClasses} hover:scale-[1.01] hover:shadow-lg opacity-90 hover:opacity-100`;
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 ml-1">
                    Choose Your Practice Mode
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    Each mode offers a unique learning experience tailored to your goals
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modes.map((mode) => (
                    <div
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={getModeClasses(mode.id, selectedMode === mode.id, mode.color)}
                    >
                        {/* Gradient Border Background */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mode.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}></div>

                        {/* Active Border */}
                        {selectedMode === mode.id && (
                            <div className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-br ${mode.gradient} opacity-100 -z-10 blur-sm`}></div>
                        )}

                        <div className="relative h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-gray-700/50 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                {/* Header */}
                                <div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {mode.name}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider inline-block px-2 py-1 rounded-md ${mode.bgStyles.badge}`}>
                                        {mode.subtitle}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {mode.description}
                                </p>

                                {/* Features */}
                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                    {mode.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span className={`${mode.bgStyles.check} mt-0.5 font-bold`}>✓</span>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected indicator */}
                            <div className={`mt-4 flex items-center gap-2 text-sm font-bold pt-3 ${selectedMode === mode.id
                                ? mode.bgStyles.text
                                : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMode === mode.id
                                    ? mode.bgStyles.selected
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {selectedMode === mode.id && (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span>{selectedMode === mode.id ? 'Active Mode' : 'Select Mode'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PracticeModeSelector;

import React, { useEffect, useState } from 'react';
import {
    TrophyIcon,
    FireIcon,
    SparklesIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ClockIcon,
    BeakerIcon,
    StarIcon
} from '../../icons/Icons';
import { PracticeConfig } from './types';

interface PracticeArenaProps {
    config: PracticeConfig;
    className?: string; // Allow custom classes for layout flexibility
    variant?: 'primary' | 'secondary'; // Optional variant for visual distinction
}

const PracticeArena: React.FC<PracticeArenaProps> = ({ config, className = '', variant = 'primary' }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    // Helper to get configuration status text
    const getStatusText = () => {
        if (config.practiceMode === 'exam') return "Exam Simulation Ready";
        if (config.practiceMode === 'game') return "Gamified Challenge Ready";
        return "Practice Session Ready";
    };

    return (
        <div className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-violet-600 shadow-2xl flex flex-col items-center justify-center p-8 transition-all duration-500 ${className}`}>

            {/* Background Dynamic Gradients - adjusted opacity for new background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:30px_30px]"></div>
            </div>

            {/* Main Content Container */}
            <div className={`relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6 transform transition-all duration-1000 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                {/* Hero Icon Composition */}
                <div className="relative group cursor-default">
                    {/* Glowing Rings */}
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-spin-slow"></div>

                    <div className="relative w-32 h-32 md:w-36 md:h-36 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/20 shadow-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                        {variant === 'secondary' ? (
                            <StarIcon className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        ) : (
                            <TrophyIcon className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        )}

                        {/* Floating orbiting elements - colored for contrast */}
                        <div className="absolute -top-2 -right-2 p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg animate-bounce-slow">
                            <FireIcon className="w-6 h-6 text-orange-300" />
                        </div>
                        <div className="absolute -bottom-2 -left-2 p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg animate-bounce-slow" style={{ animationDelay: '1.5s' }}>
                            <SparklesIcon className="w-6 h-6 text-yellow-300" />
                        </div>
                    </div>
                </div>

                {/* Motivational Typography */}
                <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                        {variant === 'secondary' ? (
                            <>
                                Unlock Your <br />
                                <span className="text-violet-100">Potential</span>
                            </>
                        ) : (
                            <>
                                Forge Your <br />
                                <span className="text-emerald-100">Greatness</span>
                            </>
                        )}
                    </h1>

                    <div className="h-1 w-20 bg-white/30 rounded-full mx-auto"></div>

                    <p className="text-base md:text-lg text-white/90 font-medium leading-relaxed max-w-lg mx-auto">
                        {variant === 'secondary'
                            ? "A universe of knowledge awaits. Every practice session brings you one step closer to mastery."
                            : "The arena where champions are made. Sweat in practice, so you don't bleed in battle."}
                    </p>
                </div>

                {/* Dynamic Status Cards */}
                <div className="grid grid-cols-1 gap-3 w-full mt-4 max-w-sm">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/20 transition-colors duration-300">
                        <div className={`p-2 rounded-xl bg-white/20 text-white shrink-0`}>
                            <ChartBarIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Intensity</p>
                            <p className="text-white font-semibold text-sm capitalize truncate">{config.difficulty || 'Medium'} Level</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/20 transition-colors duration-300">
                        <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                            <AcademicCapIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Focus Area</p>
                            <p className="text-white font-semibold text-sm truncate">{config.subject || 'Select Subject'}</p>
                        </div>
                    </div>
                </div>

                {/* Call to Action Indicator */}
                <div className="pt-4 animate-pulse">
                    <div className="flex items-center gap-2 text-white/80 text-xs font-medium bg-white/10 px-4 py-2 rounded-full border border-white/20">
                        <BeakerIcon className="w-3 h-3" />
                        <span>{getStatusText()} &bull; Waiting for Generation...</span>
                    </div>
                </div>

            </div>

            {/* Decorative Geometric Elements */}
            <div className="absolute top-10 right-10 w-24 h-24 border border-white/10 rounded-full animate-spin-slow-reverse"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 border border-white/10 rounded-full animate-spin-slow"></div>

            {/* CSS for custom animations if not in tailwind config */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-slow-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .animate-spin-slow-reverse {
                    animation: spin-slow-reverse 15s linear infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite;
                }
            `}</style>
        </div>
    );
};

export default PracticeArena;

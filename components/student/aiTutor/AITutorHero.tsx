import React from 'react';
import { SparklesIcon } from '../../icons/Icons';

interface AITutorHeroProps {
    userFirstName?: string;
    onStartChat?: () => void;
}

const AITutorHero: React.FC<AITutorHeroProps> = ({ userFirstName, onStartChat }) => {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-8 md:p-12 text-white shadow-2xl mb-8 transform transition-all hover:scale-[1.01] duration-500">
            <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-medium text-white mb-6 animate-fadeIn">
                    <SparklesIcon className="w-4 h-4 text-yellow-300" />
                    <span>Powered by Advanced AI</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">{userFirstName || 'Student'}</span>!
                </h1>

                <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl leading-relaxed">
                    I'm your 24/7 personal AI tutor. Whether you need help with <span className="font-semibold text-white">Math, Science, History</span>, or just want to practice, I'm here to help you succeed.
                </p>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={onStartChat}
                        className="group relative px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:bg-indigo-50 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Start Learning
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>

                    <div className="flex items-center gap-4 px-6 py-4 bg-indigo-800/30 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-indigo-500 bg-indigo-300/20 flex items-center justify-center text-xs backdrop-blur-sm`}>
                                    Run
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-indigo-100">Used by top students</span>
                    </div>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-3xl mix-blend-overlay animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-500 opacity-20 rounded-full blur-3xl mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent to-black/10 pointer-events-none"></div>
        </div>
    );
};

export default AITutorHero;

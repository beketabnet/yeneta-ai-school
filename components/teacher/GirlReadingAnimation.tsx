import React from 'react';

const GirlReadingAnimation: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {/* Top Section: Graphic & Animation - Flex grow to take available space */}
            <div className="relative w-full flex-[2] flex items-center justify-center overflow-hidden bg-blue-50/50 dark:bg-gray-800/50">
                <img
                    src="/girl_reading_book.jpg"
                    alt="Girl Reading Book"
                    className="object-cover w-full h-full opacity-90 hover:scale-105 transition-transform duration-700"
                />

                {/* Dynamic Page Flip Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <style>{`
                        @keyframes pageFlip {
                            0% { transform: rotateY(0deg); opacity: 0.8; }
                            50% { opacity: 1; }
                            100% { transform: rotateY(-180deg); opacity: 0; }
                        }
                        .book-flip-container {
                            perspective: 1000px;
                        }
                        .flipping-page {
                            transform-origin: left;
                            animation: pageFlip 4s infinite ease-in-out;
                            background: linear-gradient(to right, #ffffff 0%, #f3f4f6 100%);
                            box-shadow: 2px 2px 10px rgba(0,0,0,0.1);
                        }
                    `}</style>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay"></div>
                </div>
            </div>

            {/* Bottom Section: Creative Content Area - Distributes content uniformly */}
            <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Create Your Masterpiece
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto mt-1">
                        Unlock the power of AI to craft engaging, curriculum-aligned lesson plans in seconds.
                    </p>
                </div>

                {/* Quick Tips Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">🎯</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Be Specific</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Use precise topics for better results.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">📚</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Use RAG</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Enable "Ethiopian Curriculum" to align with textbooks.
                        </p>
                    </div>
                </div>

                {/* Inspiration Section */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
                    <div className="shrink-0 text-white/90">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] italic text-indigo-50 leading-tight">"Education is the most powerful weapon which you can use to change the world."</p>
                        <p className="text-[9px] text-indigo-200 mt-0.5 font-bold uppercase tracking-wider">— Nelson Mandela</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GirlReadingAnimation;

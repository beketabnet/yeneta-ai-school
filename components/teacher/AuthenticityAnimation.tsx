import React from 'react';

const AuthenticityAnimation: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {/* Top Section: Graphic & Animation - Flex grow to take available space */}
            <div className="relative w-full flex-[2] flex items-center justify-center overflow-hidden bg-violet-50/50 dark:bg-gray-800/50">
                <img
                    src="/ai_document_analysis.png"
                    alt="AI Document Analysis"
                    className="object-cover w-full h-full opacity-90 hover:scale-105 transition-transform duration-700"
                />

                {/* Dynamic Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay"></div>
                </div>
            </div>

            {/* Bottom Section: Creative Content Area - Distributes content uniformly */}
            <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
                        Verify Academic Integrity
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto mt-1">
                        Ensure every student's submission is authentic with advanced AI detection.
                    </p>
                </div>

                {/* Quick Tips Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">📄</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Direct Upload</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Scan Word, PDF, or text files instantly.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">🤖</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">AI Detection</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Identify AI-generated content with high accuracy.
                        </p>
                    </div>
                </div>

                {/* Inspiration Section */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md">
                    <div className="shrink-0 text-white/90">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] italic text-violet-50 leading-tight">"Integrity is doing the right thing, even when no one is watching."</p>
                        <p className="text-[9px] text-violet-200 mt-0.5 font-bold uppercase tracking-wider">— C.S. Lewis</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthenticityAnimation;

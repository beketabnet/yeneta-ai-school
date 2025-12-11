import React from 'react';

const QuizAnimation: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {/* Top Section: Graphic & Animation - Flex grow to take available space */}
            <div className="relative w-full flex-[2] flex items-center justify-center overflow-hidden bg-purple-50/50 dark:bg-gray-800/50">
                <img
                    src="/student_taking_quiz.png"
                    alt="Student Taking Quiz"
                    className="object-cover w-full h-full opacity-90 hover:scale-105 transition-transform duration-700"
                />

                {/* Dynamic Page Flip Overlay Effects - Kept for consistent style even if not a book */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay"></div>
                </div>
            </div>

            {/* Bottom Section: Creative Content Area - Distributes content uniformly */}
            <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                        Craft Perfect Assessments
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto mt-1">
                        Create comprehensive quizzes and exams in minutes with AI assistance.
                    </p>
                </div>

                {/* Quick Tips Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">⚡</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Mix & Match</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Combine multiple choice, true/false, and short answer.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">🧠</span>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Set Difficulty</h4>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                            Tailor questions to your students' proficiency level.
                        </p>
                    </div>
                </div>

                {/* Inspiration Section */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md">
                    <div className="shrink-0 text-white/90">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] italic text-purple-50 leading-tight">"The art of teaching is the art of assisting discovery."</p>
                        <p className="text-[9px] text-purple-200 mt-0.5 font-bold uppercase tracking-wider">— Mark Van Doren</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizAnimation;

import React from 'react';

export type LibraryView = 'lesson-plans' | 'rubrics' | 'lessons' | 'quizzes';
export type LibraryMode = 'my' | 'public';

interface LibraryTabsProps {
    currentView: LibraryView;
    onViewChange: (view: LibraryView) => void;
    currentMode: LibraryMode;
    onModeChange: (mode: LibraryMode) => void;
    lessonPlanCount: number;
    rubricCount: number;
    lessonCount: number;
    quizCount: number;
}

const LibraryTabs: React.FC<LibraryTabsProps> = ({
    currentView,
    onViewChange,
    currentMode,
    onModeChange,
    lessonPlanCount,
    rubricCount,
    lessonCount,
    quizCount
}) => {
    return (
        <div className="space-y-4">
            {/* Content Type Tabs */}
            {/* Content Type Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button
                    onClick={() => onViewChange('lesson-plans')}
                    className={`px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap outline-none focus:outline-none ${currentView === 'lesson-plans'
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    📚 Lesson Plans
                </button>
                <button
                    onClick={() => onViewChange('rubrics')}
                    className={`px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap outline-none focus:outline-none ${currentView === 'rubrics'
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    📋 Rubrics
                </button>
                <button
                    onClick={() => onViewChange('lessons')}
                    className={`px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap outline-none focus:outline-none ${currentView === 'lessons'
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    ✨ Lessons
                </button>
                <button
                    onClick={() => onViewChange('quizzes')}
                    className={`px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap outline-none focus:outline-none ${currentView === 'quizzes'
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    📝 Quizzes
                </button>
            </div>

            {/* My/Public Mode Tabs */}
            {/* My/Public Mode Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                <button
                    onClick={() => onModeChange('my')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentMode === 'my'
                        ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    My {currentView === 'lesson-plans' ? 'Plans' : currentView === 'rubrics' ? 'Rubrics' : currentView === 'lessons' ? 'Lessons' : 'Quizzes'}
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${currentMode === 'my' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {currentMode === 'my' ? (currentView === 'lesson-plans' ? lessonPlanCount : currentView === 'rubrics' ? rubricCount : currentView === 'lessons' ? lessonCount : quizCount) : '...'}
                    </span>
                </button>
                <button
                    onClick={() => onModeChange('public')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentMode === 'public'
                        ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                >
                    Public Library
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${currentMode === 'public' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {currentMode === 'public' ? (currentView === 'lesson-plans' ? lessonPlanCount : currentView === 'rubrics' ? rubricCount : currentView === 'lessons' ? lessonCount : quizCount) : '...'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default LibraryTabs;

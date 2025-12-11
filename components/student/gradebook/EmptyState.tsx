import React from 'react';

const EmptyState: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Grades Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your grades will appear here once your teachers start grading your assignments and exams.
            </p>
            <div className="flex justify-center gap-4">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    View Assignments
                </button>
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors">
                    Practice Labs
                </button>
            </div>
        </div>
    );
};

export default EmptyState;

import React from 'react';

interface GradeFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortBy: 'name' | 'grade' | 'teacher';
    onSortChange: (value: 'name' | 'grade' | 'teacher') => void;
    filterType: 'all' | 'passing' | 'struggling';
    onFilterChange: (value: 'all' | 'passing' | 'struggling') => void;
}

const GradeFilters: React.FC<GradeFiltersProps> = ({
    searchTerm,
    onSearchChange,
    sortBy,
    onSortChange,
    filterType,
    onFilterChange
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🔍 Search Courses
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by course or teacher..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📊 Sort By
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as 'name' | 'grade' | 'teacher')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    >
                        <option value="name">Course Name</option>
                        <option value="grade">Grade (High to Low)</option>
                        <option value="teacher">Teacher Name</option>
                    </select>
                </div>

                {/* Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🎯 Filter
                    </label>
                    <select
                        value={filterType}
                        onChange={(e) => onFilterChange(e.target.value as 'all' | 'passing' | 'struggling')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    >
                        <option value="all">All Courses</option>
                        <option value="passing">Passing (≥70%)</option>
                        <option value="struggling">Needs Attention (&lt;70%)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default GradeFilters;

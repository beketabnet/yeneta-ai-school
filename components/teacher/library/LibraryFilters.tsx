import React from 'react';
import { SearchIcon } from '../../icons/Icons';

interface LibraryFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    gradeFilter: string;
    onGradeChange: (value: string) => void;
    subjectFilter: string;
    onSubjectChange: (value: string) => void;
    sortBy: 'recent' | 'rating' | 'usage';
    onSortChange: (value: 'recent' | 'rating' | 'usage') => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
    searchQuery,
    onSearchChange,
    gradeFilter,
    onGradeChange,
    subjectFilter,
    onSubjectChange,
    sortBy,
    onSortChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>
            
            <select
                value={gradeFilter}
                onChange={(e) => onGradeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Filter by grade level"
            >
                <option value="">All Grades</option>
                <option value="KG">Kindergarten</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                ))}
            </select>
            
            <input
                type="text"
                placeholder="Subject..."
                value={subjectFilter}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            
            <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Sort by"
            >
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
                <option value="usage">Most Used</option>
            </select>
        </div>
    );
};

export default LibraryFilters;

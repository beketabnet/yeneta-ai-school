import React, { useState } from 'react';
import { useGradeChartData } from '../../../hooks/useGradeChartData';
import GradeChartFilters from './GradeChartFilters';

interface GradeChartProps {
    courses?: any[];
}

const GradeChart: React.FC<GradeChartProps> = ({ courses = [] }) => {
    const { subjects, allSubjects, isLoading, filters, setFilters } = useGradeChartData();

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📈 Grade Overview
                </h3>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (subjects.length === 0) {
        return null;
    }

    const maxGrade = 100;
    const chartHeight = 200;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📈 Grade Overview
            </h3>

            {/* Filters - with relative positioning and z-index to ensure it's clickable */}
            <div className="relative z-20 mb-6">
                <GradeChartFilters
                    subjects={allSubjects.length > 0 ? allSubjects : subjects}
                    filters={filters}
                    onFilterChange={setFilters}
                />
            </div>

            {/* Chart - positioned below filters with good spacing */}
            <div className="relative z-0 mt-8 mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-end justify-between gap-4" style={{ height: `${chartHeight + 100}px`, minHeight: '350px' }}>
                {subjects.map((subjectData) => {
                    const barHeight = Math.max((subjectData.average_grade / maxGrade) * chartHeight, 4);
                    const getBarColor = (grade: number) => {
                        if (grade === 0) return 'bg-gray-300 dark:bg-gray-600';
                        if (grade >= 90) return 'bg-green-500 dark:bg-green-600';
                        if (grade >= 80) return 'bg-blue-500 dark:bg-blue-600';
                        if (grade >= 70) return 'bg-yellow-500 dark:bg-yellow-600';
                        if (grade >= 60) return 'bg-orange-500 dark:bg-orange-600';
                        return 'bg-red-500 dark:bg-red-600';
                    };

                    return (
                        <div key={subjectData.id} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full flex flex-col justify-end" style={{ height: `${chartHeight}px` }}>
                                <div
                                    className={`w-full rounded-t-lg ${getBarColor(subjectData.average_grade)} transition-all hover:opacity-80 cursor-pointer relative group`}
                                    style={{ height: `${barHeight}px` }}
                                    title={`${subjectData.subject} - Grade ${subjectData.grade_level}${subjectData.stream ? ` (${subjectData.stream})` : ''}`}
                                >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                        {subjectData.average_grade.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center w-full">
                                <p className="font-medium">{subjectData.subject}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Grade {subjectData.grade_level}</p>
                                {subjectData.stream && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">({subjectData.stream})</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">A (90-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">B (80-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">C (70-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">D (60-69%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">F (&lt;60%)</span>
                </div>
            </div>
        </div>
    );
};

export default GradeChart;

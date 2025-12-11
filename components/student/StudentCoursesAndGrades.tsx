import React, { useState, useMemo } from 'react';
import VerticalSlider from '../common/VerticalSlider';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useStudentCoursesAndGrades } from '../../hooks/useStudentCoursesAndGrades';
import { ChartBarIcon, AcademicCapIcon, AdjustmentsHorizontalIcon, ArrowPathIcon } from '../icons/Icons';

const StudentCoursesAndGrades: React.FC = () => {
    const { addNotification } = useNotification();
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [selectedFamily, setSelectedFamily] = useState<number | null>(null);

    const {
        courses,
        isLoading,
        error,
        refetch,
        getCoursesForFamily,
        getAllFamilies
    } = useStudentCoursesAndGrades();

    // Auto-refresh hook
    useAutoRefresh({
        interval: 15000, // 15 seconds
        enabled: autoRefreshEnabled,
        onRefresh: refetch
    });

    // Get all families from courses
    const families = useMemo(() => getAllFamilies(), [getAllFamilies]);

    // Filter courses based on selected family
    const filteredCourses = useMemo(() => {
        if (selectedFamily) {
            return getCoursesForFamily(selectedFamily);
        }
        return courses;
    }, [selectedFamily, courses, getCoursesForFamily]);

    const getScoreColor = (score: number | null): string => {
        if (score === null) return 'text-gray-400 dark:text-gray-500';
        if (score >= 90) return 'text-green-600 dark:text-green-400';
        if (score >= 80) return 'text-blue-600 dark:text-blue-400';
        if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 60) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBadge = (score: number | null): string => {
        if (score === null) return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
        if (score >= 90) return 'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-sm';
        if (score >= 80) return 'bg-gradient-to-r from-blue-400 to-indigo-600 text-white shadow-sm';
        if (score >= 70) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm';
        if (score >= 60) return 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-sm';
        return 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-sm';
    };

    if (error) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <button
                    onClick={refetch}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 hover:shadow-lg transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shadow-inner">
                            <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Courses & Grades</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor your academic standing</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl">
                            <button
                                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center gap-2 ${autoRefreshEnabled
                                        ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                            >
                                <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {autoRefreshEnabled ? 'Live' : 'Paused'}
                            </button>
                        </div>
                        <button
                            onClick={refetch}
                            disabled={isLoading}
                            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                            title="Refresh Data"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Family Filter */}
                {families.length > 0 && (
                    <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                <span className="font-semibold text-sm">Filter by Family</span>
                            </div>
                            {selectedFamily && (
                                <button
                                    onClick={() => setSelectedFamily(null)}
                                    className="text-xs px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm hover:text-blue-600 transition-colors border border-gray-200 dark:border-gray-600"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>

                        {families.length <= 5 ? (
                            <div className="relative">
                                <select
                                    value={selectedFamily || ''}
                                    onChange={(e) => setSelectedFamily(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer appearance-none"
                                >
                                    <option value="">All Families</option>
                                    {families.map(family => (
                                        <option key={family.id} value={family.id}>
                                            {family.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        ) : (
                            <VerticalSlider
                                items={families.map(f => ({ id: f.id, label: f.name }))}
                                selectedId={selectedFamily}
                                onSelect={(item) => setSelectedFamily(item.id || null)}
                                maxVisibleItems={5}
                                className="w-full"
                            />
                        )}
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Updating course data...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 px-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AcademicCapIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            There are no courses matching your criteria. Try adjusting your filters or request enrollment in new courses.
                        </p>
                    </div>
                ) : (
                    <ScrollableListContainer maxHeight="max-h-[600px]">
                        <div className="grid gap-4 pr-2 pb-2">
                            {filteredCourses.map(course => (
                                <div
                                    key={course.id}
                                    className="group p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                                    <AcademicCapIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                        <span>Student:</span>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{course.student_name}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm pl-0 sm:pl-[3.25rem]">
                                                {course.assignment_average !== null ? (
                                                    <div className="flex items-baseline gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wide">Assignments</span>
                                                        <span className={`font-bold ${getScoreColor(course.assignment_average)}`}>
                                                            {course.assignment_average.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs px-2">No Assignments</span>
                                                )}

                                                {course.exam_average !== null ? (
                                                    <div className="flex items-baseline gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wide">Exams</span>
                                                        <span className={`font-bold ${getScoreColor(course.exam_average)}`}>
                                                            {course.exam_average.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs px-2">No Exams</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-700">
                                            <div className="text-right w-full sm:w-auto">
                                                <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getScoreBadge(course.overall_grade)}`}>
                                                    {course.overall_grade !== null ? `${course.overall_grade.toFixed(1)}%` : 'N/A'}
                                                </div>
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 mt-1.5 text-center sm:text-right">
                                                    Overall Grade
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollableListContainer>
                )}
            </div>
        </div>
    );
};

export default StudentCoursesAndGrades;
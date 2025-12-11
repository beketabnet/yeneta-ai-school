import React, { useState, useEffect } from 'react';
import { useApprovedCourses, CourseGrade } from '../../../hooks/useApprovedCourses';
import { useStudentGradesEnhanced } from '../../../hooks/useStudentGradesEnhanced';
import { useGradeChartData } from '../../../hooks/useGradeChartData';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import { useGradeUpdateListener } from '../../../hooks/useRealtimeGradeSync';
import eventService, { EVENTS } from '../../../services/eventService';
import { apiService } from '../../../services/apiService';
import GradeCard from './GradeCard';
import SubjectGradeCard from './SubjectGradeCard';
import GradeStatistics from './GradeStatistics';
import GradeFilters from './GradeFilters';
import GradeChart from './GradeChart';
import StudentGradeBreakdown from './StudentGradeBreakdown';
import StudentGradesByType from './StudentGradesByType';
import StudentGradesSummaryEnhanced from './StudentGradesSummaryEnhanced';
import StudentGradeListEnhanced from './StudentGradeListEnhanced';
import Card from '../../Card';
import { UploadIcon, StudentIcon } from '../../icons/Icons';

interface ApprovedCoursesGradebookProps {
    onSubmitAssignmentClick: () => void;
}

const ApprovedCoursesGradebook: React.FC<ApprovedCoursesGradebookProps> = ({ onSubmitAssignmentClick }) => {
    const { addNotification } = useNotification();
    const { courses, isLoading, error, refetch } = useApprovedCourses();
    const { gradesBySubject, isLoading: gradesLoading, refetch: refetchGrades } = useStudentGradesEnhanced();
    const { subjects: chartSubjects, refetch: refetchChartData } = useGradeChartData();
    const [filteredCourses, setFilteredCourses] = useState<CourseGrade[]>([]);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [showStudentGrades, setShowStudentGrades] = useState(false);

    // Filter and sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'grade' | 'teacher'>('name');
    const [filterType, setFilterType] = useState<'all' | 'passing' | 'struggling'>('all');
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [familyStudents, setFamilyStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<string[]>([]);

    // Auto-refresh hook
    useAutoRefresh({
        interval: 15000, // 15 seconds
        enabled: autoRefreshEnabled,
        onRefresh: async () => {
            refetch();
            await refetchGrades();
            await refetchChartData();
        }
    });

    // Listen for grade updates via real-time sync
    useGradeUpdateListener('student-gradebook', async (payload: any) => {
        if (payload.student_id === undefined || payload.student_id === null) {
            await refetchGrades();
        }
    });

    // Listen for grade updates via event service
    useEffect(() => {
        const handleGradeEvent = () => {
            refetch();
            refetchGrades();
            refetchChartData();
        };

        const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
        const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
        const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, [refetch, refetchGrades, refetchChartData]);

    // Apply filters and sorting
    useEffect(() => {
        let result = [...courses];

        // Search filter
        if (searchTerm) {
            result = result.filter(course =>
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Grade filter
        if (filterType === 'passing') {
            result = result.filter(course => course.overall_grade >= 70);
        } else if (filterType === 'struggling') {
            result = result.filter(course => course.overall_grade < 70);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'grade') {
                return b.overall_grade - a.overall_grade;
            } else {
                const aTeacher = `${a.teacher.first_name} ${a.teacher.last_name}`;
                const bTeacher = `${b.teacher.first_name} ${b.teacher.last_name}`;
                return aTeacher.localeCompare(bTeacher);
            }
        });

        setFilteredCourses(result);
    }, [courses, searchTerm, sortBy, filterType]);

    // Show error notification
    useEffect(() => {
        if (error) {
            addNotification(error, 'error');
        }
    }, [error, addNotification]);

    // Load family students and subjects from approved courses
    useEffect(() => {
        const loadFamilyStudentsAndSubjects = async () => {
            try {
                const response: any = await apiService.getApprovedCoursesWithGrades();
                if (response.family_students) {
                    setFamilyStudents(response.family_students);
                }
                if (response.subjects) {
                    setSubjects(response.subjects);
                }
            } catch (error) {
                console.error('Error loading family students:', error);
            }
        };
        loadFamilyStudentsAndSubjects();
    }, []);

    const toggleCourse = (courseId: string) => {
        setExpandedCourse(prev => (prev === courseId ? null : courseId));
    };

    if (isLoading && courses.length === 0) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
            {courses.length === 0 ? (
                <div className="text-center py-16 px-6">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <StudentIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Grade Data Available</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        We couldn't find any approved courses or grades. Enroll in courses to start tracking your academic progress!
                    </p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Header Section */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl shadow-inner">
                                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Performance</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Track your grades and assignments</p>
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
                                    className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                                    title="Refresh Data"
                                >
                                    <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>

                                <button
                                    onClick={onSubmitAssignmentClick}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                                >
                                    <UploadIcon className="w-5 h-5" />
                                    <span>Submit Assignment</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Viewing Dashboard For Dropdown */}
                        {familyStudents.length > 0 && (
                            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <StudentIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-grow">
                                    <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider block mb-1">
                                        Viewing Dashboard For
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedStudent || ''}
                                            onChange={(e) => setSelectedStudent(e.target.value || null)}
                                            className="w-full md:w-auto min-w-[300px] pl-3 pr-10 py-2 bg-white dark:bg-gray-800 border-none rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors appearance-none"
                                        >
                                            <option value="">My Dashboard</option>
                                            {familyStudents.map(student => (
                                                <option key={student.key} value={student.key}>
                                                    {student.name} ({student.subject} - Grade {student.grade})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Statistics */}
                        <GradeStatistics courses={courses as any} />

                        {/* Chart - Now displays all subjects with grades */}
                        <GradeChart />

                        {/* Filters */}
                        <GradeFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            filterType={filterType}
                            onFilterChange={setFilterType}
                        />

                        {/* Course Cards - Display all subjects with grades */}
                        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="space-y-4">
                                {chartSubjects.length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            No courses with grades yet. Request enrollment in available courses to see your grades here.
                                        </p>
                                    </div>
                                ) : (
                                    chartSubjects.map(subject => (
                                        <SubjectGradeCard
                                            key={subject.id}
                                            subject={subject.subject}
                                            grade_level={subject.grade_level}
                                            stream={subject.stream}
                                            teacher_name={subject.teacher_name}
                                            overall_grade={subject.overall_grade}
                                            assignment_average={subject.assignment_average}
                                            exam_average={subject.exam_average}
                                            isExpanded={expandedSubject === subject.id}
                                            onToggle={() => setExpandedSubject(prev => (prev === subject.id ? null : subject.id))}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Student Grades Section */}
                        {gradesBySubject.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        📋 Detailed Grade Breakdown
                                    </h3>
                                    <button
                                        onClick={() => setShowStudentGrades(!showStudentGrades)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showStudentGrades
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {showStudentGrades ? 'Hide Details' : 'Show Details'}
                                    </button>
                                </div>

                                {showStudentGrades && (
                                    <div className="space-y-6">
                                        {gradesLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : (
                                            gradesBySubject.map(subject => (
                                                <div key={subject.subject} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                                        {subject.subject}
                                                    </h4>
                                                    <StudentGradeBreakdown subject={subject} />
                                                    <div className="mt-4">
                                                        <StudentGradesByType subject={subject} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovedCoursesGradebook;

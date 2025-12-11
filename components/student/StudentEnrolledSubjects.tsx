import React, { useState, useEffect, useMemo } from 'react';
import VerticalSlider from '../common/VerticalSlider';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import eventService, { EVENTS } from '../../services/eventService';
import {
    BookOpenIcon,
    UserGroupIcon,
    AcademicCapIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    Square2StackIcon
} from '../icons/Icons';

interface Subject {
    id: number;
    subject: string;
    grade_level: string;
    stream?: string;
    teacher: {
        id: number;
        first_name: string;
        last_name: string;
        username: string;
    };
    enrolled_date: string;
    approval_date?: string;
    status?: 'active' | 'pending' | 'completed';
}

interface Student {
    student_id: number;
    student_name: string;
    total_subjects: number;
    subjects: Subject[];
}

interface Family {
    family_id: number;
    family_name: string;
    total_students: number;
    total_subjects: number;
    students: Student[];
}

const StudentEnrolledSubjects: React.FC = () => {
    const { addNotification } = useNotification();
    const [families, setFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date'>('name');

    // Enhanced data loading with better error handling
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Loading enrolled subjects...');
            const response = await apiService.getStudentEnrolledSubjects();

            // Validate response structure
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response structure from server');
            }

            const familiesData = response.families || [];

            // Validate families array
            if (!Array.isArray(familiesData)) {
                throw new Error('Families data is not an array');
            }

            // Enrich families with calculated data
            const enrichedFamilies = familiesData.map((family: any) => ({
                ...family,
                total_students: family.students?.length || 0,
                total_subjects: family.students?.reduce((sum: number, s: any) => sum + (s.subjects?.length || 0), 0) || 0,
                students: (family.students || []).map((student: any) => ({
                    ...student,
                    total_subjects: student.subjects?.length || 0
                }))
            }));

            setFamilies(enrichedFamilies);
            console.log(`Successfully loaded ${enrichedFamilies.length} families`);

            if (enrichedFamilies.length === 0) {
                // addNotification('No enrolled subjects found', 'info'); // Optional: Too noisy on initial load
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load enrolled subjects';
            console.error('Error loading enrolled subjects:', err);
            setError(errorMessage);
            addNotification(errorMessage, 'error');
            setFamilies([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for enrollment updates
    useEffect(() => {
        const handleEnrollmentEvent = () => {
            console.log('Enrollment event received, refreshing data...');
            loadData();
        };

        const unsubscribe = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_APPROVED, handleEnrollmentEvent);
        return () => unsubscribe();
    }, []);

    // Auto-refresh hook
    useAutoRefresh({
        interval: 20000, // 20 seconds
        enabled: autoRefreshEnabled,
        onRefresh: loadData
    });

    useEffect(() => {
        loadData();
    }, []);

    // Enhanced filtering with search and sorting
    const filteredAndSortedFamilies = useMemo(() => {
        let result = selectedFamily
            ? families.filter(family => family.family_id === selectedFamily)
            : families;

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.map(family => ({
                ...family,
                students: family.students.filter(student =>
                    student.student_name.toLowerCase().includes(term) ||
                    student.subjects.some(subject =>
                        subject.subject.toLowerCase().includes(term) ||
                        `${subject.teacher.first_name} ${subject.teacher.last_name}`.toLowerCase().includes(term)
                    )
                )
            })).filter(family => family.students.length > 0);
        }

        // Apply sorting
        result = result.map(family => ({
            ...family,
            students: [...family.students].sort((a, b) => {
                if (sortBy === 'name') {
                    return a.student_name.localeCompare(b.student_name);
                } else {
                    return new Date(b.subjects[0]?.enrolled_date || 0).getTime() -
                        new Date(a.subjects[0]?.enrolled_date || 0).getTime();
                }
            })
        }));

        return result;
    }, [families, selectedFamily, searchTerm, sortBy]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        return {
            total_families: families.length,
            total_students: families.reduce((sum, f) => sum + f.total_students, 0),
            total_subjects: families.reduce((sum, f) => sum + f.total_subjects, 0)
        };
    }, [families]);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            console.warn('Invalid date format:', dateString);
            return 'N/A';
        }
    };

    if (error) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Subjects</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <button
                    onClick={loadData}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 hover:shadow-lg transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Families</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_families}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <AcademicCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_students}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <BookOpenIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrolled Subjects</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_subjects}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Controls Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <Square2StackIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enrolled Subjects</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded-xl">
                                <button
                                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                    className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center gap-2 ${autoRefreshEnabled
                                            ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                    {autoRefreshEnabled ? 'Live' : 'Paused'}
                                </button>
                            </div>
                            <button
                                onClick={loadData}
                                disabled={isLoading}
                                className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-5 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search student, subject, or teacher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Sort */}
                        <div className="lg:col-span-3">
                            <div className="relative">
                                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="date">Sort by Date</option>
                                </select>
                            </div>
                        </div>

                        {/* Family Filter */}
                        {families.length > 1 && (
                            <div className="lg:col-span-4">
                                <select
                                    value={selectedFamily || ''}
                                    onChange={(e) => setSelectedFamily(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">All Families</option>
                                    {families.map(family => (
                                        <option key={family.family_id} value={family.family_id}>
                                            {family.family_name} ({family.total_students})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {isLoading && families.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading your subjects...</p>
                        </div>
                    ) : filteredAndSortedFamilies.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-700/50 rounded-3xl">
                            <BookOpenIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Subjects Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                                {searchTerm ? 'We couldn\'t find any matches for your search.' : 'You haven\'t enrolled in any subjects yet.'}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredAndSortedFamilies.map(family => (
                                <div key={family.family_id} className="bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                            <UserGroupIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {family.family_name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                                {family.total_students} student{family.total_students !== 1 ? 's' : ''} • {family.total_subjects} subject{family.total_subjects !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {family.students.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                                            No students found in this family.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {family.students.map(student => (
                                                <div key={student.student_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                                {student.student_name}
                                                            </h4>
                                                        </div>
                                                        <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md">
                                                            {student.total_subjects} Subjects
                                                        </span>
                                                    </div>

                                                    <div className="p-2 flex-grow">
                                                        {student.subjects.length === 0 ? (
                                                            <p className="text-center py-8 text-gray-500 text-sm">No enrolled subjects.</p>
                                                        ) : (
                                                            <ScrollableListContainer maxHeight="max-h-[250px]">
                                                                <div className="space-y-2 p-2">
                                                                    {student.subjects.map(subject => (
                                                                        <div
                                                                            key={subject.id}
                                                                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-200"
                                                                        >
                                                                            <div className="flex items-start gap-3 mb-2 sm:mb-0">
                                                                                <div className="mt-0.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                                                                    <AcademicCapIcon className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                                        {subject.subject}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                        Grade {subject.grade_level} {subject.stream && `(${subject.stream})`}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center justify-between sm:justify-end gap-4 text-xs pl-10 sm:pl-0 w-full sm:w-auto">
                                                                                <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                                                    {subject.teacher.first_name} {subject.teacher.last_name}
                                                                                </div>
                                                                                <div className="text-gray-400 dark:text-gray-500 font-mono">
                                                                                    {formatDate(subject.enrolled_date)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </ScrollableListContainer>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentEnrolledSubjects;
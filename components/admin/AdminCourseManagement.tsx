import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { MasterCourse } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    XMarkIcon,
    BookOpenIcon,
    FunnelIcon,
    MapPinIcon
} from '../icons/Icons';

import { useCurriculum } from '../../hooks/useCurriculum';

const AdminCourseManagement: React.FC = () => {
    const { addNotification } = useNotification();
    const { regions, gradeLevels, streams, getSubjectsFor, loading: configLoading } = useCurriculum();
    const [courses, setCourses] = useState<MasterCourse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<MasterCourse | null>(null);
    const [formData, setFormData] = useState<Partial<MasterCourse>>({
        name: '',
        code: '',
        grade_level: '',
        stream: '',
        region: 'Addis Ababa',
        description: '',
        is_active: true
    });

    const activeFilterCount = [filterGrade, filterRegion].filter(Boolean).length;

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getMasterCourses();
            setCourses(data);
        } catch (error) {
            addNotification(
                error instanceof Error ? error.message : 'Failed to fetch courses',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

    // Fetch subjects when grade or stream changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!formData.grade_level) {
                setAvailableSubjects([]);
                return;
            }

            setIsLoadingSubjects(true);
            try {
                const subjects = await getSubjectsFor(
                    formData.region || undefined,
                    formData.grade_level,
                    formData.stream || undefined
                );
                setAvailableSubjects(subjects || []);

                // Reset name (subject) if it's not in the new list
                if (subjects && subjects.length > 0 && formData.name && !subjects.includes(formData.name)) {
                    setFormData(prev => ({ ...prev, name: '' }));
                }
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
                addNotification('Failed to fetch subjects for selected grade', 'error');
                setAvailableSubjects([]);
            } finally {
                setIsLoadingSubjects(false);
            }
        };

        fetchSubjects();
    }, [formData.grade_level, formData.stream, formData.region, addNotification, getSubjectsFor]);

    const handleOpenModal = (course?: MasterCourse) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                name: course.name,
                code: course.code,
                grade_level: course.grade_level,
                stream: course.stream || '',
                region: course.region || 'Addis Ababa',
                description: course.description || '',
                is_active: course.is_active
            });
        } else {
            setEditingCourse(null);
            setFormData({
                name: '',
                code: '',
                grade_level: '',
                stream: '',
                region: 'Addis Ababa',
                description: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await apiService.updateMasterCourse(editingCourse.id, formData);
                addNotification('Course updated successfully', 'success');
            } else {
                await apiService.createMasterCourse(formData);
                addNotification('Course created successfully', 'success');
            }
            handleCloseModal();
            fetchCourses();
        } catch (error) {
            addNotification(
                error instanceof Error ? error.message : 'Failed to save course',
                'error'
            );
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        try {
            await apiService.deleteMasterCourse(id);
            addNotification('Course deleted successfully', 'success');
            fetchCourses();
        } catch (error) {
            addNotification(
                error instanceof Error ? error.message : 'Failed to delete course',
                'error'
            );
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGrade = filterGrade ? course.grade_level === filterGrade : true;
        const matchesRegion = filterRegion ? course.region === filterRegion : true;
        return matchesSearch && matchesGrade && matchesRegion;
    });

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-gray-800/50">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
                        <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Course Management
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage core curriculum master courses.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Course
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${showFilters || activeFilterCount > 0
                                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        <FunnelIcon className="w-3.5 h-3.5" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-0.5">{activeFilterCount}</span>
                        )}
                    </button>
                </div>
                <div className="relative w-full sm:w-72">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses by name or code..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Region</label>
                        <select
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value)}
                            className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Regions</option>
                            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Grade</label>
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Grades</option>
                            {gradeLevels.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Content Table */}
            <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-gray-900/50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm z-10">
                            <tr>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade Info</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Region</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        <BookOpenIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                        <p>No courses found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map(course => (
                                    <tr key={course.id} className="bg-white dark:bg-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="py-3 px-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{course.code}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <BookOpenIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{course.name}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{course.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{course.grade_level}</span>
                                                {course.stream && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 w-fit">
                                                        {course.stream}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                                                {course.region || 'Addis Ababa'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${course.is_active
                                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-800'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${course.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(course)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20 transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(course.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure course details and availability</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm hover:shadow transition-all">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Region</label>
                                    <select
                                        required
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    >
                                        {regions.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Grade Level</label>
                                    <select
                                        required
                                        value={formData.grade_level}
                                        onChange={(e) => {
                                            const newGrade = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                grade_level: newGrade,
                                                stream: (newGrade === 'Grade 11' || newGrade === 'Grade 12') ? prev.stream : ''
                                            }));
                                        }}
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    >
                                        <option value="">Select Grade</option>
                                        {gradeLevels.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Stream (Opt)</label>
                                    <select
                                        value={formData.stream || ''}
                                        onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!(formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12')}
                                    >
                                        <option value="">None</option>
                                        {streams.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Course Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono"
                                        placeholder="e.g. MATH101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Subject Name</label>
                                    <select
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        disabled={!formData.grade_level || isLoadingSubjects}
                                    >
                                        <option value="">
                                            {isLoadingSubjects ? 'Loading...' : 'Select Subject'}
                                        </option>
                                        {availableSubjects.map(subj => (
                                            <option key={subj} value={subj}>{subj}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[80px]"
                                    placeholder="Brief description of the course content..."
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 "
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="is_active" className="font-medium text-gray-700 dark:text-gray-300">Active Course</label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">If unchecked, this course will be hidden from students.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                                >
                                    {editingCourse ? 'Update Course' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseManagement;

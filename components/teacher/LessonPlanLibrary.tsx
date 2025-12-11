import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { SavedLessonPlan } from '../../types';
import { apiService } from '../../services/apiService';
import { 
    SearchIcon, 
    BookOpenIcon, 
    DownloadIcon, 
    TrashIcon, 
    ShareIcon,
    StarIcon,
    EyeIcon,
    PencilIcon,
    DocumentDuplicateIcon
} from '../icons/Icons';

interface LibraryProps {
    onLoadPlan?: (plan: SavedLessonPlan) => void;
}

const LessonPlanLibrary: React.FC<LibraryProps> = ({ onLoadPlan }) => {
    const [plans, setPlans] = useState<SavedLessonPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters and search
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [viewMode, setViewMode] = useState<'my' | 'public'>('my');
    const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'usage'>('recent');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    
    // Selected plan for actions
    const [selectedPlan, setSelectedPlan] = useState<SavedLessonPlan | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, [searchQuery, gradeFilter, subjectFilter, viewMode, sortBy, currentPage]);

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {
                page: currentPage,
                search: searchQuery || undefined,
                grade: gradeFilter || undefined,
                subject: subjectFilter || undefined,
                my_plans: viewMode === 'my',
                public_only: viewMode === 'public'
            };

            const response = await apiService.getSavedLessonPlans(params);
            
            let sortedPlans = response.results;
            if (sortBy === 'rating') {
                sortedPlans = [...sortedPlans].sort((a, b) => b.rating - a.rating);
            } else if (sortBy === 'usage') {
                sortedPlans = [...sortedPlans].sort((a, b) => b.times_used - a.times_used);
            }
            
            setPlans(sortedPlans);
            setTotalCount(response.count);
            setTotalPages(Math.ceil(response.count / 10));
        } catch (err: any) {
            setError(err.message || 'Failed to load lesson plans');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await apiService.deleteSavedLessonPlan(id);
            setShowDeleteConfirm(false);
            setSelectedPlan(null);
            fetchPlans();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const handleDuplicate = async (id: number) => {
        try {
            await apiService.duplicateLessonPlan(id);
            fetchPlans();
        } catch (err: any) {
            alert(`Failed to duplicate: ${err.message}`);
        }
    };

    const handleExport = async (id: number) => {
        try {
            const blob = await apiService.exportLessonPlanPDF(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lesson_plan_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Failed to export: ${err.message}`);
        }
    };

    const handleTogglePublic = async (plan: SavedLessonPlan) => {
        try {
            await apiService.updateSavedLessonPlan(plan.id, {
                is_public: !plan.is_public
            });
            fetchPlans();
        } catch (err: any) {
            alert(`Failed to update: ${err.message}`);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                        key={star} 
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                    ({rating.toFixed(1)})
                </span>
            </div>
        );
    };

    return (
        <Card title="Lesson Plan Library">
            <div className="space-y-4">
                {/* Filters and Search */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search plans..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    
                    <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="rating">Highest Rated</option>
                        <option value="usage">Most Used</option>
                    </select>
                </div>

                {/* View Mode Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setViewMode('my')}
                        className={`px-4 py-2 font-medium border-b-2 transition ${
                            viewMode === 'my'
                                ? 'border-primary text-primary dark:text-secondary'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        My Plans ({viewMode === 'my' ? totalCount : '...'})
                    </button>
                    <button
                        onClick={() => setViewMode('public')}
                        className={`px-4 py-2 font-medium border-b-2 transition ${
                            viewMode === 'public'
                                ? 'border-primary text-primary dark:text-secondary'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Public Library ({viewMode === 'public' ? totalCount : '...'})
                    </button>
                </div>

                {/* Loading/Error States */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-600 dark:text-gray-400">Loading plans...</div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                        {error}
                    </div>
                )}

                {/* Plans Grid */}
                {!loading && !error && plans.length === 0 && (
                    <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                        <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No lesson plans found</p>
                        <p className="text-sm mt-2">
                            {viewMode === 'my' 
                                ? 'Create your first lesson plan to get started!' 
                                : 'No public plans available yet.'}
                        </p>
                    </div>
                )}

                {!loading && !error && plans.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition bg-white dark:bg-gray-800"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                                        {plan.title}
                                    </h3>
                                    {plan.is_public && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                                            Public
                                        </span>
                                    )}
                                </div>
                                
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{plan.grade}</span>
                                        <span>•</span>
                                        <span>{plan.subject}</span>
                                    </div>
                                    <div className="text-xs">{plan.topic}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                        {plan.duration} min • By {plan.created_by.username}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <EyeIcon className="w-4 h-4" />
                                        <span>{plan.times_used}</span>
                                    </div>
                                    {plan.rating_count > 0 && renderStars(plan.rating)}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {onLoadPlan && (
                                        <button
                                            onClick={() => onLoadPlan(plan)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition"
                                            title="Load Plan"
                                        >
                                            <BookOpenIcon className="w-3 h-3" />
                                            Load
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => handleExport(plan.id)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        title="Export PDF"
                                    >
                                        <DownloadIcon className="w-3 h-3" />
                                        PDF
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDuplicate(plan.id)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                                        title="Duplicate"
                                    >
                                        <DocumentDuplicateIcon className="w-3 h-3" />
                                        Copy
                                    </button>
                                    
                                    {viewMode === 'my' && (
                                        <>
                                            <button
                                                onClick={() => handleTogglePublic(plan)}
                                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
                                                    plan.is_public
                                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                                title={plan.is_public ? 'Make Private' : 'Make Public'}
                                            >
                                                <ShareIcon className="w-3 h-3" />
                                                {plan.is_public ? 'Private' : 'Share'}
                                            </button>
                                            
                                            <button
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {plans.length} of {totalCount} plans
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && selectedPlan && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Confirm Delete
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete "{selectedPlan.title}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setSelectedPlan(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedPlan.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default LessonPlanLibrary;

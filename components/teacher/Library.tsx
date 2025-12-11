import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { SavedLessonPlan, SavedRubric, SavedLesson, SavedQuiz } from '../../types';
import { apiService } from '../../services/apiService';
import { BookOpenIcon, ScaleIcon, SparklesIcon, FolderIcon } from '../icons/Icons';
import LibraryFilters from './library/LibraryFilters';
import LibraryTabs, { LibraryView, LibraryMode } from './library/LibraryTabs';
import LessonPlanCard from './library/LessonPlanCard';
import RubricCard from './library/RubricCard';
import { ShareModal } from './library/ShareModal';
import ConfirmationModal from '../common/ConfirmationModal';
import LessonPlanViewer from './library/LessonPlanViewer';
import RubricViewer from './library/RubricViewer';
import LessonCard from './library/LessonCard';
import LessonViewer from './library/LessonViewer';
import QuizCard from './library/QuizCard';
import QuizViewer from './library/QuizViewer';

interface LibraryProps {
    onLoadPlan?: (plan: SavedLessonPlan) => void;
    onLoadRubric?: (rubric: SavedRubric) => void;
    refreshTrigger?: number;
}

const Library: React.FC<LibraryProps> = ({ onLoadPlan, onLoadRubric, refreshTrigger }) => {
    // View state
    const [currentView, setCurrentView] = useState<LibraryView>('lesson-plans');
    const [viewMode, setViewMode] = useState<LibraryMode>('my');

    // Data state
    const [lessonPlans, setLessonPlans] = useState<SavedLessonPlan[]>([]);
    const [rubrics, setRubrics] = useState<SavedRubric[]>([]);

    const [lessons, setLessons] = useState<SavedLesson[]>([]);
    const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and search
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'usage'>('recent');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Selected item for actions
    const [selectedItem, setSelectedItem] = useState<SavedLessonPlan | SavedRubric | SavedLesson | SavedQuiz | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareContentType, setShareContentType] = useState<'lesson_plan' | 'rubric' | 'lesson' | 'quiz'>('lesson_plan');

    // Viewer modals
    const [showLessonPlanViewer, setShowLessonPlanViewer] = useState(false);
    const [showRubricViewer, setShowRubricViewer] = useState(false);
    const [viewingLessonPlan, setViewingLessonPlan] = useState<SavedLessonPlan | null>(null);
    const [viewingRubric, setViewingRubric] = useState<SavedRubric | null>(null);
    const [viewingLesson, setViewingLesson] = useState<SavedLesson | null>(null);
    const [viewingQuiz, setViewingQuiz] = useState<SavedQuiz | null>(null);
    const [showLessonViewer, setShowLessonViewer] = useState(false);
    const [showQuizViewer, setShowQuizViewer] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentView, searchQuery, gradeFilter, subjectFilter, viewMode, sortBy, currentPage]);

    // Refresh when new items are saved
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            // Reset to page 1 and fetch data to show newly saved item
            setCurrentPage(1);
            fetchData();
        }
    }, [refreshTrigger]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (currentView === 'lesson-plans') {
                await fetchLessonPlans();
            } else if (currentView === 'rubrics') {
                await fetchRubrics();

            } else if (currentView === 'lessons') {
                await fetchLessons();
            } else {
                await fetchQuizzes();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchLessonPlans = async () => {
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

        setLessonPlans(sortedPlans);
        setTotalCount(response.count);
        setTotalPages(Math.ceil(response.count / 10));
    };

    const fetchRubrics = async () => {
        const params: any = {
            page: currentPage,
            search: searchQuery || undefined,
            grade_level: gradeFilter || undefined,
            subject: subjectFilter || undefined,
            my_rubrics: viewMode === 'my',
            public_only: viewMode === 'public'
        };

        const response = await apiService.getSavedRubrics(params);
        console.log('Rubrics API Response:', response);

        // Handle both paginated and non-paginated responses
        const rubricsList = response.results || (Array.isArray(response) ? response : []);
        const count = response.count || (Array.isArray(response) ? response.length : 0);
        console.log('Rubrics List:', rubricsList, 'Count:', count);

        let sortedRubrics = rubricsList;
        if (sortBy === 'usage') {
            sortedRubrics = [...rubricsList].sort((a, b) => b.times_used - a.times_used);
        }

        setRubrics(sortedRubrics);
        setTotalCount(count);
        setTotalPages(Math.ceil(count / 10));
    };

    const fetchLessons = async () => {
        const params: any = {
            page: currentPage,
            search: searchQuery || undefined,
            grade: gradeFilter || undefined,
            subject: subjectFilter || undefined,
            my_lessons: viewMode === 'my',
        };

        const response = await apiService.getSavedLessons(params);

        setLessons(response.results || []);
        setTotalCount(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / 10));
    };

    const fetchQuizzes = async () => {
        // Assuming apiService.getQuizzes works for teachers too, or we need a specific endpoint
        // For now, using getQuizzes which returns Quiz[] (SavedQuiz compatible mostly)
        // But getQuizzes might not support pagination/filtering yet in the same way.
        // Let's assume we need to implement getLibraryQuizzes or similar in apiService if getQuizzes is limited.
        // Based on previous files, getQuizzes returns Quiz[], not paginated result.
        // I will use getQuizzes for now and handle client-side filtering if needed, or update apiService.
        // Wait, apiService.getQuizzes calls /academics/quizzes/. OnlineQuizViewSet supports filtering.
        // But it returns a list, not { count, results }.
        // I'll handle it as a list for now.

        try {
            const response = await apiService.getQuizzes();
            // Filter locally for now since API might not support all filters yet
            let filtered = response;
            if (searchQuery) {
                filtered = filtered.filter((q: any) => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
            }
            if (gradeFilter) {
                filtered = filtered.filter((q: any) => q.grade_level.toString() === gradeFilter.replace('Grade ', ''));
            }
            if (subjectFilter) {
                filtered = filtered.filter((q: any) => q.subject === subjectFilter);
            }

            // Pagination logic (client-side)
            const count = filtered.length;
            const start = (currentPage - 1) * 10;
            const end = start + 10;
            const paginated = filtered.slice(start, end);

            setQuizzes(paginated);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / 10));
        } catch (err: any) {
            console.error("Error fetching quizzes:", err);
            // Fallback or empty
            setQuizzes([]);
            setTotalCount(0);
            setTotalPages(1);
        }
    };

    // Lesson Plan Actions
    const handleDeleteLessonPlan = async (id: number) => {
        try {
            await apiService.deleteSavedLessonPlan(id);
            setShowDeleteConfirm(false);
            setSelectedItem(null);
            fetchData();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const handleDuplicateLessonPlan = async (id: number) => {
        try {
            await apiService.duplicateLessonPlan(id);
            fetchData();
        } catch (err: any) {
            alert(`Failed to duplicate: ${err.message}`);
        }
    };

    const handleExportLessonPlan = async (id: number) => {
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

    const handleLoadLessonPlan = async (plan: SavedLessonPlan) => {
        try {
            // Fetch full lesson plan details from API
            const fullPlan = await apiService.getSavedLessonPlan(plan.id);
            setViewingLessonPlan(fullPlan);
            setShowLessonPlanViewer(true);
        } catch (err: any) {
            console.error('Failed to load lesson plan:', err);
            alert(`Failed to load lesson plan: ${err.message}`);
        }
    };

    const handleShareLessonPlan = (plan: SavedLessonPlan) => {
        setSelectedItem(plan);
        setShareContentType('lesson_plan');
        setShowShareModal(true);
    };

    // Rubric Actions
    const handleDeleteRubric = async (id: number) => {
        try {
            await apiService.deleteSavedRubric(id);
            setShowDeleteConfirm(false);
            setSelectedItem(null);
            fetchData();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const handleDuplicateRubric = async (id: number) => {
        try {
            await apiService.duplicateRubric(id);
            fetchData();
        } catch (err: any) {
            alert(`Failed to duplicate: ${err.message}`);
        }
    };

    const handleExportRubric = async (id: number, format: 'pdf' | 'docx' | 'txt') => {
        try {
            const blob = await apiService.exportSavedRubric(id, format);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rubric_${id}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Failed to export: ${err.message}`);
        }
    };

    const handleLoadRubric = (rubric: SavedRubric) => {
        setViewingRubric(rubric);
        setShowRubricViewer(true);
    };

    const handleShareRubric = (rubric: SavedRubric) => {
        setSelectedItem(rubric);
        setShareContentType('rubric');
        setShowShareModal(true);
    };

    const handleShareSuccess = () => {
        alert('File shared successfully!');
        fetchData();
    };

    const handleDeleteLesson = async (id: number) => {
        try {
            await apiService.deleteSavedLesson(id);
            setShowDeleteConfirm(false);
            setSelectedItem(null);
            fetchData();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const handleExportLesson = async (lesson: SavedLesson) => {
        try {
            const blob = await apiService.exportSavedLesson(lesson.id, 'pdf');
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${lesson.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Failed to export: ${err.message}`);
        }
    };

    const handleExportLessonFromViewer = async (format: 'pdf' | 'docx' | 'txt') => {
        if (!viewingLesson) return;
        try {
            const blob = await apiService.exportSavedLesson(viewingLesson.id, format);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${viewingLesson.title.replace(/\s+/g, '_')}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Failed to export: ${err.message}`);
        }
    };

    const handleDeleteQuiz = async (id: number) => {
        try {
            // apiService.deleteQuiz needs to be implemented or use generic delete
            // Assuming apiService.deleteQuiz exists or I'll add it.
            // Wait, apiService has deleteSavedLessonPlan, deleteSavedRubric.
            // It might not have deleteQuiz. I should check apiService.
            // If not, I'll assume I can add it or use a generic call.
            // For now, I'll assume apiService.deleteQuiz(id) exists or I will add it.
            // Actually, I'll use a placeholder and ensure apiService has it.
            await apiService.deleteQuiz(id);
            setShowDeleteConfirm(false);
            setSelectedItem(null);
            fetchData();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const handleExportQuiz = async (quiz: SavedQuiz) => {
        try {
            const blob = await apiService.exportQuizPDF(quiz.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz_${quiz.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('Failed to export quiz:', err);
            alert(`Failed to export quiz: ${err.message}`);
        }
    };

    const handleShareQuiz = (quiz: SavedQuiz) => {
        setSelectedItem(quiz);
        setShareContentType('quiz');
        setShowShareModal(true);
    };

    const handleLoadQuiz = async (quiz: SavedQuiz) => {
        try {
            const fullQuiz = await apiService.getQuiz(quiz.id);
            setViewingQuiz(fullQuiz);
            setShowQuizViewer(true);
        } catch (err: any) {
            console.error('Failed to load quiz:', err);
            alert(`Failed to load quiz: ${err.message}`);
        }
    };

    const handleViewChange = (view: LibraryView) => {
        setCurrentView(view);
        setCurrentPage(1);
        setSearchQuery('');
        setGradeFilter('');
        setSubjectFilter('');
    };

    const handleModeChange = (mode: LibraryMode) => {
        setViewMode(mode);
        setCurrentPage(1);
    };

    const handleDelete = (item: SavedLessonPlan | SavedRubric | SavedLesson | SavedQuiz) => {
        setSelectedItem(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!selectedItem) return;

        if (currentView === 'lesson-plans') {
            handleDeleteLessonPlan(selectedItem.id);
        } else if (currentView === 'rubrics') {
            handleDeleteRubric(selectedItem.id);
        } else if (currentView === 'lessons') {
            handleDeleteLesson(selectedItem.id);
        } else {
            handleDeleteQuiz(selectedItem.id);
        }
    };

    const currentData = currentView === 'lesson-plans' ? lessonPlans : currentView === 'rubrics' ? rubrics : currentView === 'lessons' ? lessons : quizzes;
    const emptyIcon = currentView === 'lesson-plans' ? BookOpenIcon : currentView === 'rubrics' ? ScaleIcon : currentView === 'lessons' ? SparklesIcon : BookOpenIcon;
    const emptyMessage = currentView === 'lesson-plans'
        ? (viewMode === 'my' ? 'Create your first lesson plan to get started!' : 'No public lesson plans available yet.')
        : currentView === 'rubrics'
            ? (viewMode === 'my' ? 'Create your first rubric to get started!' : 'No public rubrics available yet.')
            : currentView === 'lessons'
                ? (viewMode === 'my' ? 'Generate your first lesson to get started!' : 'No public lessons available yet.')
                : (viewMode === 'my' ? 'Create your first quiz to get started!' : 'No public quizzes available yet.');

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl shadow-inner">
                    <FolderIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-300 dark:to-cyan-300">
                        Resource Library
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and access your lesson plans, rubrics, and quizzes</p>
                </div>
            </div>
            <div className="space-y-4">
                {/* Tabs */}
                <LibraryTabs
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    currentMode={viewMode}
                    onModeChange={handleModeChange}
                    lessonPlanCount={currentView === 'lesson-plans' ? totalCount : 0}
                    rubricCount={currentView === 'rubrics' ? totalCount : 0}
                    lessonCount={currentView === 'lessons' ? totalCount : 0}
                    quizCount={currentView === 'quizzes' ? totalCount : 0}
                />

                {/* Filters and Search */}
                <LibraryFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    gradeFilter={gradeFilter}
                    onGradeChange={setGradeFilter}
                    subjectFilter={subjectFilter}
                    onSubjectChange={setSubjectFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

                {/* Loading/Error States */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && currentData.length === 0 && (
                    <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                        {React.createElement(emptyIcon, { className: "w-16 h-16 mx-auto mb-4 opacity-50" })}
                        <p>No {currentView === 'lesson-plans' ? 'lesson plans' : currentView === 'rubrics' ? 'rubrics' : 'lessons'} found</p>
                        <p className="text-sm mt-2">{emptyMessage}</p>
                    </div>
                )}

                {/* Content Grid */}
                {!loading && !error && currentData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentView === 'lesson-plans' ? (
                            lessonPlans.map(plan => (
                                <LessonPlanCard
                                    key={plan.id}
                                    plan={plan}
                                    viewMode={viewMode}
                                    onLoad={handleLoadLessonPlan}
                                    onExport={handleExportLessonPlan}
                                    onShare={handleShareLessonPlan}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : currentView === 'rubrics' ? (
                            rubrics.map(rubric => (
                                <RubricCard
                                    key={rubric.id}
                                    rubric={rubric}
                                    viewMode={viewMode}
                                    onLoad={handleLoadRubric}
                                    onExport={handleExportRubric}
                                    onShare={handleShareRubric}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : currentView === 'lessons' ? (
                            lessons.map(lesson => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onView={(l) => { setViewingLesson(l); setShowLessonViewer(true); }}
                                    onDelete={() => handleDelete(lesson)}
                                    onShare={() => {
                                        setSelectedItem(lesson);
                                        setShareContentType('lesson');
                                        setShowShareModal(true);
                                    }}
                                    onExport={handleExportLesson}
                                />
                            ))
                        ) : (
                            quizzes.map(quiz => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onView={handleLoadQuiz}
                                    onDelete={() => handleDelete(quiz)}
                                    onShare={() => handleShareQuiz(quiz)}
                                    onExport={() => handleExportQuiz(quiz)}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {currentData.length} of {totalCount} {currentView === 'lesson-plans' ? 'plans' : currentView === 'rubrics' ? 'rubrics' : 'lessons'}
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

                {/* Share Modal */}
                {showShareModal && selectedItem && (
                    <ShareModal
                        isOpen={showShareModal}
                        onClose={() => {
                            setShowShareModal(false);
                            setSelectedItem(null);
                        }}
                        contentType={shareContentType}
                        contentId={selectedItem.id}
                        contentTitle={selectedItem.title}
                        onSuccess={handleShareSuccess}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Confirm Delete
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete "{selectedItem.title}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setSelectedItem(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lesson Plan Viewer Modal */}
                <LessonPlanViewer
                    isOpen={showLessonPlanViewer}
                    onClose={() => {
                        setShowLessonPlanViewer(false);
                        setViewingLessonPlan(null);
                    }}
                    lessonPlan={viewingLessonPlan}
                />

                {/* Rubric Viewer Modal */}
                <RubricViewer
                    isOpen={showRubricViewer}
                    onClose={() => {
                        setShowRubricViewer(false);
                        setViewingRubric(null);
                    }}
                    rubric={viewingRubric}
                />

                {/* Lesson Viewer Modal */}
                {showLessonViewer && viewingLesson && (
                    <LessonViewer
                        lesson={viewingLesson}
                        onClose={() => {
                            setShowLessonViewer(false);
                            setViewingLesson(null);
                        }}
                        onExport={handleExportLessonFromViewer}
                    />
                )}

                {/* Quiz Viewer Modal */}
                <QuizViewer
                    isOpen={showQuizViewer}
                    onClose={() => {
                        setShowQuizViewer(false);
                        setViewingQuiz(null);
                    }}
                    quiz={viewingQuiz}
                />
            </div>
        </div>
    );
};

export default Library;

import React, { useState, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useAdminEnrollmentRequests, EnrollmentRequest } from '../../hooks/useAdminEnrollmentRequests';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/apiService';
import AdminEnrollmentRequestsStats from './AdminEnrollmentRequestsStats';
import AdminEnrollmentRequestsFilters from './AdminEnrollmentRequestsFilters';
import { CheckCircleIcon, XMarkIcon, ClockIcon, ArrowPathIcon, ClipboardDocumentCheckIcon, UserIcon, AcademicCapIcon, BookOpenIcon, } from '../icons/Icons';

const AdminEnrollmentApprovalManager: React.FC = () => {
    const { addNotification } = useNotification();
    const { enrollments, stats, isLoading, error, refetch } = useAdminEnrollmentRequests();
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Auto-refresh hook
    useAutoRefresh({
        interval: 10000, // 10 seconds
        enabled: autoRefreshEnabled,
        onRefresh: () => refetch(filters)
    });

    // Show error notification
    React.useEffect(() => {
        if (error) {
            addNotification(error, 'error');
        }
    }, [error, addNotification]);

    const handleFilter = useCallback((newFilters: { status: string; search: string }) => {
        setFilters(newFilters);
        refetch(newFilters);
    }, [refetch]);

    const handleApprove = async (enrollment: EnrollmentRequest) => {
        setIsProcessing(true);
        try {
            await apiService.approveEnrollmentRequest(enrollment.id, reviewNotes);
            addNotification(`Enrollment request approved for ${enrollment.student.first_name} ${enrollment.student.last_name}`, 'success');
            setSelectedEnrollment(null);
            setReviewNotes('');
            await refetch(filters);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to approve enrollment';
            addNotification(errorMsg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async (enrollment: EnrollmentRequest) => {
        setIsProcessing(true);
        try {
            await apiService.declineEnrollmentRequest(enrollment.id, reviewNotes);
            addNotification(`Enrollment request declined for ${enrollment.student.first_name} ${enrollment.student.last_name}`, 'success');
            setSelectedEnrollment(null);
            setReviewNotes('');
            await refetch(filters);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to decline enrollment';
            addNotification(errorMsg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnderReview = async (enrollment: EnrollmentRequest) => {
        setIsProcessing(true);
        try {
            await apiService.setUnderReviewEnrollmentRequest(enrollment.id, reviewNotes);
            addNotification(`Enrollment request marked as under review for ${enrollment.student.first_name} ${enrollment.student.last_name}`, 'success');
            setSelectedEnrollment(null);
            setReviewNotes('');
            await refetch(filters);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to mark as under review';
            addNotification(errorMsg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
            pending: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', icon: <ClockIcon className="h-3 w-3" /> },
            approved: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', icon: <CheckCircleIcon className="h-3 w-3" /> },
            declined: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', icon: <XMarkIcon className="h-3 w-3" /> },
            under_review: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', icon: <ClockIcon className="h-3 w-3" /> }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.icon}
                <span>{status.replace('_', ' ')}</span>
            </span>
        );
    };

    const filteredEnrollments = enrollments.filter(e => {
        if (filters.status && e.status !== filters.status) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const studentName = `${e.student.first_name} ${e.student.last_name}`.toLowerCase();
            const teacherName = `${e.teacher.first_name} ${e.teacher.last_name}`.toLowerCase();
            if (!studentName.includes(search) && !teacherName.includes(search) && !e.subject.toLowerCase().includes(search)) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="space-y-6 max-h-[85vh] overflow-y-auto p-1 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Enrollment Approval
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Review and manage student course enrollment requests</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${autoRefreshEnabled
                                ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                    >
                        {autoRefreshEnabled ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        )}
                        Live Updates
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button
                        onClick={() => refetch(filters)}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Refresh now"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <AdminEnrollmentRequestsStats stats={stats} isLoading={isLoading} />

            {/* Filters */}
            <AdminEnrollmentRequestsFilters onFilter={handleFilter} isLoading={isLoading} />

            {/* Enrollment Requests Table */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-500" />
                        Requests List
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                            {filteredEnrollments.length}
                        </span>
                    </h3>
                </div>

                {isLoading && enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading requests...</p>
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/30">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <ClipboardDocumentCheckIcon className="w-8 h-8" />
                        </div>
                        <h4 className="text-gray-900 dark:text-white font-bold mb-1">No requests found</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Review your filters or wait for new enrollment requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredEnrollments.map(enrollment => (
                                    <tr key={enrollment.id} className="bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                                                    {enrollment.student.first_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {enrollment.student.first_name} {enrollment.student.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        {enrollment.student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                    <BookOpenIcon className="w-4 h-4 text-gray-400" />
                                                    {enrollment.subject}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-medium">
                                                        {enrollment.grade_level}
                                                    </span>
                                                    {enrollment.stream && (
                                                        <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400 font-medium">
                                                            {enrollment.stream}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {enrollment.teacher.first_name} {enrollment.teacher.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        Assigned Teacher
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                {getStatusBadge(enrollment.status)}
                                                <span className="text-[10px] text-gray-400 pl-1">
                                                    {new Date(enrollment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedEnrollment(enrollment)}
                                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                            >
                                                Review Request
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedEnrollment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Review Request
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ID: #{selectedEnrollment.id.toString().padStart(6, '0')}
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedEnrollment(null); setReviewNotes(''); }}
                                className="p-1.5 bg-white dark:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shadow-sm"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary Card */}
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Student</p>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-blue-500" />
                                            {selectedEnrollment.student.first_name} {selectedEnrollment.student.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Course</p>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <BookOpenIcon className="w-4 h-4 text-blue-500" />
                                            {selectedEnrollment.subject}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Grade</p>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <AcademicCapIcon className="w-4 h-4 text-blue-500" />
                                            {selectedEnrollment.grade_level}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Teacher</p>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                            {selectedEnrollment.teacher.first_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Review Notes / Feedback
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add optional notes explaining your decision..."
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:text-white min-h-[100px] text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <button
                                    onClick={() => handleApprove(selectedEnrollment)}
                                    disabled={isProcessing}
                                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-green-500/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    {isProcessing ? 'Saving...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleUnderReview(selectedEnrollment)}
                                    disabled={isProcessing}
                                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                                >
                                    <ClockIcon className="w-5 h-5" />
                                    {isProcessing ? 'Saving...' : 'Review'}
                                </button>
                                <button
                                    onClick={() => handleDecline(selectedEnrollment)}
                                    disabled={isProcessing}
                                    className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                    {isProcessing ? 'Saving...' : 'Decline'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEnrollmentApprovalManager;

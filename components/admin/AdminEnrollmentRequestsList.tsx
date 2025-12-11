import React, { useState } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { EnrollmentRequest } from '../../hooks/useAdminEnrollmentRequests';
import { CheckCircleIcon, XMarkIcon, ClockIcon } from '../icons/Icons';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

interface AdminEnrollmentRequestsListProps {
    enrollments: EnrollmentRequest[];
    isLoading: boolean;
    onRefresh: () => void;
}

const AdminEnrollmentRequestsList: React.FC<AdminEnrollmentRequestsListProps> = ({ enrollments, isLoading, onRefresh }) => {
    const { addNotification } = useNotification();
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async (enrollment: EnrollmentRequest) => {
        setIsProcessing(true);
        try {
            await apiService.approveEnrollmentRequest(enrollment.id, reviewNotes);
            addNotification(`Enrollment request approved for ${enrollment.student.first_name} ${enrollment.student.last_name}`, 'success');
            setSelectedEnrollment(null);
            setReviewNotes('');
            onRefresh();
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
            onRefresh();
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
            onRefresh();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to mark as under review';
            addNotification(errorMsg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: <ClockIcon className="h-4 w-4" /> },
            approved: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: <CheckCircleIcon className="h-4 w-4" /> },
            declined: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', icon: <XMarkIcon className="h-4 w-4" /> },
            under_review: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', icon: <ClockIcon className="h-4 w-4" /> }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                {badge.icon}
                <span>{status.replace('_', ' ').toUpperCase()}</span>
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <Card title="Enrollment Requests">
                {isLoading && enrollments.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No enrollment requests found.
                    </div>
                ) : (
                    <ScrollableListContainer>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Teacher</th>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Grade Level</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(enrollment => (
                                    <tr key={enrollment.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {enrollment.student.first_name} {enrollment.student.last_name}
                                            <br />
                                            <span className="text-xs text-gray-500">{enrollment.student.email}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {enrollment.teacher.first_name} {enrollment.teacher.last_name}
                                            <br />
                                            <span className="text-xs text-gray-500">{enrollment.teacher.email}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{enrollment.subject}</td>
                                        <td className="px-4 py-3">{enrollment.grade_level}{enrollment.stream ? ` - ${enrollment.stream}` : ''}</td>
                                        <td className="px-4 py-3">{getStatusBadge(enrollment.status)}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {new Date(enrollment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedEnrollment(enrollment)}
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ScrollableListContainer>
                )}
            </Card>

            {/* Review Modal */}
            {selectedEnrollment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card title="" className="w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Review Enrollment Request
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedEnrollment.student.first_name} {selectedEnrollment.student.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedEnrollment.teacher.first_name} {selectedEnrollment.teacher.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedEnrollment.subject}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Grade Level</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedEnrollment.grade_level}{selectedEnrollment.stream ? ` - ${selectedEnrollment.stream}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Review Notes
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add any notes about this enrollment request..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleApprove(selectedEnrollment)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => handleUnderReview(selectedEnrollment)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Under Review'}
                            </button>
                            <button
                                onClick={() => handleDecline(selectedEnrollment)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Decline'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedEnrollment(null);
                                    setReviewNotes('');
                                }}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminEnrollmentRequestsList;

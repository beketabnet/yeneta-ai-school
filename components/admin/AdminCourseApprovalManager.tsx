import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface CourseRequest {
  id: number;
  teacher: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  subject: string;
  grade_level: string;
  stream?: string;
  status: 'pending' | 'approved' | 'declined' | 'under_review';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: {
    id: number;
    username: string;
  };
  review_notes?: string;
}

const AdminCourseApprovalManager: React.FC = () => {
  const { addNotification } = useNotification();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'under_review'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/academics/teacher-course-requests/', {
        params: filter !== 'all' ? { status: filter } : {}
      });
      setRequests(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading course requests:', error);
      addNotification('Failed to load course requests. Please check the network and try again.', 'error');
      setRequests([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [filter, addNotification]);

  // Auto-refresh hook
  useAutoRefresh({
    interval: 10000, // 10 seconds
    enabled: autoRefreshEnabled,
    onRefresh: loadRequests
  });

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Listen for course request events
  useEffect(() => {
    const unsubscribeCourseCreated = eventService.subscribe(EVENTS.COURSE_REQUEST_CREATED, () => {
      addNotification('New course request received!', 'info');
      // Switch to pending tab to show the new request
      setFilter('pending');
    });

    const unsubscribeCourseUpdated = eventService.subscribe(EVENTS.COURSE_REQUEST_UPDATED, () => {
      loadRequests();
    });

    return () => {
      unsubscribeCourseCreated();
      unsubscribeCourseUpdated();
    };
  }, [loadRequests]);

  const handleAction = async (requestId: number, action: 'approve' | 'decline' | 'under_review') => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    try {
      const endpoint = `/academics/teacher-course-requests/${requestId}/${action}/`;
      await apiService.post(endpoint, { review_notes: reviewNotes });

      setRequests(requests.map(req =>
        req.id === requestId
          ? {
            ...req,
            status: action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : 'under_review',
            review_notes: reviewNotes,
            reviewed_at: new Date().toISOString(),
            reviewed_by: { id: 0, username: 'current_admin' }
          }
          : req
      ));

      const actionText = action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : 'set to under review';
      addNotification(
        `Course request for ${selectedRequest.subject} (${selectedRequest.teacher.first_name} ${selectedRequest.teacher.last_name}) has been ${actionText}`,
        'success'
      );

      // Emit event for other components to update
      if (action === 'approve') {
        eventService.emit(EVENTS.COURSE_REQUEST_APPROVED, { request: selectedRequest });
      } else if (action === 'decline') {
        eventService.emit(EVENTS.COURSE_REQUEST_DECLINED, { request: selectedRequest });
      } else {
        eventService.emit(EVENTS.COURSE_REQUEST_UNDER_REVIEW, { request: selectedRequest });
      }

      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      addNotification(`Failed to ${action} request`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <EyeIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      {/* Title */}
      <div className="flex items-center mb-6">
        <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Course Approval Manager</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'declined', 'under_review', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefreshEnabled
                ? 'bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-100 hover:bg-green-300 dark:hover:bg-green-500'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefreshEnabled ? '⟳' : '⊘'}
          </button>
          <button
            onClick={loadRequests}
            disabled={isLoading}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:bg-gray-400"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Requests List */}
      <ScrollableListContainer>
        {isLoading && !requests.length && <p className="text-center py-8 text-gray-500">Loading requests...</p>}
        {!isLoading && requests.length === 0 && (
          <p className="text-center py-8 text-gray-500">No course requests found.</p>
        )}
        {requests.length > 0 && (
          <div className="grid gap-4 pr-2">
            {requests.map(request => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRequest?.id === request.id
                    ? 'border-primary bg-primary-light dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {request.teacher.first_name} {request.teacher.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{request.teacher.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{request.subject}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Grade {request.grade_level} {request.stream && `(${request.stream})`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(request.requested_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedRequest && (
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
              Review Course Request
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedRequest.teacher.first_name} {selectedRequest.teacher.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Grade Level</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedRequest.grade_level} {selectedRequest.stream && `(${selectedRequest.stream})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requested Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedRequest.requested_at)}</p>
              </div>
              {selectedRequest.reviewed_at && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reviewed By</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedRequest.reviewed_by?.username || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reviewed Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedRequest.reviewed_at)}</p>
                  </div>
                </>
              )}
            </div>

            {selectedRequest.review_notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Previous Review Notes</p>
                <p className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">
                  {selectedRequest.review_notes}
                </p>
              </div>
            )}

            {/* Review Controls - Available for all statuses */}
            <div className="mt-4 border-t pt-4 border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Update Status
              </h4>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes (optional)..."
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selectedRequest.id, 'approve')}
                  disabled={isActionLoading || selectedRequest.status === 'approved'}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${selectedRequest.status === 'approved'
                      ? 'bg-green-700 opacity-50 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, 'under_review')}
                  disabled={isActionLoading || selectedRequest.status === 'under_review'}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${selectedRequest.status === 'under_review'
                      ? 'bg-yellow-700 opacity-50 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                    }`}
                >
                  <ClockIcon className="h-5 w-5" />
                  Under Review
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, 'decline')}
                  disabled={isActionLoading || selectedRequest.status === 'declined'}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${selectedRequest.status === 'declined'
                      ? 'bg-red-700 opacity-50 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  <XCircleIcon className="h-5 w-5" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </ScrollableListContainer>
    </Card>
  );
};

export default AdminCourseApprovalManager;

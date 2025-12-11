import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface EnrollmentRequest {
  id: number;
  student: {
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
  family?: {
    id: number;
    name: string;
  };
}

const TeacherEnrollmentApproval: React.FC = () => {
  const { addNotification } = useNotification();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'under_review'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/academics/student-enrollment-requests/', {
        params: filter !== 'all' ? { status: filter } : {}
      });
      setRequests(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading enrollment requests:', error);
      addNotification('Failed to load enrollment requests', 'error');
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

  // Load requests on mount and listen for enrollment request events
  useEffect(() => {
    loadRequests();

    const unsubscribeEnrollmentCreated = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_CREATED, () => {
      loadRequests();
    });

    return () => {
      unsubscribeEnrollmentCreated();
    };
  }, [loadRequests]);

  const handleAction = async (requestId: number, action: 'approve' | 'decline' | 'under_review') => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    try {
      const endpoint = `/academics/student-enrollment-requests/${requestId}/${action}/`;
      await apiService.post(endpoint, { review_notes: reviewNotes });

      // Update local state
      setRequests(requests.map(req =>
        req.id === requestId
          ? { ...req, status: action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : 'under_review', review_notes: reviewNotes, reviewed_at: new Date().toISOString() }
          : req
      ));

      addNotification(
        `Enrollment request ${action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : 'set to under review'} successfully`,
        'success'
      );

      // Emit event for parent dashboard to update
      if (action === 'approve') {
        eventService.emit(EVENTS.ENROLLMENT_REQUEST_APPROVED, { request: selectedRequest });
      } else if (action === 'decline') {
        eventService.emit(EVENTS.ENROLLMENT_REQUEST_DECLINED, { request: selectedRequest });
      } else {
        eventService.emit(EVENTS.ENROLLMENT_REQUEST_UNDER_REVIEW, { request: selectedRequest });
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
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-800 bg-green-100';
      case 'declined':
        return 'text-red-800 bg-red-100';
      case 'under_review':
        return 'text-yellow-800 bg-yellow-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const filteredRequests = (requests || []).filter(req => filter === 'all' || req.status === filter);

  return (
    <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Enrollment Approval Manager</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefreshEnabled
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

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'declined', label: 'Declined' },
            { key: 'under_review', label: 'Under Review' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {filter !== 'all' ? filter : ''} enrollment requests found.
          </div>
        ) : (
          <ScrollableListContainer className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="space-y-4 pr-2">
              {filteredRequests.map(request => (
                <div key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {request.student.first_name} {request.student.last_name} ({request.student.username})
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.subject} - Grade {request.grade_level}
                          {request.stream && ` (${request.stream})`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Requested on {new Date(request.requested_at).toLocaleDateString()}
                          {request.reviewed_at && ` • Reviewed on ${new Date(request.reviewed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {(request.status === 'pending' || request.status === 'declined' || request.status === 'under_review') && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md"
                          title={`Review ${request.status} request`}
                          aria-label={`View details for ${request.student.first_name} ${request.student.last_name}'s request`}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {request.review_notes && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Review Notes:</strong> {request.review_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollableListContainer>
        )}

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Review Enrollment Request</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Student:</strong> {selectedRequest.student.first_name} {selectedRequest.student.last_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Course:</strong> {selectedRequest.subject} - Grade {selectedRequest.grade_level}
                {selectedRequest.stream && ` (${selectedRequest.stream})`}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any notes about this decision..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction(selectedRequest.id, 'approve')}
                disabled={isActionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Approve
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, 'decline')}
                disabled={isActionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Decline
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, 'under_review')}
                disabled={isActionLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors flex items-center justify-center gap-2"
              >
                <ClockIcon className="h-5 w-5" />
                Under Review
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                disabled={isActionLoading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        )}
      </Card>
    );
  };

export default TeacherEnrollmentApproval;
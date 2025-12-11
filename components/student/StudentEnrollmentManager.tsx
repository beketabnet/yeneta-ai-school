import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface EnrollmentRequest {
  id: number;
  subject: string;
  grade_level: string;
  stream?: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    full_name?: string;
  };
  status: 'pending' | 'approved' | 'declined' | 'under_review';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

const StudentEnrollmentManager: React.FC = () => {
  const { addNotification } = useNotification();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'under_review'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/academics/my-enrollment-requests/');
      setRequests(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading enrollment requests:', error);
      addNotification('Failed to load enrollment requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);


  // Auto-refresh hook
  useAutoRefresh({
    interval: 15000, // 15 seconds
    enabled: autoRefreshEnabled,
    onRefresh: loadRequests
  });

  // Load requests on mount and listen for events
  useEffect(() => {
    loadRequests();

    const unsubscribeApproved = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_APPROVED, () => {
      loadRequests();
    });

    const unsubscribeDeclined = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_DECLINED, () => {
      loadRequests();
    });

    const unsubscribeUnderReview = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_UNDER_REVIEW, () => {
      loadRequests();
    });

    const unsubscribeCreated = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_CREATED, () => {
      loadRequests();
    });

    return () => {
      unsubscribeApproved();
      unsubscribeDeclined();
      unsubscribeUnderReview();
      unsubscribeCreated();
    };
  }, [loadRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
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

  const filteredRequests = requests.filter(req => filter === 'all' || req.status === filter);

  return (
    <Card title="My Enrollment Requests">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${autoRefreshEnabled
                  ? 'bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-100 hover:bg-green-300 dark:hover:bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              {autoRefreshEnabled ? '⟳' : '⊘'}
            </button>
            <button
              onClick={() => loadRequests()}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh requests"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'declined', 'under_review'].map(status => (
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

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No {filter !== 'all' ? filter : ''} enrollment requests found.
          </div>
        ) : (
          <ScrollableListContainer>
            <div className="space-y-3 pr-2">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {request.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Grade {request.grade_level}
                        {request.stream && ` (${request.stream})`}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {request.teacher.full_name || `${request.teacher.first_name} ${request.teacher.last_name}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Requested</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(request.requested_at)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {request.review_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Review Notes:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{request.review_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollableListContainer>
        )}
      </div>
    </Card>
  );
};

export default StudentEnrollmentManager;

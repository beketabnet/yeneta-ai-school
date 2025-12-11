import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { apiService } from '../../services/apiService';
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons/Icons';

interface ApprovedCourse {
  id: number;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
  };
  subject: string;
  grade_level: string;
  stream?: string;
}

interface EnrollmentRequest {
  id: number;
  course: ApprovedCourse;
  student: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  status: 'pending' | 'approved' | 'declined';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Parent {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  family_id: number;
  family_name: string;
}

const StudentCourseEnrollment: React.FC = () => {
  const [approvedCourses, setApprovedCourses] = useState<ApprovedCourse[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coursesResponse, requestsResponse, parentsResponse] = await Promise.all([
        apiService.get('/academics/approved-teacher-courses/'),
        apiService.get('/academics/my-enrollment-requests/'),
        apiService.get('/academics/student-parents/')
      ]);
      setApprovedCourses(coursesResponse.data || []);
      setEnrollmentRequests(requestsResponse.data || []);
      setParents(parentsResponse.data || []);
      
      // Set default parent if only one exists
      const parentsList = parentsResponse.data || [];
      if (parentsList.length === 1) {
        setSelectedParent(parentsList[0].id);
        setSelectedFamily(parentsList[0].family_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setApprovedCourses([
        {
          id: 1,
          teacher: { id: 1, first_name: 'John', last_name: 'Doe' },
          subject: 'Mathematics',
          grade_level: '10'
        },
        {
          id: 2,
          teacher: { id: 2, first_name: 'Jane', last_name: 'Smith' },
          subject: 'Physics',
          grade_level: '10',
          stream: 'Natural Science'
        }
      ]);
      setEnrollmentRequests([]);
      setParents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `${Date.now()}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const requestEnrollment = async (courseId: number) => {
    if (parents.length > 0 && !selectedParent) {
      addNotification('Please select a parent before requesting enrollment', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        course: courseId
      };
      
      if (selectedFamily) {
        payload.family = selectedFamily;
      }

      await apiService.post('/academics/student-enrollment-requests/', payload);
      addNotification('Enrollment request submitted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error requesting enrollment:', error);
      addNotification('Failed to submit enrollment request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasRequestedCourse = (courseId: number) => {
    return enrollmentRequests.some(req => req.course.id === courseId);
  };

  const getRequestStatus = (courseId: number) => {
    const request = enrollmentRequests.find(req => req.course.id === courseId);
    return request?.status;
  };

  const filteredRequests = filter === 'all'
    ? enrollmentRequests
    : enrollmentRequests.filter(req => req.status === filter);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-full">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg shadow-lg text-white animate-in slide-in-from-right ${
              notif.type === 'success' ? 'bg-green-500' :
              notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Approved Courses */}
      <Card title="Available Courses">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {approvedCourses.length} approved course(s) available
            </p>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:bg-gray-400"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {parents.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Parent/Guardian
              </label>
              <select
                value={selectedParent || ''}
                onChange={(e) => {
                  const parentId = parseInt(e.target.value);
                  const parent = parents.find(p => p.id === parentId);
                  setSelectedParent(parentId);
                  if (parent) {
                    setSelectedFamily(parent.family_id);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Choose a parent --</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.first_name} {parent.last_name} ({parent.family_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading && !approvedCourses.length && (
            <p className="text-center py-8 text-gray-500">Loading available courses...</p>
          )}

          {!isLoading && approvedCourses.length === 0 && (
            <p className="text-center py-8 text-gray-500">No approved courses available at the moment.</p>
          )}

          {approvedCourses.length > 0 && (
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedCourses.map(course => {
                  const hasRequested = hasRequestedCourse(course.id);
                  const requestStatus = getRequestStatus(course.id);

                  return (
                    <div
                      key={course.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {course.subject}
                        </h3>
                        <AcademicCapIcon className="h-5 w-5 text-primary" />
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Teacher: <strong>{course.teacher.first_name} {course.teacher.last_name}</strong>
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Grade {course.grade_level} {course.stream && `(${course.stream})`}
                      </p>

                      {hasRequested ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                          {getStatusIcon(requestStatus)}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(requestStatus)}`}>
                            {requestStatus?.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => requestEnrollment(course.id)}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition-colors font-medium"
                        >
                          Request Enrollment
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enrollment Requests */}
      <Card title="My Enrollment Requests">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'declined'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              {enrollmentRequests.length === 0 ? 'No enrollment requests yet.' : 'No requests with this status.'}
            </p>
          )}

          {filteredRequests.length > 0 && (
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(request => (
                      <tr key={request.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {request.course.subject}
                        </td>
                        <td className="px-4 py-3">
                          {request.course.teacher.first_name} {request.course.teacher.last_name}
                        </td>
                        <td className="px-4 py-3">
                          {request.course.grade_level}
                          {request.course.stream && ` (${request.course.stream})`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(request.requested_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StudentCourseEnrollment;

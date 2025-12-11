import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, ClockIcon, PlusIcon, SearchIcon, UserCircleIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import FamilySelector from './FamilySelector';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface ApprovedCourse {
  id: number;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    full_name?: string;
  };
  subject: string;
  grade_level: string;
  stream?: string;
}

interface EnrollmentRequest {
  id: number;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    full_name?: string;
  };
  subject: string;
  grade_level: string;
  stream?: string;
  status: 'pending' | 'approved' | 'declined' | 'under_review';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

const AvailableCourses: React.FC = () => {
  const { addNotification } = useNotification();
  const [courses, setCourses] = useState<ApprovedCourse[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingCourseId, setSubmittingCourseId] = useState<number | null>(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<ApprovedCourse | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coursesResponse, requestsResponse] = await Promise.all([
        apiService.get('/academics/approved-teacher-courses/'),
        apiService.get('/academics/my-enrollment-requests/')
      ]);
      setCourses(Array.isArray(coursesResponse) ? coursesResponse : []);
      setEnrollmentRequests(Array.isArray(requestsResponse) ? requestsResponse : []);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Failed to load available courses', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Auto-refresh hook
  useAutoRefresh({
    interval: 15000, // 15 seconds
    enabled: autoRefreshEnabled,
    onRefresh: loadData
  });

  useEffect(() => {
    loadData();

    const handleCourseApproved = () => {
      console.log('Course approved event received, reloading available courses...');
      loadData();
    };

    const subscription = eventService.subscribe(EVENTS.COURSE_REQUEST_APPROVED, handleCourseApproved);

    return () => {
      subscription();
    };
  }, [loadData]);

  const isAlreadyRequested = (course: ApprovedCourse) => {
    return enrollmentRequests.some(req =>
      req.teacher.id === course.teacher.id &&
      req.subject === course.subject &&
      req.grade_level === course.grade_level &&
      req.stream === course.stream
    );
  };

  const getRequestStatus = (course: ApprovedCourse) => {
    const request = enrollmentRequests.find(req =>
      req.teacher.id === course.teacher.id &&
      req.subject === course.subject &&
      req.grade_level === course.grade_level &&
      req.stream === course.stream
    );
    return request?.status;
  };

  const requestEnrollment = async (course: ApprovedCourse, familyId?: number) => {
    const familyToUse = familyId || selectedFamily;
    if (!familyToUse) {
      addNotification('Please select a family before requesting enrollment', 'error');
      return;
    }

    setSubmittingCourseId(course.id);
    setIsSubmitting(true);
    try {
      const response = await apiService.submitEnrollmentRequest({
        course: course.id,
        subject: course.subject,
        grade_level: course.grade_level,
        stream: course.stream,
        family: familyToUse
      });
      addNotification(`Enrollment request for ${course.subject} submitted successfully!`, 'success');
      setShowFamilyModal(false);
      setSelectedCourseForEnrollment(null);

      // Emit event for teacher dashboard to update
      eventService.emit(EVENTS.ENROLLMENT_REQUEST_CREATED, { subject: course.subject, id: response.id });

      await loadData();
    } catch (error: any) {
      console.error('Error requesting enrollment:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to submit enrollment request';
      addNotification(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
      setSubmittingCourseId(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {showFamilyModal && selectedCourseForEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Request Enrollment for {selectedCourseForEnrollment.subject}</h3>
            <FamilySelector onFamilySelected={setSelectedFamily} selectedFamilyId={selectedFamily} required={true} />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowFamilyModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => requestEnrollment(selectedCourseForEnrollment)}
                disabled={!selectedFamily || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Family Selector */}

      {/* Available Courses */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-inner">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Courses</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Discover and enroll in new subjects</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full sm:w-64 transition-all"
              />
            </div>

            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`p-2 rounded-xl transition-all ${autoRefreshEnabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              title={autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            </button>
            <button
              onClick={() => loadData()}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Refresh list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Finding improved courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
              <AcademicCapIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Courses Available</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">There are no approved courses available for enrollment right now. Check back later!</p>
          </div>
        ) : (
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter(course => !isAlreadyRequested(course))
                .filter(course =>
                  searchQuery === '' ||
                  course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  course.teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  course.teacher.username.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(course => (
                  <div
                    key={course.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <AcademicCapIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 transform rotate-12" />
                    </div>

                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                          <AcademicCapIcon className="w-6 h-6" />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Grade {course.grade_level}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.subject}
                      </h3>
                      {course.stream && (
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                          {course.stream} Stream
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-6">
                        <UserCircleIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {course.teacher.full_name || `${course.teacher.first_name} ${course.teacher.last_name}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCourseForEnrollment(course);
                        setShowFamilyModal(true);
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-violet-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-violet-700 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300 flex items-center justify-center gap-2 group-hover:translate-y-0"
                    >
                      <span>Enroll Now</span>
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

              {courses.filter(c => !isAlreadyRequested(c)).length > 0 &&
                courses.filter(c => !isAlreadyRequested(c) && (c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || c.teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    No courses found matching "{searchQuery}"
                  </div>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableCourses;

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { MasterCourse } from '../../types';
import { AcademicCapIcon, PlusIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useTeacherActiveCourses } from '../../hooks/useTeacherActiveCourses';
import { useCurriculum } from '../../hooks/useCurriculum';

interface CourseRequest {
  id: number;
  subject: string;
  grade_level: string;
  stream?: string;
  status: 'pending' | 'approved' | 'declined' | 'under_review' | 'course_ended';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
  master_course?: number;
}

const CourseRequestManager: React.FC = () => {
  const { addNotification } = useNotification();
  const { courses: activeCourses } = useTeacherActiveCourses();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [masterCourses, setMasterCourses] = useState<MasterCourse[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Filters
  const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();
  const [filterRegion, setFilterRegion] = useState('Addis Ababa');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterAvailableSubjects, setFilterAvailableSubjects] = useState<string[]>([]);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsData, coursesData] = await Promise.all([
        apiService.getTeacherCourseRequests(),
        apiService.getMasterCourses()
      ]);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setMasterCourses(Array.isArray(coursesData) ? coursesData.filter(c => c.is_active) : []);
    } catch (err) {
      console.error('Error loading data:', err);
      addNotification('Failed to load data', 'error');
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

    const handleCourseRequestUpdate = () => {
      console.log('Course request update event received, reloading requests...');
      loadData();
    };

    const subscriptions = [
      eventService.subscribe(EVENTS.COURSE_REQUEST_APPROVED, handleCourseRequestUpdate),
      eventService.subscribe(EVENTS.COURSE_REQUEST_DECLINED, handleCourseRequestUpdate),
      eventService.subscribe(EVENTS.COURSE_REQUEST_UNDER_REVIEW, handleCourseRequestUpdate),
    ];

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [loadData]);

  // Fetch subjects for filters
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!filterGrade) {
        setFilterAvailableSubjects([]);
        return;
      }
      try {
        const subjects = await getSubjectsFor(
          filterRegion || undefined,
          filterGrade,
          filterStream || undefined
        );
        setFilterAvailableSubjects(subjects || []);

        // Reset subject if not in new list
        if (filterSubject && subjects && !subjects.includes(filterSubject)) {
          setFilterSubject('');
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        setFilterAvailableSubjects([]);
      }
    };
    fetchSubjects();
  }, [filterRegion, filterGrade, filterStream, getSubjectsFor]);

  const filteredRequests = requests.filter(req => {
    const matchGrade = !filterGrade || req.grade_level === filterGrade.replace('Grade ', ''); // Handle "Grade 10" vs "10" mismatch if any
    // Actually MasterCourse usually has "10", but let's check. 
    // The interface says grade_level: string. 
    // If the data comes from backend as "10", and filter is "Grade 10", we need to normalize.
    // Let's assume backend returns "10" or "Grade 10". 
    // To be safe, let's normalize both to string and check inclusion or equality.

    const reqGrade = req.grade_level.toString();
    const filterGradeVal = filterGrade.replace('Grade ', '');
    const gradeMatch = !filterGrade || reqGrade === filterGradeVal || reqGrade === filterGrade;

    const streamMatch = !filterStream || req.stream === filterStream;
    const subjectMatch = !filterSubject || req.subject === filterSubject;

    return gradeMatch && streamMatch && subjectMatch;
  });

  const isCourseDuplicate = (courseId: number) => {
    const course = masterCourses.find(c => c.id === courseId);
    if (!course) return false;

    // Check if course is already approved (active)
    const isActive = activeCourses.some(
      c =>
        c.subject === course.name &&
        c.grade_level === course.grade_level &&
        (!course.stream || c.stream === course.stream)
    );

    if (isActive) return true;

    // Check if there's a pending request for this course
    const isPending = requests.some(
      req =>
        req.master_course === courseId &&
        req.status === 'pending'
    );

    return isPending;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    const courseId = parseInt(selectedCourseId);
    const selectedCourse = masterCourses.find(c => c.id === courseId);
    if (!selectedCourse) return;

    // Check for duplicates
    if (isCourseDuplicate(courseId)) {
      const errorMsg = 'You have already requested or been approved for this course.';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        master_course: courseId,
        subject: selectedCourse.name,
        grade_level: selectedCourse.grade_level,
        stream: selectedCourse.stream || null,
      };

      const response = await apiService.createTeacherCourseRequest(requestData);
      addNotification(`Course request for ${selectedCourse.name} submitted successfully!`, 'success');
      setShowRequestForm(false);
      setSelectedCourseId('');

      // Emit event for admin dashboard to update
      eventService.emit(EVENTS.COURSE_REQUEST_CREATED, { subject: selectedCourse.name, id: response.id });

      await loadData();
    } catch (err: any) {
      console.error('Failed to submit course request:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to submit course request. Please try again.';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
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

  // Group courses by grade level for better display
  const groupedCourses = masterCourses.reduce((acc, course) => {
    const grade = `Grade ${course.grade_level}`;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(course);
    return acc;
  }, {} as Record<string, MasterCourse[]>);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Course Request Manager</h2>
          </div>
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
              onClick={() => loadData()}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh requests"
            >
              ↻
            </button>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Request Course
            </button>
          </div>
        </div>



        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grade Level
            </label>
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                if (e.target.value !== 'Grade 11' && e.target.value !== 'Grade 12') {
                  setFilterStream('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {gradeLevels.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stream
            </label>
            <select
              value={filterStream}
              onChange={(e) => setFilterStream(e.target.value)}
              disabled={filterGrade !== 'Grade 11' && filterGrade !== 'Grade 12'}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterGrade !== 'Grade 11' && filterGrade !== 'Grade 12' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">All Streams</option>
              {streams.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              disabled={filterAvailableSubjects.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {filterAvailableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Form */}
        {
          showRequestForm && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold mb-4">New Course Request</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Course *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Select a course from the catalog</option>
                    {Object.entries(groupedCourses).sort().map(([grade, courses]) => (
                      <optgroup key={grade} label={`Grade ${grade}`}>
                        {(courses as MasterCourse[]).map(course => (
                          <option key={course.id} value={course.id}>
                            {course.name} ({course.code}) {course.stream ? `- ${course.stream}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a course from the master catalog. If you don't see your course, please contact an administrator.
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedCourseId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )
        }

        {/* Requests List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">My Course Requests</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : (requests || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No course requests found. Click "Request Course" to add one.
            </div>
          ) : (
            <ScrollableListContainer className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="space-y-3 pr-2">
                {filteredRequests.map(request => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {request.subject} - Grade {request.grade_level}
                            {request.stream && ` (${request.stream})`}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Requested on {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                          {request.reviewed_at && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {request.review_notes && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {request.review_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollableListContainer>
          )}
        </div>
      </Card >
    </div >
  );
};

export default CourseRequestManager;
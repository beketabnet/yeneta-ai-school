import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import VerticalSlider from '../common/VerticalSlider';
import { useParentEnrolledSubjectsAnalytics, FilterOptions } from '../../hooks/useParentEnrolledSubjectsAnalytics';
import { useNotification } from '../../contexts/NotificationContext';
import { UserGroupIcon, AcademicCapIcon, UserCircleIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon, TrendingUpIcon, TrendingDownIcon } from '../icons/Icons';

interface Subject {
  id: number;
  subject: string;
  grade_level: string;
  stream?: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  enrolled_date: string;
  status: string;
}

interface Student {
  student_id: number;
  student_name: string;
  subjects: Subject[];
  total_subjects: number;
  active_subjects: number;
}

interface Family {
  family_id: number;
  family_name: string;
  students: Student[];
  total_students: number;
}

interface ParentEnrolledSubjectsEnhancedProps {
  selectedChildId?: number | null;
}

const ParentEnrolledSubjectsEnhanced: React.FC<ParentEnrolledSubjectsEnhancedProps> = ({ selectedChildId }) => {
  const { addNotification } = useNotification();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/academics/parent-enrolled-subjects/');
      const familiesData = Array.isArray(response) ? response : [];

      // Enhance data with statistics
      const enhancedFamilies = familiesData.map((family: any) => ({
        ...family,
        total_students: family.students?.length || 0,
        students: family.students?.map((student: any) => ({
          ...student,
          total_subjects: student.subjects?.length || 0,
          active_subjects: student.subjects?.filter((s: any) => s.status === 'active').length || 0
        })) || []
      }));

      setFamilies(enhancedFamilies);

      // Auto-select logic
      if (selectedChildId) {
        for (const family of enhancedFamilies) {
          const student = family.students?.find((s: any) => s.student_id === selectedChildId);
          if (student) {
            setSelectedFamily(family.family_id);
            setSelectedStudent(selectedChildId);
            break;
          }
        }
      } else if (enhancedFamilies.length > 0) {
        const firstFamily = enhancedFamilies[0];
        setSelectedFamily(firstFamily.family_id);
        if (firstFamily.students && firstFamily.students.length > 0) {
          setSelectedStudent(firstFamily.students[0].student_id);
        }
      }
    } catch (error) {
      console.error('Error loading enrolled subjects:', error);
      addNotification('Failed to load enrolled subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, selectedChildId]);

  // Auto-refresh hook
  useAutoRefresh({
    interval: 20000,
    enabled: autoRefreshEnabled,
    onRefresh: loadData
  });

  // Listen for enrollment events
  useEffect(() => {
    const unsubscribeApproved = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_APPROVED, () => {
      loadData();
    });
    const unsubscribeDeclined = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_DECLINED, () => {
      loadData();
    });

    return () => {
      unsubscribeApproved();
      unsubscribeDeclined();
    };
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered data based on search
  const filteredFamilies = useMemo(() => {
    if (!searchTerm) return families;

    return families.map(family => ({
      ...family,
      students: family.students?.filter(student =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.subjects?.some(subject =>
          subject.subject.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) || []
    })).filter(family => family.students.length > 0);
  }, [families, searchTerm]);

  const selectedFamilyData = filteredFamilies.find(f => f.family_id === selectedFamily);
  const selectedStudentData = selectedFamilyData?.students.find(s => s.student_id === selectedStudent);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Enrolled Subjects</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive view of all enrolled subjects across your family
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                List
              </button>
            </div>

            {/* Auto-refresh Toggle */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                autoRefreshEnabled
                  ? 'bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-100 hover:bg-green-300 dark:hover:bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
              title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              {autoRefreshEnabled ? '⟳' : '⊘'}
            </button>

            <button
              onClick={() => loadData()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh subjects"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search students or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Family and Student Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Family Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Family
            </label>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredFamilies.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                No families with enrolled subjects found.
              </div>
            ) : filteredFamilies.length <= 5 ? (
              <select
                value={selectedFamily || ''}
                onChange={(e) => {
                  const familyId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedFamily(familyId);
                  if (familyId) {
                    const family = filteredFamilies.find(f => f.family_id === familyId);
                    if (family && family.students.length > 0) {
                      setSelectedStudent(family.students[0].student_id);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Family</option>
                {filteredFamilies.map(family => (
                  <option key={family.family_id} value={family.family_id}>
                    {family.family_name} ({family.total_students} students)
                  </option>
                ))}
              </select>
            ) : (
              <VerticalSlider
                items={filteredFamilies.map(f => ({
                  id: f.family_id,
                  label: `${f.family_name} (${f.total_students} students)`
                }))}
                selectedId={selectedFamily}
                onSelect={(item) => {
                  setSelectedFamily(item.id as number);
                  const family = filteredFamilies.find(f => f.family_id === item.id);
                  if (family && family.students.length > 0) {
                    setSelectedStudent(family.students[0].student_id);
                  }
                }}
                maxVisibleItems={5}
                className="w-full"
              />
            )}
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Student
            </label>
            {selectedFamilyData && selectedFamilyData.students.length > 0 ? (
              selectedFamilyData.students.length <= 5 ? (
                <select
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Student</option>
                  {selectedFamilyData.students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.student_name} ({student.total_subjects} subjects)
                    </option>
                  ))}
                </select>
              ) : (
                <VerticalSlider
                  items={selectedFamilyData.students.map(s => ({
                    id: s.student_id,
                    label: `${s.student_name} (${s.total_subjects} subjects)`
                  }))}
                  selectedId={selectedStudent}
                  onSelect={(item) => setSelectedStudent(item.id as number)}
                  maxVisibleItems={5}
                  className="w-full"
                />
              )
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                No students in selected family.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Student Subjects Display */}
      {selectedStudentData && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedStudentData.student_name}'s Subjects
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedStudentData.active_subjects} active • {selectedStudentData.total_subjects} total subjects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrollment Progress</p>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${selectedStudentData.total_subjects > 0 ? (selectedStudentData.active_subjects / selectedStudentData.total_subjects) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {selectedStudentData.subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No enrolled subjects for this student.</p>
              <p className="text-sm mt-1">Subjects will appear here once enrolled.</p>
            </div>
          ) : (
            <ScrollableListContainer maxHeight="max-h-[600px]">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                  {selectedStudentData.subjects.map(subject => (
                    <div
                      key={subject.id}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-all bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {subject.subject}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Grade {subject.grade_level}
                            {subject.stream && ` (${subject.stream})`}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(subject.status)}`}>
                          {subject.status || 'Active'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subject.teacher.first_name} {subject.teacher.last_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Enrolled: {formatDate(subject.enrolled_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {selectedStudentData.subjects.map(subject => (
                    <div
                      key={subject.id}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-all bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {subject.subject}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Grade {subject.grade_level}
                              {subject.stream && ` (${subject.stream})`} •
                              {subject.teacher.first_name} {subject.teacher.last_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enrolled: {formatDate(subject.enrolled_date)}
                            </p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(subject.status)}`}>
                              {subject.status || 'Active'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollableListContainer>
          )}
        </Card>
      )}
    </div>
  );
};

export default ParentEnrolledSubjectsEnhanced;
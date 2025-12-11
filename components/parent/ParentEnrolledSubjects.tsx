import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import { UserGroupIcon, AcademicCapIcon, UserCircleIcon } from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

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
}

interface Student {
  student_id: number;
  student_name: string;
  subjects: Subject[];
}

interface Family {
  family_id: number;
  family_name: string;
  students: Student[];
}

interface ParentEnrolledSubjectsProps {
  selectedChildId?: number | null;
}

const ParentEnrolledSubjects: React.FC<ParentEnrolledSubjectsProps> = ({ selectedChildId }) => {
  const { addNotification } = useNotification();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/academics/parent-enrolled-subjects/');
      const families = Array.isArray(response) ? response : [];
      setFamilies(families);
      
      // If selectedChildId is provided, use it; otherwise auto-select first
      if (selectedChildId) {
        // Find the family and student that contains this child
        for (const family of families) {
          const student = family.students?.find(s => s.student_id === selectedChildId);
          if (student) {
            setSelectedFamily(family.family_id);
            setSelectedStudent(selectedChildId);
            break;
          }
        }
      } else if (families && families.length > 0) {
        const firstFamily = families[0];
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
    interval: 20000, // 20 seconds
    enabled: autoRefreshEnabled,
    onRefresh: loadData
  });

  // Listen for enrollment approval events and grade updates
  useEffect(() => {
    const unsubscribeApproved = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_APPROVED, () => {
      loadData();
    });

    const unsubscribeDeclined = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_DECLINED, () => {
      loadData();
    });

    const unsubscribeGradeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      loadData();
    });

    return () => {
      unsubscribeApproved();
      unsubscribeDeclined();
      unsubscribeGradeUpdated();
    };
  }, [loadData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedFamilyData = families.find(f => f.family_id === selectedFamily);
  const selectedStudentData = selectedFamilyData?.students.find(s => s.student_id === selectedStudent);

  return (
    <div className="space-y-6">
      {/* Family and Student Selection */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Enrolled Subjects</h2>
          </div>
          <div className="flex items-center gap-2">
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
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh subjects"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Family Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Family
            </label>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : families.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                No families with enrolled subjects found.
              </div>
            ) : (
              <div className="space-y-2">
                {families.map(family => (
                  <button
                    key={family.family_id}
                    onClick={() => {
                      setSelectedFamily(family.family_id);
                      if (family.students.length > 0) {
                        setSelectedStudent(family.students[0].student_id);
                      }
                    }}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedFamily === family.family_id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {family.family_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {family.students.length} student{family.students.length !== 1 ? 's' : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Student
            </label>
            {selectedFamilyData && selectedFamilyData.students.length > 0 ? (
              <div className="space-y-2">
                {selectedFamilyData.students.map(student => (
                  <button
                    key={student.student_id}
                    onClick={() => setSelectedStudent(student.student_id)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedStudent === student.student_id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="h-4 w-4" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {student.student_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {student.subjects.length} subject{student.subjects.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                No students in selected family.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Enrolled Subjects */}
      {selectedStudentData && (
        <Card>
          <div className="flex items-center mb-6">
            <AcademicCapIcon className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {selectedStudentData.student_name}'s Subjects
            </h2>
          </div>

          {selectedStudentData.subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No enrolled subjects for this student.
            </div>
          ) : (
            <ScrollableListContainer>
              <div className="grid gap-4 pr-2">
                {selectedStudentData.subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {subject.subject}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Grade {subject.grade_level}
                          {subject.stream && ` (${subject.stream})`}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {subject.teacher.first_name} {subject.teacher.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          @{subject.teacher.username}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Date</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(subject.enrolled_date)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        <div className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-semibold">
                          Enrolled
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollableListContainer>
          )}
        </Card>
      )}
    </div>
  );
};

export default ParentEnrolledSubjects;

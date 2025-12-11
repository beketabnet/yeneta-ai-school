import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/apiService';
import eventService, { EVENTS } from '../../services/eventService';
import GradeAssignmentModal from './GradeAssignmentModal';
import Card from '../Card';
import { ArrowPathIcon, BookOpenIcon } from '../icons/Icons';

interface EnrolledSubject {
  subject_id: number;
  subject_name: string;
  grade_level: number;
  student_id: number;
  student_name: string;
  enrollment_date: string;
  average_score?: number;
  total_grades?: number;
}

interface StudentGrade {
  id: number;
  student_id: number;
  subject: string;
  score: number;
  max_score: number;
  assignment_type?: string;
  exam_type?: string;
  feedback?: string;
  created_at: string;
}

const GradeEntryTable: React.FC = () => {
  console.log('[GradeEntryTable] Component mounted');
  const { addNotification } = useNotification();
  const [subjects, setSubjects] = useState<EnrolledSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<EnrolledSubject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentGrades, setStudentGrades] = useState<Map<number, StudentGrade[]>>(new Map());
  
  console.log('[GradeEntryTable] State initialized:', { isLoading, error, subjectsCount: subjects.length });

  const loadSubjects = useCallback(async () => {
    console.log('[GradeEntryTable] loadSubjects called');
    setIsLoading(true);
    setError(null);
    try {
      console.log('[GradeEntryTable] Calling apiService.getTeacherEnrolledSubjects()');
      const data = await apiService.getTeacherEnrolledSubjects();
      console.log('[GradeEntryTable] API response:', data);
      if (Array.isArray(data)) {
        console.log('[GradeEntryTable] Data is array, setting subjects:', data.length, 'items');
        setSubjects(data);
      } else {
        console.warn('[GradeEntryTable] Expected array from getTeacherEnrolledSubjects, got:', data);
        setSubjects([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subjects';
      console.error('[GradeEntryTable] Error loading subjects:', err);
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      setSubjects([]);
    } finally {
      console.log('[GradeEntryTable] loadSubjects finished');
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    console.log('[GradeEntryTable] useEffect running');
    loadSubjects();
    console.log('[GradeEntryTable] Subscribing to events');
    const unsubscribe = eventService.subscribe(EVENTS.GRADE_CREATED, loadSubjects);
    const unsubscribe2 = eventService.subscribe(EVENTS.GRADE_UPDATED, loadSubjects);
    const unsubscribe3 = eventService.subscribe(EVENTS.GRADE_DELETED, loadSubjects);
    return () => {
      console.log('[GradeEntryTable] useEffect cleanup');
      unsubscribe();
      unsubscribe2();
      unsubscribe3();
    };
  }, [loadSubjects]);

  const handleAddGrade = (subject: EnrolledSubject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleGradeSubmit = async (gradeData: any) => {
    setIsSubmitting(true);
    try {
      await apiService.createStudentGrade(gradeData);
      addNotification('Grade added successfully', 'success');
      eventService.emit(EVENTS.GRADE_CREATED, { studentId: gradeData.student_id });
      setIsModalOpen(false);
      await loadSubjects();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add grade';
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    loadSubjects();
  };

  if (error && subjects.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Grade Entry</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Refresh subjects"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoading && subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>No enrolled subjects found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Grade Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Requested</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr
                    key={`${subject.subject_id}-${subject.student_id}-${index}`}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{subject.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{subject.subject_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Grade {subject.grade_level}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(subject.enrollment_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleAddGrade(subject)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        Add Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isModalOpen && selectedSubject && (
        <GradeAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleGradeSubmit}
          subject={selectedSubject}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default GradeEntryTable;

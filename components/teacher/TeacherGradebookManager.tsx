import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import GradeRowEditor, { StudentGrade } from './GradeRowEditor';
import GradeFilters from './GradeFilters';
import GradeEntryModal, { GradeFormData } from './GradeEntryModal';
import GradebookStats from './GradebookStats';
import GradebookFiltersEnhanced from './GradebookFiltersEnhanced';
import { useTeacherEnrolledStudents, EnrolledStudent } from '../../hooks/useTeacherEnrolledStudents';
import { apiService } from '../../services/apiService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { AcademicCapIcon, PlusIcon, ArrowPathIcon } from '../icons/Icons';

const TeacherGradebookManager: React.FC = () => {
  const { addNotification } = useNotification();
  const { students: enrolledStudents, isLoading: studentsLoading } = useTeacherEnrolledStudents();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedAssignmentType, setSelectedAssignmentType] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [deletingGradeId, setDeletingGradeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Get unique subjects from enrolled students
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    if (Array.isArray(enrolledStudents)) {
      enrolledStudents.forEach(student => {
        if (student && Array.isArray(student.subjects)) {
          student.subjects.forEach(subject => {
            if (subject && subject.subject) {
              subjects.add(subject.subject);
            }
          });
        }
      });
    }
    return Array.from(subjects).sort();
  }, [enrolledStudents]);

  // Get students for selected subject
  const studentsForSubject = useMemo(() => {
    if (!selectedSubject || !Array.isArray(enrolledStudents)) return [];
    return enrolledStudents.filter(student =>
      student && Array.isArray(student.subjects) && 
      student.subjects.some(s => s && s.subject === selectedSubject)
    );
  }, [enrolledStudents, selectedSubject]);

  const loadGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gradeData, statsData] = await Promise.all([
        apiService.getStudentGradesBySubject(
          selectedSubject || '',
          selectedStudentId || undefined,
          selectedAssignmentType || undefined,
          selectedExamType || undefined
        ),
        apiService.getGradeStatistics()
      ]);
      setGrades(Array.isArray(gradeData) ? gradeData : []);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading grades:', err);
      addNotification('Failed to load grades', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedStudentId, selectedAssignmentType, selectedExamType, addNotification]);

  useAutoRefresh({
    interval: 15000,
    enabled: autoRefreshEnabled,
    onRefresh: loadGrades
  });

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  // Listen for grade events
  useEffect(() => {
    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, () => {
      loadGrades();
    });

    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      loadGrades();
    });

    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, () => {
      loadGrades();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [loadGrades]);

  const handleDeleteGrade = async (gradeId: number) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        setDeletingGradeId(gradeId);
        await apiService.deleteStudentGrade(gradeId);
        addNotification('Grade deleted successfully', 'success');
        eventService.emit(EVENTS.GRADE_DELETED, { gradeId });
        await loadGrades();
      } catch (err) {
        console.error('Error deleting grade:', err);
        addNotification('Failed to delete grade', 'error');
      } finally {
        setDeletingGradeId(null);
      }
    }
  };

  const handleUpdateGradeInline = async (gradeId: number, updatedData: Partial<StudentGrade>) => {
    try {
      await apiService.updateStudentGrade(gradeId, updatedData);
      addNotification('Grade updated successfully', 'success');
      eventService.emit(EVENTS.GRADE_UPDATED, { gradeId });
      await loadGrades();
    } catch (err) {
      console.error('Error updating grade:', err);
      addNotification('Failed to update grade', 'error');
    }
  };

  const handleAddGrade = async (formData: GradeFormData) => {
    setIsSubmittingGrade(true);
    try {
      await apiService.createStudentGrade(formData);
      addNotification('Grade added successfully', 'success');
      eventService.emit(EVENTS.GRADE_CREATED, { studentId: formData.student_id });
      await loadGrades();
    } catch (err) {
      console.error('Error adding grade:', err);
      addNotification('Failed to add grade', 'error');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📊 Gradebook Manager</h2>
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
              onClick={() => loadGrades()}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              title="Refresh gradebook"
            >
              <ArrowPathIcon className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <GradebookStats
        totalStudents={enrolledStudents?.length || 0}
        totalGrades={grades.length}
        averageScore={stats?.average_score || null}
        pendingEntries={stats ? (stats.total_grades - grades.length) : 0}
        completedEntries={grades.length}
        isLoading={isLoading}
      />

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Grade Entry</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Add new grade"
          >
            <PlusIcon className="h-5 w-5" />
            Add Grade
          </button>
        </div>

        {/* Subject and Student Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Subject Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              aria-label="Select subject"
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedStudentId(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject...</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student
            </label>
            <select
              aria-label="Select student"
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedSubject || studentsLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All students</option>
              {studentsForSubject.map(student => (
                <option key={student.student_id} value={student.student_id}>
                  {student.student_name} (Grade {student.grade_level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grade Type Filters */}
        {selectedSubject && (
          <div className="mb-6">
            <GradeFilters
              assignmentType={selectedAssignmentType}
              examType={selectedExamType}
              onAssignmentTypeChange={setSelectedAssignmentType}
              onExamTypeChange={setSelectedExamType}
            />
          </div>
        )}

        {/* Grades Table */}
        {isLoading && grades.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !selectedSubject ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">Select a subject to view grades</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No grades found for this selection</p>
          </div>
        ) : (
          <ScrollableListContainer className="border border-gray-300 dark:border-gray-600 rounded-lg">
            <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Student
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Subject
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Percentage
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Feedback
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <GradeRowEditor
                    key={grade.id}
                    grade={grade}
                    onEdit={() => {}}
                    onDelete={handleDeleteGrade}
                    onUpdate={handleUpdateGradeInline}
                    isDeleting={deletingGradeId === grade.id}
                  />
                ))}
              </tbody>
            </table>
          </ScrollableListContainer>
        )}

        {/* Grade Entry Modal */}
        <GradeEntryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddGrade}
          enrolledStudents={enrolledStudents}
          isSubmitting={isSubmittingGrade}
        />
      </Card>
    </div>
  );
};

export default TeacherGradebookManager;

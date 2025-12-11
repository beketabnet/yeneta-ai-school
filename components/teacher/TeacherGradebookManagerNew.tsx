import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import GradeInputModal from '../common/GradeInputModal';
import GradeFilterBar from '../common/GradeFilterBar';
import { apiService } from '../../services/apiService';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import { AcademicCapIcon, PencilIcon, TrashIcon, PlusIcon } from '../icons/Icons';

interface GradebookFilters {
  subject: string;
  student_id: number | null;
  assignment_type: string;
  exam_type: string;
}

interface StudentGrade {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  graded_at: string;
}

const ASSIGNMENT_TYPES = [
  'Quiz', 'Assignment', 'Homework', 'Project', 'Lab Report',
  'Presentation', 'Group Work', 'Essay', 'Critical Analysis'
];

const EXAM_TYPES = ['Quiz', 'Mid Exam', 'Final Exam'];

const TeacherGradebookManager: React.FC = () => {
  const { addNotification } = useNotification();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
  const [deletingGradeId, setDeletingGradeId] = useState<number | null>(null);
  const [filters, setFilters] = useState<GradebookFilters>({
    subject: '',
    student_id: null,
    assignment_type: '',
    exam_type: ''
  });

  const loadGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getStudentGradesBySubject(
        filters.subject || '',
        filters.student_id || undefined,
        filters.assignment_type || undefined,
        filters.exam_type || undefined
      );
      setGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading grades:', err);
      addNotification('Failed to load grades', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, addNotification]);

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

  const handleAddGrade = () => {
    setEditingGrade(null);
    setShowModal(true);
  };

  const handleEditGrade = (grade: StudentGrade) => {
    setEditingGrade(grade);
    setShowModal(true);
  };

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

  const handleSubmitGrade = async (gradeData: any) => {
    try {
      if (editingGrade) {
        await apiService.updateStudentGrade(editingGrade.id, {
          ...gradeData,
          student: editingGrade.student_id,
          subject: editingGrade.subject
        });
        addNotification('Grade updated successfully', 'success');
        eventService.emit(EVENTS.GRADE_UPDATED, { gradeId: editingGrade.id });
      } else {
        // Need student_id and subject for new grades
        // This should be passed from parent or selected in modal
        addNotification('Please select a student and subject', 'error');
      }
      await loadGrades();
    } catch (err) {
      console.error('Error saving grade:', err);
      addNotification('Failed to save grade', 'error');
    }
  };

  const uniqueSubjects = [...new Set(grades.map(g => g.subject))].sort();
  const uniqueStudents = [...new Map(grades.map(g => [g.student_id, { id: g.student_id, name: g.student_name }])).values()];
  const filteredGrades = grades.filter(grade => {
    if (filters.subject && grade.subject !== filters.subject) return false;
    if (filters.student_id && grade.student_id !== filters.student_id) return false;
    if (filters.assignment_type && grade.assignment_type !== filters.assignment_type) return false;
    if (filters.exam_type && grade.exam_type !== filters.exam_type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gradebook Manager</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddGrade}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
              title="Add new grade"
            >
              <PlusIcon className="h-4 w-4" />
              Add Grade
            </button>
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
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Refresh gradebook"
            >
              ↻
            </button>
          </div>
        </div>

        <GradeFilterBar
          subjects={uniqueSubjects}
          students={uniqueStudents}
          assignmentTypes={ASSIGNMENT_TYPES}
          examTypes={EXAM_TYPES}
          filters={filters}
          onFilterChange={setFilters}
        />

        {isLoading && grades.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No grades found. {grades.length === 0 ? 'Click "Add Grade" to create one.' : 'Try adjusting your filters.'}
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
                {filteredGrades.map(grade => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {grade.student_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {grade.subject}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                        {grade.assignment_type || grade.exam_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {grade.score}/{grade.max_score}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {grade.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                      {grade.feedback || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditGrade(grade)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        title="Edit grade"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGrade(grade.id)}
                        disabled={deletingGradeId === grade.id}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
                        title="Delete grade"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableListContainer>
        )}
      </Card>

      <GradeInputModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitGrade}
        initialData={editingGrade}
        studentName={editingGrade?.student_name}
        subject={editingGrade?.subject}
      />
    </div>
  );
};

export default TeacherGradebookManager;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../Card';
import GradebookHeader from './GradebookHeader';
import GradebookFilterPanel from './GradebookFilterPanel';
import GradebookTable, { GradeRow } from './GradebookTable';
import GradeEntryModal from '../GradeEntryModal';
import { useTeacherEnrolledStudents, EnrolledStudent } from '../../../hooks/useTeacherEnrolledStudents';
import { apiService } from '../../../services/apiService';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import { useNotification } from '../../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../../services/eventService';
import { PlusIcon } from '../../icons/Icons';

const TeacherGradebookManagerEnhanced: React.FC = () => {
  const { addNotification } = useNotification();
  const { students: enrolledStudents, isLoading: studentsLoading, error: studentsError } = useTeacherEnrolledStudents();

  // Debug logging
  useEffect(() => {
    console.log('Enrolled Students Data:', {
      count: enrolledStudents.length,
      isLoading: studentsLoading,
      error: studentsError,
      data: enrolledStudents,
    });
  }, [enrolledStudents, studentsLoading, studentsError]);

  // State
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedAssignmentType, setSelectedAssignmentType] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingCardData, setEditingCardData] = useState<Partial<GradeRow>>({});
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

  // Computed values
  const uniqueSubjects = useMemo(() => {
    console.log('Computing subjects from enrolledStudents:', enrolledStudents);
    const subjects = new Set<string>();
    if (Array.isArray(enrolledStudents) && enrolledStudents.length > 0) {
      enrolledStudents.forEach((student) => {
        if (student) {
          // Try subjects first, then fall back to courses
          const subjectsArray = student.subjects || student.courses || [];
          if (Array.isArray(subjectsArray) && subjectsArray.length > 0) {
            subjectsArray.forEach((subject) => {
              if (subject && subject.subject) {
                subjects.add(subject.subject);
              }
            });
          }
        }
      });
    }
    const result = Array.from(subjects).sort();
    console.log('Computed subjects:', result);
    return result;
  }, [enrolledStudents]);

  const studentsForSubject = useMemo(() => {
    if (!selectedSubject || !Array.isArray(enrolledStudents)) return [];
    return enrolledStudents.filter((student) => {
      if (!student) return false;
      // Try subjects first, then fall back to courses
      const subjectsArray = student.subjects || student.courses || [];
      return (
        Array.isArray(subjectsArray) &&
        subjectsArray.some((s) => s && s.subject === selectedSubject)
      );
    });
  }, [enrolledStudents, selectedSubject]);

  // Statistics
  const statistics = useMemo(() => {
    return {
      totalGrades: grades.length,
      totalStudents: new Set(grades.map((g) => g.student_name)).size,
      totalSubjects: new Set(grades.map((g) => g.subject)).size,
      averageGrade:
        grades.length > 0 ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length : null,
    };
  }, [grades]);

  // Filtered grades
  const filteredGrades = useMemo(() => {
    let result = [...grades];

    // Filter by subject first (always applied if subject selected)
    if (selectedSubject) {
      result = result.filter((g) => g.subject === selectedSubject);
    }

    // Filter by selected student
    if (selectedStudent) {
      result = result.filter((g) => {
        // Try to find student by student_id in grades (if available)
        if (g.student_id !== undefined) {
          return g.student_id === selectedStudent;
        }
        // Fallback: match by student_name
        const student = enrolledStudents.find((s) => s.student_id === selectedStudent);
        return student && student.student_name === g.student_name;
      });
    }

    if (selectedAssignmentType) {
      result = result.filter((g) => g.assignment_type === selectedAssignmentType);
    }

    if (selectedExamType) {
      result = result.filter((g) => g.exam_type === selectedExamType);
    }

    if (searchTerm) {
      result = result.filter(
        (g) =>
          g.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.feedback.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [grades, selectedSubject, selectedStudent, selectedAssignmentType, selectedExamType, searchTerm, enrolledStudents]);

  // Load grades
  const loadGrades = useCallback(async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    try {
      const data = await apiService.getStudentGradesBySubject(
        selectedSubject,
        selectedStudent || undefined,
        selectedAssignmentType || undefined,
        selectedExamType || undefined
      );
      setGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading grades:', err);
      addNotification('Failed to load grades', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedStudent, selectedAssignmentType, selectedExamType, addNotification]);

  // Auto-refresh
  useAutoRefresh({
    interval: 15000,
    enabled: autoRefreshEnabled,
    onRefresh: loadGrades,
  });

  // Load grades on mount and when subject changes
  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  // Event listeners
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

  // Handlers
  const handleAddGrade = async (formData: any) => {
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

  const handleUpdateGrade = async (gradeId: number, updatedData: Partial<GradeRow>) => {
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

  const handleDeleteGrade = async (gradeId: number) => {
    try {
      await apiService.deleteStudentGrade(gradeId);
      addNotification('Grade deleted successfully', 'success');
      eventService.emit(EVENTS.GRADE_DELETED, { gradeId });
      await loadGrades();
    } catch (err) {
      console.error('Error deleting grade:', err);
      addNotification('Failed to delete grade', 'error');
    }
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setSelectedAssignmentType('');
    setSelectedExamType('');
    setSearchTerm('');
  };

  const handleCardEditStart = (grade: GradeRow) => {
    setEditingCardId(grade.id);
    setEditingCardData({
      score: grade.score,
      feedback: grade.feedback,
    });
  };

  const handleCardEditSave = async (gradeId: number) => {
    try {
      await handleUpdateGrade(gradeId, editingCardData);
      setEditingCardId(null);
      setEditingCardData({});
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const handleCardEditCancel = () => {
    setEditingCardId(null);
    setEditingCardData({});
  };

  const handleCardDelete = async (gradeId: number) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      setDeletingCardId(gradeId);
      try {
        await handleDeleteGrade(gradeId);
        setDeletingCardId(null);
      } catch (error) {
        console.error('Error deleting grade:', error);
        setDeletingCardId(null);
      }
    }
  };

  // Show loading or error state
  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading enrolled students...</p>
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-300">Error: {studentsError}</p>
      </div>
    );
  }

  if (enrolledStudents.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-300">No enrolled students found. Please enroll in courses first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <GradebookHeader
        totalGrades={statistics.totalGrades}
        totalStudents={statistics.totalStudents}
        totalSubjects={statistics.totalSubjects}
        averageGrade={statistics.averageGrade}
      />

      {/* Main Card */}
      <Card>
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
              ↻
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            title="Add new grade"
          >
            <PlusIcon className="h-5 w-5" />
            Add Grade
          </button>
        </div>

        {/* Filter Panel */}
        <GradebookFilterPanel
          subjects={uniqueSubjects}
          students={studentsForSubject.map((s) => ({
            id: s.student_id,
            name: s.student_name,
            grade: s.grade_level,
          }))}
          selectedSubject={selectedSubject}
          selectedStudent={selectedStudent}
          selectedAssignmentType={selectedAssignmentType}
          selectedExamType={selectedExamType}
          viewMode={viewMode}
          searchTerm={searchTerm}
          onSubjectChange={(subject) => {
            setSelectedSubject(subject);
            setSelectedStudent(null);
          }}
          onStudentChange={setSelectedStudent}
          onAssignmentTypeChange={setSelectedAssignmentType}
          onExamTypeChange={setSelectedExamType}
          onViewModeChange={setViewMode}
          onSearchChange={setSearchTerm}
          onReset={handleReset}
        />

        {/* Grades Display */}
        <div className="mt-6">
          {viewMode === 'table' ? (
            <GradebookTable
              grades={filteredGrades}
              isLoading={isLoading}
              onEdit={handleUpdateGrade}
              onDelete={handleDeleteGrade}
              selectedSubject={selectedSubject}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGrades.map((grade) => (
                <div
                  key={grade.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${
                    editingCardId === grade.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{grade.student_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{grade.subject}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                      {grade.assignment_type || grade.exam_type || 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                      {editingCardId === grade.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={grade.max_score}
                            step="0.1"
                            aria-label={`Score for ${grade.student_name}`}
                            value={editingCardData.score || grade.score}
                            onChange={(e) => setEditingCardData({ ...editingCardData, score: parseFloat(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <span className="text-gray-600 dark:text-gray-400">/ {grade.max_score}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {grade.score}/{grade.max_score}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Grade:</span>
                      <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                        {(editingCardData.score !== undefined ? (editingCardData.score / grade.max_score) * 100 : grade.percentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {editingCardId === grade.id ? (
                    <input
                      type="text"
                      value={editingCardData.feedback || grade.feedback}
                      onChange={(e) => setEditingCardData({ ...editingCardData, feedback: e.target.value })}
                      placeholder="Add feedback..."
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm mb-4"
                    />
                  ) : (
                    grade.feedback && (
                      <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                        {grade.feedback}
                      </div>
                    )
                  )}

                  <div className="flex gap-2">
                    {editingCardId === grade.id ? (
                      <>
                        <button
                          onClick={() => handleCardEditSave(grade.id)}
                          disabled={isSubmittingGrade}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCardEditCancel}
                          disabled={isSubmittingGrade}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-gray-400 text-white hover:bg-gray-500 rounded transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCardEditStart(grade)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCardDelete(grade.id)}
                          disabled={deletingCardId === grade.id}
                          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Grade Entry Modal */}
      <GradeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddGrade}
        enrolledStudents={enrolledStudents}
        isSubmitting={isSubmittingGrade}
      />
    </div>
  );
};

export default TeacherGradebookManagerEnhanced;

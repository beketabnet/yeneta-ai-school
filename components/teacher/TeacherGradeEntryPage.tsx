import React, { useState } from 'react';
import { useTeacherSubjectGrades } from '../../hooks/useTeacherSubjectGrades';
import { useNotification } from '../../contexts/NotificationContext';
import eventService, { EVENTS } from '../../services/eventService';
import TeacherSubjectsList from './TeacherSubjectsList';
import { apiService } from '../../services/apiService';
import SubjectGradeEntryPanel from './SubjectGradeEntryPanel';
import GradeEntryModal from './GradeEntryModal';
import BulkGradeEntryForm from './BulkGradeEntryForm';
import Card from '../Card';
import { BookOpenIcon, ArrowPathIcon, PlusIcon } from '../icons/Icons';

const TeacherGradeEntryPage: React.FC = () => {
  const { addNotification } = useNotification();
  const {
    subjects,
    selectedSubjectData,
    summary,
    isLoading,
    error,
    selectSubject,
    refetchSubjects,
    refetchSubjectData,
    submitBulkGrades
  } = useTeacherSubjectGrades();

  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  const handleAddGrade = (studentId: number, subjectName: string) => {
    setIsGradeModalOpen(true);
  };

  const handleGradeSubmit = async (gradeData: any) => {
    setIsSubmittingGrade(true);
    try {
      await apiService.createStudentGrade(gradeData);
      addNotification('Grade added successfully', 'success');
      eventService.emit(EVENTS.GRADE_CREATED, { studentId: gradeData.student_id });
      await refetchSubjectData();
      setIsGradeModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add grade';
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const handleBulkSubmit = async (gradesData: any[]) => {
    setIsSubmittingBulk(true);
    try {
      const result = await submitBulkGrades(gradesData);
      addNotification(`${result.created} grades added successfully`, 'success');
      if (result.errors.length > 0) {
        addNotification(`${result.errors.length} grades failed`, 'warning');
      }
      setIsBulkEntryOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit grades';
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleEditGrade = (gradeId: number) => {
    // TODO: Implement edit grade functionality
    addNotification('Edit functionality coming soon', 'info');
  };

  const handleDeleteGrade = async (gradeId: number) => {
    try {
      // TODO: Implement delete grade functionality
      addNotification('Grade deleted successfully', 'success');
      eventService.emit(EVENTS.GRADE_DELETED, { gradeId });
      await refetchSubjectData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete grade';
      addNotification(errorMessage, 'error');
    }
  };

  if (error) {
    return (
      <Card>
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={refetchSubjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Grade Entry</h1>
          </div>
          <button
            onClick={refetchSubjects}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Refresh subjects"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </Card>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Subjects List */}
        <div className="lg:col-span-1">
          <Card title="Enrolled Subjects">
            <TeacherSubjectsList
              subjects={subjects}
              selectedSubjectId={selectedSubjectData?.subject_id || null}
              onSelectSubject={selectSubject}
              isLoading={isLoading}
            />
          </Card>
        </div>

        {/* Main Content: Grade Entry Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <SubjectGradeEntryPanel
              subject={selectedSubjectData}
              isLoading={isLoading}
              onAddGrade={handleAddGrade}
              onEditGrade={handleEditGrade}
              onDeleteGrade={handleDeleteGrade}
            />
          </Card>

          {/* Action Buttons */}
          {selectedSubjectData && selectedSubjectData.students.length > 0 && (
            <Card>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsGradeModalOpen(true)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Single Grade
                </button>
                <button
                  onClick={() => setIsBulkEntryOpen(true)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Bulk Entry ({selectedSubjectData.students.length} students)
                </button>
              </div>
            </Card>
          )}

          {/* Statistics */}
          {summary && (
            <Card title="Subject Statistics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Grades</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.total_grades}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summary.average_score ? summary.average_score.toFixed(1) : 'N/A'}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assignments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.assignment_count}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Exams</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.exam_count}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Grade Entry Modal */}
      <GradeEntryModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        onSubmit={handleGradeSubmit}
        enrolledStudents={selectedSubjectData?.students.map(s => ({
          id: s.student_id, // Map student_id to id
          student_id: s.student_id,
          student_name: s.student_name,
          subjects: [{
            subject: selectedSubjectData.subject_name,
            grade_level: selectedSubjectData.grade_level,
            stream: '' // Stream implicit in this context or can be empty string if optional
          }]
        })) || []}
        isSubmitting={isSubmittingGrade}
        prefilledSubject={selectedSubjectData?.subject_name}
      />

      {/* Bulk Grade Entry Modal */}
      {isBulkEntryOpen && selectedSubjectData && (
        <BulkGradeEntryForm
          subjectName={selectedSubjectData.subject_name}
          gradeLevel={selectedSubjectData.grade_level}
          stream="" // Stream can be empty for now
          students={selectedSubjectData.students.map(s => ({
            student_id: s.student_id,
            student_name: s.student_name
          }))}
          onSubmit={handleBulkSubmit}
          onCancel={() => setIsBulkEntryOpen(false)}
          isSubmitting={isSubmittingBulk}
        />
      )}
    </div>
  );
};

export default TeacherGradeEntryPage;

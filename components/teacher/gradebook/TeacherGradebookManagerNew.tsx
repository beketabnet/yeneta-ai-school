import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../Card';
import { useNotification } from '../../../contexts/NotificationContext';
import { ArrowPathIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';
import GradebookManagerStats from './GradebookManagerStats';
import EnrolledSubjectsTable from './EnrolledSubjectsTable';
import GradeAddingCard from './GradeAddingCard';

interface EnrolledSubject {
  subject_id: number;
  subject_name: string;
  grade_level: string;
  student_count: number;
  average_score?: number;
  students?: Array<{
    student_id: number;
    student_name: string;
    username: string;
  }>;
}

const TeacherGradebookManagerNew: React.FC = () => {
  const { addNotification } = useNotification();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>();
  const [selectedSubjectForGrade, setSelectedSubjectForGrade] = useState<EnrolledSubject | null>(null);
  const [isGradeCardOpen, setIsGradeCardOpen] = useState(false);
  const [dynamicStats, setDynamicStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    gradeCount: 0,
    avgScore: null as number | null,
  });
  const [subjectsWithStudents, setSubjectsWithStudents] = useState<EnrolledSubject[]>([]);

  const updateDynamicStats = useCallback((subjects: EnrolledSubject[]) => {
    const totalStudents = new Set();
    let totalGrades = 0;
    let gradeSum = 0;

    subjects.forEach(subject => {
      if (subject.students) {
        subject.students.forEach(s => totalStudents.add(s.student_id));
      }
      if (subject.average_score != null) {
        totalGrades++;
        gradeSum += subject.average_score;
      }
    });

    setDynamicStats({
      totalStudents: totalStudents.size,
      totalSubjects: subjects.length,
      gradeCount: totalGrades,
      avgScore: totalGrades > 0 ? gradeSum / totalGrades : null,
    });
  }, []);

  const loadSubjectsWithStudents = useCallback(async () => {
    try {
      const response = await apiService.get('/academics/teacher-enrolled-subjects-with-students/');
      if (Array.isArray(response)) {
        setSubjectsWithStudents(response);
        updateDynamicStats(response);
      }
    } catch (error) {
      console.error('Error loading subjects with students:', error);
    }
  }, [updateDynamicStats]);

  useEffect(() => {
    loadSubjectsWithStudents();
  }, [loadSubjectsWithStudents]);

  const handleAddGrade = (subject: EnrolledSubject) => {
    setSelectedSubjectForGrade(subject);
    setSelectedSubject(`${subject.subject_name}_${subject.grade_level}`);
    setIsGradeCardOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSubjectsWithStudents();
      addNotification('Gradebook refreshed successfully', 'success');
    } catch (err) {
      addNotification(
        err instanceof Error ? err.message : 'Failed to refresh gradebook',
        'error'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGradeCardClose = () => {
    setIsGradeCardOpen(false);
    setSelectedSubjectForGrade(null);
  };

  const handleGradeSaved = async () => {
    await loadSubjectsWithStudents();
    addNotification('Grade saved successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gradebook Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track student grades for your subjects
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </Card>


      {/* Dynamic Stats */}
      <GradebookManagerStats
        totalStudents={dynamicStats.totalStudents}
        totalSubjects={dynamicStats.totalSubjects}
        avgScore={dynamicStats.avgScore}
        gradeCount={dynamicStats.gradeCount}
      />

      {/* Enrolled Subjects Table */}
      <EnrolledSubjectsTable
        subjects={subjectsWithStudents}
        isLoading={false}
        onAddGrade={handleAddGrade}
      />

      {/* Grade Adding Card */}
      {selectedSubjectForGrade && (
        <GradeAddingCard
          isOpen={isGradeCardOpen}
          onClose={handleGradeCardClose}
          subjectId={selectedSubjectForGrade.subject_id}
          subjectName={selectedSubjectForGrade.subject_name}
          gradeLevel={selectedSubjectForGrade.grade_level}
          onGradeSaved={handleGradeSaved}
        />
      )}
    </div>
  );
};

export default TeacherGradebookManagerNew;

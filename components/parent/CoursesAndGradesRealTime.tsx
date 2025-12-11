import React, { useMemo, useState, useEffect } from 'react';
import Card from '../Card';
import { useParentEnrolledStudentGrades, EnrolledStudentSubject } from '../../hooks/useParentEnrolledStudentGrades';
import { useNotification } from '../../contexts/NotificationContext';
import { useGradeUpdateListener } from '../../hooks/useRealtimeGradeSync';
import { ArrowPathIcon, ChartBarIcon, AcademicCapIcon, CheckCircleIcon } from '../icons/Icons';

interface CoursesAndGradesRealTimeProps {
  selectedChildId?: number | null;
}

interface GradeStats {
  minScore: number;
  maxScore: number;
  averageScore: number;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}

const CoursesAndGradesRealTime: React.FC<CoursesAndGradesRealTimeProps> = ({ selectedChildId }) => {
  const { addNotification } = useNotification();
  const {
    enrolledSubjects,
    summary,
    isLoading,
    error,
    refetch,
    getStudentGrades,
  } = useParentEnrolledStudentGrades();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addNotification('Grades refreshed successfully', 'success');
    } catch (err) {
      addNotification(
        err instanceof Error ? err.message : 'Failed to refresh grades',
        'error'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for grade updates via real-time sync
  useGradeUpdateListener('parent-grades', async (payload) => {
    await refetch();
  });

  // Filter grades for selected child
  const studentGrades = useMemo(() => {
    if (!selectedChildId) {
      return enrolledSubjects;
    }
    return getStudentGrades(selectedChildId);
  }, [selectedChildId, enrolledSubjects, getStudentGrades]);

  // Calculate stats
  const gradeStats = useMemo(() => {
    if (studentGrades.length === 0) {
      return {
        minScore: 0,
        maxScore: 0,
        averageScore: 0,
        completedCount: 0,
        totalCount: 0,
        completionPercentage: 0,
      };
    }

    const scoresWithGrades = studentGrades.filter(g => g.overall_score !== undefined);
    const scores = scoresWithGrades.map(g => g.overall_score as number);

    return {
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
      completedCount: scoresWithGrades.length,
      totalCount: studentGrades.length,
      completionPercentage: studentGrades.length > 0 ? Math.round((scoresWithGrades.length / studentGrades.length) * 100) : 0,
    };
  }, [studentGrades]);

  // Group by subject
  const gradesBySubject = useMemo(() => {
    const grouped: { [key: string]: EnrolledStudentSubject[] } = {};
    studentGrades.forEach(grade => {
      if (!grouped[grade.subject]) {
        grouped[grade.subject] = [];
      }
      grouped[grade.subject].push(grade);
    });
    return grouped;
  }, [studentGrades]);

  const getGradeColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-500';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBadgeColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading grades</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Loading grades...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Courses & Grades
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time grade tracking and performance analytics
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </Card>

      {/* Stats Cards */}
      {studentGrades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Average Score Card */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className={`text-3xl font-bold ${getGradeColor(gradeStats.averageScore)}`}>
                {gradeStats.averageScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Overall performance</p>
            </div>
          </Card>

          {/* Highest Score Card */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest</p>
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className={`text-3xl font-bold ${getGradeColor(gradeStats.maxScore)}`}>
                {gradeStats.maxScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Best performance</p>
            </div>
          </Card>

          {/* Lowest Score Card */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lowest</p>
                <AcademicCapIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className={`text-3xl font-bold ${getGradeColor(gradeStats.minScore)}`}>
                {gradeStats.minScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Needs improvement</p>
            </div>
          </Card>

          {/* Completion Card */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion</p>
                <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {gradeStats.completionPercentage}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {gradeStats.completedCount}/{gradeStats.totalCount} evaluated
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Courses by Subject */}
      {Object.keys(gradesBySubject).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(gradesBySubject).map(([subject, grades]) => (
            <Card key={subject}>
              <div className="p-6">
                {/* Subject Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {subject}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {grades.length} course{grades.length !== 1 ? 's' : ''} enrolled
                    </p>
                  </div>
                  <div className="text-right">
                    {grades[0]?.teacher && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Instructor: {grades[0].teacher.first_name} {grades[0].teacher.last_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grade Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grades.map(grade => (
                    <div
                      key={`${grade.subject}-${grade.grade_level}`}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Grade {grade.grade_level}
                          </p>
                          {grade.stream && (
                            <p className="text-xs text-gray-500">Stream: {grade.stream}</p>
                          )}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="space-y-2 mb-4">
                        {grade.assignment_score !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">Assignment</span>
                            <span className={`font-semibold ${getGradeColor(grade.assignment_score)}`}>
                              {grade.assignment_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {grade.quiz_score !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">Quiz</span>
                            <span className={`font-semibold ${getGradeColor(grade.quiz_score)}`}>
                              {grade.quiz_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {grade.mid_exam_score !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">Mid Exam</span>
                            <span className={`font-semibold ${getGradeColor(grade.mid_exam_score)}`}>
                              {grade.mid_exam_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {grade.final_exam_score !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">Final Exam</span>
                            <span className={`font-semibold ${getGradeColor(grade.final_exam_score)}`}>
                              {grade.final_exam_score.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Overall Score Badge */}
                      {grade.overall_score !== undefined ? (
                        <div className={`p-3 rounded-lg text-center ${getGradeBadgeColor(grade.overall_score)}`}>
                          <p className="text-xs font-medium">Overall Score</p>
                          <p className="text-lg font-bold">{grade.overall_score.toFixed(1)}</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-center text-gray-600 dark:text-gray-400">
                          <p className="text-xs font-medium">No grades yet</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No course grades available</p>
            <p className="text-sm mt-1">Grades will appear here as they are entered by instructors</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CoursesAndGradesRealTime;

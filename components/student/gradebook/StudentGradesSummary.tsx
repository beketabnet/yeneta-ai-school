/**
 * Student Grades Summary Component
 * Displays overall grades, statistics, and grade breakdown by subject and type
 */

import React, { useState, useEffect } from 'react';
import { useStudentGradesEnhanced, SubjectGrades, StudentGradeData } from '../../../hooks/useStudentGradesEnhanced';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import eventService, { EVENTS } from '../../../services/eventService';
import {
  percentageToLetterGrade,
  getGradeColor,
  getGradeBgColor
} from '../../../utils/gradeCalculationUtils';
import Card from '../../Card';
import { AcademicCapIcon, ChartBarIcon } from '../../icons/Icons';

interface StudentGradesSummaryProps {
  autoRefreshEnabled?: boolean;
}

const StudentGradesSummary: React.FC<StudentGradesSummaryProps> = ({ autoRefreshEnabled = true }) => {
  const { gradesBySubject, isLoading, refetch } = useStudentGradesEnhanced();
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(autoRefreshEnabled);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);

  useAutoRefresh({
    interval: 15000,
    enabled: autoRefresh,
    onRefresh: refetch
  });

  useEffect(() => {
    const unsubscribe = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  if (isLoading && gradesBySubject.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  const filteredSubjects = selectedSubjectFilter
    ? gradesBySubject.filter(s => s.subject === selectedSubjectFilter)
    : gradesBySubject;

  const allGrades: StudentGradeData[] = filteredSubjects.flatMap(subject => [
    ...Object.values(subject.assignments).flat(),
    ...Object.values(subject.exams).flat()
  ]);

  const overallGrade = allGrades.length > 0
    ? allGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / allGrades.length
    : 0;
  const letterGrade = percentageToLetterGrade(overallGrade);
  const validGrades = allGrades.filter(g => g.percentage !== undefined && g.percentage !== null);
  const highestScore = validGrades.length > 0 ? Math.max(...validGrades.map(g => g.percentage!)) : 0;
  const lowestScore = validGrades.length > 0 ? Math.min(...validGrades.map(g => g.percentage!)) : 0;

  return (
    <div className="space-y-6">
      {/* Subject Filter */}
      {gradesBySubject.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            View Grades by Subject
          </label>
          <select
            value={selectedSubjectFilter || ''}
            onChange={(e) => setSelectedSubjectFilter(e.target.value || null)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {gradesBySubject.map(subject => (
              <option key={subject.subject} value={subject.subject}>
                {subject.subject}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overall Statistics Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedSubjectFilter ? `${selectedSubjectFilter} - Grade Summary` : 'Grade Summary'}
            </h2>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefresh ? 'Auto-refresh: On' : 'Auto-refresh: Off'}
          </button>
        </div>

        {allGrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No grades available yet. Check back after your teachers enter your grades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Overall Grade */}
            <div className={`rounded-lg p-4 ${getGradeBgColor(overallGrade)}`}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Grade</p>
              <p className={`text-3xl font-bold ${getGradeColor(overallGrade)}`}>
                {overallGrade.toFixed(1)}%
              </p>
              <p className="text-sm font-semibold mt-1 text-gray-700 dark:text-gray-300">
                {letterGrade}
              </p>
            </div>

            {/* Total Grades */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Grades</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {allGrades.length}
              </p>
            </div>

            {/* Highest Score */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Highest Score</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {highestScore.toFixed(1)}%
              </p>
            </div>

            {/* Lowest Score */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lowest Score</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {lowestScore.toFixed(1)}%
              </p>
            </div>

            {/* Subjects Count */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subjects</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {gradesBySubject.length}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Subject Grades */}
      {filteredSubjects.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {selectedSubjectFilter ? `${selectedSubjectFilter} - Detailed Breakdown` : 'Grades by Subject'}
            </h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredSubjects.map((subjectData) => {
              const allSubjectGrades = [
                ...Object.values(subjectData.assignments).flat(),
                ...Object.values(subjectData.exams).flat()
              ];
              const subjectOverall = subjectData.overallGrade || 0;
              const subjectLetter = percentageToLetterGrade(subjectOverall);

              return (
                <div
                  key={subjectData.subject}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSubject(expandedSubject === subjectData.subject ? null : subjectData.subject)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{subjectData.subject}</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${getGradeBgColor(subjectOverall)}`}>
                        {subjectOverall.toFixed(1)}% ({subjectLetter})
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSubject === subjectData.subject ? '▼' : '▶'}
                    </span>
                  </button>

                  {expandedSubject === subjectData.subject && (
                    <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                      {/* Grade Type Averages */}
                      <div className="grid grid-cols-2 gap-4">
                        {subjectData.assignmentAverage !== null && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Assignment Average</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {subjectData.assignmentAverage.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {subjectData.examAverage !== null && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Exam Average</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {subjectData.examAverage.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Individual Grades */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Individual Grades:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {allSubjectGrades.map(grade => (
                            <div
                              key={grade.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {grade.assignment_type || grade.exam_type || 'Grade'}
                                </span>
                                {grade.feedback && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {grade.feedback}
                                  </p>
                                )}
                              </div>
                              <span className={`font-semibold ${getGradeColor(grade.percentage || 0)}`}>
                                {grade.score !== undefined && grade.max_score !== undefined
                                  ? `${grade.score}/${grade.max_score}`
                                  : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentGradesSummary;

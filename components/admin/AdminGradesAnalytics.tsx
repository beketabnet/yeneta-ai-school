import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import { apiService } from '../../services/apiService';
import eventService, { EVENTS } from '../../services/eventService';
import { useGradeUpdateListener } from '../../hooks/useRealtimeGradeSync';
import { ArrowPathIcon, ChartBarIcon, UserGroupIcon, TrendingUpIcon } from '../icons/Icons';

interface GradeAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalGradesEntered: number;
  averageScore: number;
  gradeDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
  };
  subjectPerformance: {
    [subject: string]: {
      averageScore: number;
      studentCount: number;
      lowestScore: number;
      highestScore: number;
    };
  };
  topPerformers: Array<{
    studentName: string;
    averageScore: number;
    subjectCount: number;
  }>;
  needsSupport: Array<{
    studentName: string;
    averageScore: number;
    lowestScore: number;
  }>;
}

const AdminGradesAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<GradeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch students
      const studentsResponse = await apiService.get('/users/students/');
      const students = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse?.data || [];

      // Fetch teachers
      const teachersResponse = await apiService.get('/users/teachers/');
      const teachers = Array.isArray(teachersResponse) ? teachersResponse : teachersResponse?.data || [];

      // Fetch all grades
      const gradesResponse = await apiService.get('/academics/student-grades/');
      const grades = Array.isArray(gradesResponse) ? gradesResponse : gradesResponse?.data || [];

      if (!grades || grades.length === 0) {
        setAnalytics({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalGradesEntered: 0,
          averageScore: 0,
          gradeDistribution: { excellent: 0, good: 0, satisfactory: 0, needsImprovement: 0 },
          subjectPerformance: {},
          topPerformers: [],
          needsSupport: [],
        });
        setIsLoading(false);
        return;
      }

      // Analyze grades
      const studentGradesMap: {
        [studentId: number]: {
          scores: number[];
          subjectCount: number;
        };
      } = {};

      const subjectAnalysis: {
        [subject: string]: {
          scores: number[];
          studentIds: Set<number>;
        };
      } = {};

      grades.forEach((grade: any) => {
        if (!grade.score || grade.score < 0 || grade.score > 100) return;

        // Aggregate by student
        if (!studentGradesMap[grade.student]) {
          studentGradesMap[grade.student] = { scores: [], subjectCount: 0 };
        }
        studentGradesMap[grade.student].scores.push(grade.score);

        // Aggregate by subject
        if (!subjectAnalysis[grade.subject]) {
          subjectAnalysis[grade.subject] = { scores: [], studentIds: new Set() };
        }
        subjectAnalysis[grade.subject].scores.push(grade.score);
        subjectAnalysis[grade.subject].studentIds.add(grade.student);
      });

      // Calculate distribution
      const allScores = grades
        .map((g: any) => g.score)
        .filter((s: number) => s >= 0 && s <= 100);

      const distribution = {
        excellent: allScores.filter((s: number) => s >= 90).length,
        good: allScores.filter((s: number) => s >= 80 && s < 90).length,
        satisfactory: allScores.filter((s: number) => s >= 70 && s < 80).length,
        needsImprovement: allScores.filter((s: number) => s < 70).length,
      };

      const averageScore = allScores.length > 0 ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0;

      // Subject performance
      const subjectPerformance: { [key: string]: any } = {};
      Object.entries(subjectAnalysis).forEach(([subject, data]: [string, any]) => {
        subjectPerformance[subject] = {
          averageScore: data.scores.length > 0 ? Math.round((data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) * 100) / 100 : 0,
          studentCount: data.studentIds.size,
          lowestScore: Math.min(...data.scores),
          highestScore: Math.max(...data.scores),
        };
      });

      // Top performers
      const topPerformers = Object.entries(studentGradesMap)
        .map(([studentId, data]) => {
          const student = students.find((s: any) => s.id === parseInt(studentId));
          return {
            studentId: parseInt(studentId),
            studentName: student?.name || student?.username || `Student ${studentId}`,
            averageScore: Math.round((data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) * 100) / 100,
            subjectCount: Object.keys(subjectPerformance).length,
          };
        })
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);

      // Students needing support
      const needsSupport = Object.entries(studentGradesMap)
        .map(([studentId, data]) => {
          const student = students.find((s: any) => s.id === parseInt(studentId));
          return {
            studentId: parseInt(studentId),
            studentName: student?.name || student?.username || `Student ${studentId}`,
            averageScore: Math.round((data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) * 100) / 100,
            lowestScore: Math.min(...data.scores),
          };
        })
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 5);

      setAnalytics({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalGradesEntered: grades.length,
        averageScore: Math.round(averageScore * 100) / 100,
        gradeDistribution: distribution,
        subjectPerformance,
        topPerformers,
        needsSupport,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMsg);
      console.error('Error fetching grade analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAnalytics();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Listen for grade updates via real-time sync
  useGradeUpdateListener('admin-analytics', async (payload) => {
    await fetchAnalytics();
  });

  // Listen for grade updates via event service
  useEffect(() => {
    const unsubscribe = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      fetchAnalytics();
    });

    return unsubscribe;
  }, []);

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (isLoading || !analytics) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Loading grade analytics...</p>
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
              Grade Analytics & Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time overview of student performance and grading metrics
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Grades</p>
              <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.totalGradesEntered}
            </p>
            <p className="text-xs text-gray-500 mt-2">grades entered in system</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
              <TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {analytics.averageScore.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-2">across all grades</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
              <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {analytics.totalStudents}
            </p>
            <p className="text-xs text-gray-500 mt-2">total enrolled</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teachers</p>
              <ChartBarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {analytics.totalTeachers}
            </p>
            <p className="text-xs text-gray-500 mt-2">active instructors</p>
          </div>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Grade Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Excellent (90+)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                {analytics.gradeDistribution.excellent}
              </p>
              <div className="mt-2 w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalGradesEntered > 0 ? (analytics.gradeDistribution.excellent / analytics.totalGradesEntered) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Good (80-89)</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {analytics.gradeDistribution.good}
              </p>
              <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalGradesEntered > 0 ? (analytics.gradeDistribution.good / analytics.totalGradesEntered) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Satisfactory (70-79)</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                {analytics.gradeDistribution.satisfactory}
              </p>
              <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalGradesEntered > 0 ? (analytics.gradeDistribution.satisfactory / analytics.totalGradesEntered) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Needs Improvement (&lt;70)</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-500">
                {analytics.gradeDistribution.needsImprovement}
              </p>
              <div className="mt-2 w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${analytics.totalGradesEntered > 0 ? (analytics.gradeDistribution.needsImprovement / analytics.totalGradesEntered) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Top Performers</h2>
            {analytics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{performer.studentName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Average: {performer.averageScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                        {performer.averageScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No student data available yet</p>
            )}
          </div>
        </Card>

        {/* Students Needing Support */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Students Needing Support</h2>
            {analytics.needsSupport.length > 0 ? (
              <div className="space-y-3">
                {analytics.needsSupport.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{student.studentName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Lowest: {student.lowestScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                        {student.averageScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No student data available yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Subject Performance */}
      {Object.keys(analytics.subjectPerformance).length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Subject Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Average
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.subjectPerformance).map(([subject, perf]: [string, any]) => (
                    <tr key={subject} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{subject}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {perf.averageScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{perf.studentCount}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {perf.lowestScore.toFixed(1)} - {perf.highestScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminGradesAnalytics;

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface EnrolledStudentSubject {
  id: number;
  student_id: number;
  student_name: string;
  first_name: string;
  last_name: string;
  subject: string;
  grade_level: string;
  stream?: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  enrollment_date: string;
  approval_date?: string;
  assignment_score?: number;
  quiz_score?: number;
  mid_exam_score?: number;
  final_exam_score?: number;
  overall_score?: number;
  trend?: 'improving' | 'declining' | 'stable';
  trend_value?: number;
}

export interface ParentGradesSummary {
  totalStudents: number;
  totalEnrolledSubjects: number;
  averageScore: number | null;
  studentsPerformance: {
    [studentId: number]: {
      studentName: string;
      totalSubjects: number;
      averageGrade: number | null;
      enrolledSubjects: EnrolledStudentSubject[];
    };
  };
}

export interface UseParentEnrolledStudentGradesReturn {
  enrolledSubjects: EnrolledStudentSubject[];
  summary: ParentGradesSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStudentGrades: (studentId: number) => EnrolledStudentSubject[];
  getSubjectGrades: (studentId: number, subject: string) => EnrolledStudentSubject | undefined;
}

export const useParentEnrolledStudentGrades = (): UseParentEnrolledStudentGradesReturn => {
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledStudentSubject[]>([]);
  const [summary, setSummary] = useState<ParentGradesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParentEnrolledSubjectsWithGrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the unified analytics endpoint to ensure consistency with Enrolled Subjects page
      const enrollmentsResponse = await apiService.get('/academics/parent-enrolled-subjects-analytics/');

      // Backend returns: object with families array and summary
      const familiesData = enrollmentsResponse.families || [];

      console.log('Parent enrolled subjects analytics response:', familiesData);

      // Create a map of approved subjects to ensure no duplicates
      const approvedSubjectsMap: Record<string, EnrolledStudentSubject> = {};

      // Flatten the nested structure and process ONLY approved enrollments
      familiesData.forEach((family: any) => {
        if (!family.students) return;

        family.students.forEach((student: any) => {
          if (!student.subjects) return;

          student.subjects.forEach((subject: any) => {
            // Use unique key: student_id_subject_grade_level_stream_TEACHER_ID or just ID
            // We must allow multiple enrollments for the same subject if they are distinct records (e.g. different teachers)
            // Ideally we use the Enrollment ID (subject.id) as the unique key.
            const key = subject.id ? `enrollment_${subject.id}` : `${student.student_id}_${subject.subject}_${subject.grade_level}_${subject.stream || ''}`;

            // Skip if already added (prevents duplicates only if exact same enrollment ID)
            if (approvedSubjectsMap[key]) {
              return;
            }

            approvedSubjectsMap[key] = {
              id: subject.id || key,
              student_id: student.student_id,
              student_name: student.student_name,
              first_name: student.student_name.split(' ')[0] || '',
              last_name: student.student_name.split(' ')[1] || '',
              subject: subject.subject,
              grade_level: subject.grade_level,
              stream: subject.stream,
              teacher: subject.teacher,
              enrollment_date: subject.enrolled_date,
              approval_date: subject.enrolled_date,
              // Map analytics fields to expected hook fields
              assignment_score: subject.assignment_average,
              // quiz/mid/final are not explicitly returned by analytics, but we use overall_grade
              overall_score: subject.overall_grade,
              trend: subject.trend,
              trend_value: subject.trend_value, // Analytics might not return this exact field name? let's check view
            };
          });
        });
      });

      console.log('Approved subjects map (deduplicated):', Object.keys(approvedSubjectsMap).length, 'subjects');

      const enrolledSubjectsWithScores = Object.values(approvedSubjectsMap);

      console.log('Final enrolled subjects with scores:', enrolledSubjectsWithScores.length, 'subjects');
      setEnrolledSubjects(enrolledSubjectsWithScores);

      // Calculate summary
      const uniqueStudents = new Set(enrolledSubjectsWithScores.map(s => s.student_id));
      const studentsPerformance: ParentGradesSummary['studentsPerformance'] = {};

      uniqueStudents.forEach(studentId => {
        const studentSubjects = enrolledSubjectsWithScores.filter(
          s => s.student_id === studentId
        );
        const studentName = studentSubjects[0]?.student_name || 'Unknown';
        const averages = studentSubjects
          .filter(s => s.overall_score !== undefined)
          .map(s => s.overall_score as number);

        studentsPerformance[studentId] = {
          studentName,
          totalSubjects: studentSubjects.length,
          averageGrade:
            averages.length > 0
              ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) /
              100
              : null,
          enrolledSubjects: studentSubjects,
        };
      });

      const allOverallScores = enrolledSubjectsWithScores
        .filter(s => s.overall_score !== undefined)
        .map(s => s.overall_score as number);

      setSummary({
        totalStudents: uniqueStudents.size,
        totalEnrolledSubjects: enrolledSubjectsWithScores.length,
        averageScore:
          allOverallScores.length > 0
            ? Math.round((allOverallScores.reduce((a, b) => a + b, 0) / allOverallScores.length) *
              100) / 100
            : null,
        studentsPerformance,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrolled subjects';
      setError(errorMessage);
      console.error('Error fetching parent enrolled subjects with grades:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStudentGrades = useCallback(
    (studentId: number) => {
      return enrolledSubjects.filter(s => s.student_id === studentId);
    },
    [enrolledSubjects]
  );

  const getSubjectGrades = useCallback(
    (studentId: number, subject: string) => {
      return enrolledSubjects.find(s => s.student_id === studentId && s.subject === subject);
    },
    [enrolledSubjects]
  );

  useEffect(() => {
    fetchParentEnrolledSubjectsWithGrades();
  }, [fetchParentEnrolledSubjectsWithGrades]);

  // Listen for grade updates
  useEffect(() => {
    const handleGradeEvent = () => {
      fetchParentEnrolledSubjectsWithGrades();
    };

    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [fetchParentEnrolledSubjectsWithGrades]);

  return {
    enrolledSubjects,
    summary,
    isLoading,
    error,
    refetch: fetchParentEnrolledSubjectsWithGrades,
    getStudentGrades,
    getSubjectGrades,
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';
import { gradebookService, EnrolledSubject } from '../services/gradebookService';

export interface GradebookStudent {
  student_id: number;
  student_name: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  stream?: string;
}

export interface StudentGradeRecord {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  grade_level: string;
  stream?: string;
  assignment_score?: number;
  quiz_score?: number;
  mid_exam_score?: number;
  final_exam_score?: number;
  overall_score?: number;
  requested_at?: string;
  approval_date?: string;
}

export interface GradebookFilters {
  subject?: string;
  gradeLevel?: string;
  stream?: string;
  searchStudent?: string;
  assignmentType?: string;
  examType?: string;
}

export interface UseGradebookManagerReturn {
  students: GradebookStudent[];
  grades: StudentGradeRecord[];
  filteredGrades: StudentGradeRecord[];
  isLoading: boolean;
  error: string | null;
  filters: GradebookFilters;
  setFilters: (filters: GradebookFilters) => void;
  saveGrade: (gradeData: any) => Promise<any>;
  refetch: () => Promise<void>;
  stats: {
    totalStudents: number;
    totalSubjects: number;
    avgScore: number | null;
    gradeCount: number;
  };
  enrolledSubjects: EnrolledSubject[];
  availableGradeLevels: string[];
  subjectsLoading: boolean;
}

export const useGradebookManager = (): UseGradebookManagerReturn => {
  const [students, setStudents] = useState<GradebookStudent[]>([]);
  const [grades, setGrades] = useState<StudentGradeRecord[]>([]);
  const [filters, setFilters] = useState<GradebookFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    avgScore: null as number | null,
    gradeCount: 0,
  });
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [availableGradeLevels, setAvailableGradeLevels] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const statsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEnrolledStudentsAndGrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch enrolled students (from approved StudentEnrollmentRequest)
      const enrolledStudentsResponse = await apiService.get('/academics/teacher-enrolled-students/');
      const enrolledStudents = Array.isArray(enrolledStudentsResponse)
        ? enrolledStudentsResponse
        : enrolledStudentsResponse?.data || [];

      // Transform to GradebookStudent
      const transformedStudents: GradebookStudent[] = enrolledStudents.map((student: any) => ({
        student_id: student.id,
        student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        grade_level: student.grade_level || 'N/A',
        stream: student.stream || undefined,
      }));

      setStudents(transformedStudents);

      // Fetch grades created by the teacher using StudentGradeViewSet
      const gradesResponse = await apiService.get('/academics/student-grades/');
      const gradesData = Array.isArray(gradesResponse)
        ? gradesResponse
        : gradesResponse?.data || [];

      // Aggregate grades by student and subject
      const aggregatedGrades: Record<string, StudentGradeRecord> = {};

      gradesData.forEach((grade: any) => {
        const key = `${grade.student}_${grade.subject}`;

        if (!aggregatedGrades[key]) {
          const student = transformedStudents.find(s => s.student_id === grade.student);
          aggregatedGrades[key] = {
            id: grade.id || Math.random(),
            student_id: grade.student,
            student_name: student?.student_name || 'Unknown',
            subject: grade.subject,
            grade_level: grade.grade_level || student?.grade_level || 'N/A',
            stream: grade.stream || student?.stream,
            requested_at: grade.created_at,
          };
        }

        // Add scores by type
        if (grade.assignment_type === 'Assignment') {
          aggregatedGrades[key].assignment_score = grade.score;
        } else if (grade.assignment_type === 'Quiz') {
          aggregatedGrades[key].quiz_score = grade.score;
        } else if (grade.exam_type === 'Mid Exam') {
          aggregatedGrades[key].mid_exam_score = grade.score;
        } else if (grade.exam_type === 'Final Exam') {
          aggregatedGrades[key].final_exam_score = grade.score;
        }
      });

      // Calculate overall scores
      const gradesWithOverall = Object.values(aggregatedGrades).map(grade => {
        const scores = [
          grade.assignment_score,
          grade.quiz_score,
          grade.mid_exam_score,
          grade.final_exam_score,
        ].filter(s => s !== undefined && s !== null);

        if (scores.length > 0) {
          grade.overall_score = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
        }

        return grade;
      });

      setGrades(gradesWithOverall);

      // Calculate stats dynamically
      calculateAndSetStats(transformedStudents, gradesWithOverall);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gradebook data';
      setError(errorMessage);
      console.error('Error fetching gradebook:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateAndSetStats = useCallback((
    studentsData: GradebookStudent[],
    gradesData: StudentGradeRecord[]
  ) => {
    const uniqueSubjects = new Set(gradesData.map(g => g.subject)).size;
    const allScores = gradesData
      .flatMap(g => [g.assignment_score, g.quiz_score, g.mid_exam_score, g.final_exam_score])
      .filter(s => s !== undefined && s !== null) as number[];
    const avgScore = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : null;

    setStats({
      totalStudents: studentsData.length,
      totalSubjects: uniqueSubjects,
      avgScore,
      gradeCount: gradesData.length,
    });
  }, []);

  const fetchEnrolledSubjectsAndLevels = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const subjects = await gradebookService.getEnrolledSubjects();
      const levels = await gradebookService.getAvailableGradeLevels();

      setEnrolledSubjects(subjects);
      setAvailableGradeLevels(levels);
    } catch (err) {
      console.error('Error fetching enrolled subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const saveGrade = useCallback(async (gradeData: any) => {
    try {
      const isUpdate = !!gradeData.id;
      const result = isUpdate
        ? await apiService.updateStudentGrade(gradeData.id, gradeData)
        : await apiService.createStudentGrade(gradeData);

      eventService.emit(isUpdate ? EVENTS.GRADE_UPDATED : EVENTS.GRADE_CREATED, result);

      // Debounce stats update for performance
      if (statsUpdateTimeoutRef.current) {
        clearTimeout(statsUpdateTimeoutRef.current);
      }
      statsUpdateTimeoutRef.current = setTimeout(() => {
        fetchEnrolledStudentsAndGrades();
      }, 500);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save grade';
      setError(errorMessage);
      throw err;
    }
  }, [fetchEnrolledStudentsAndGrades]);

  // Apply filters to grades
  const filteredGrades = grades.filter(grade => {
    if (filters.subject && grade.subject !== filters.subject) return false;
    if (filters.gradeLevel && grade.grade_level !== filters.gradeLevel) return false;
    if (filters.stream && grade.stream !== filters.stream) return false;
    // Assuming API returns 'assignment_type' on student grade record
    // Assuming API returns 'exam_type'
    // Note: The StudentGradeRecord interface does not currently have assignment_type or exam_type.
    // If these are needed for filtering, they should be added to the interface and populated during data aggregation.
    // For now, these filters will always return true unless the grade object explicitly has these properties.
    // If `grade` objects are expected to have `assignment_type` or `exam_type` for filtering,
    // the `StudentGradeRecord` interface needs to be updated to include them.
    // For example: `assignment_type?: string;` and `exam_type?: string;`
    // TODO: The current aggregation logic consolidates multiple grades into one StudentGradeRecord per subject.
    // Filtering by individual assignment/exam type is not possible on the aggregated record without refactoring the data structure.
    // The following lines are commented out to prevent errors until aggregation supports filtering.
    // if (filters.assignmentType && (grade as any).assignment_type !== filters.assignmentType) return false;
    // if (filters.examType && (grade as any).exam_type !== filters.examType) return false;
    if (filters.searchStudent) {
      const searchLower = filters.searchStudent.toLowerCase();
      if (!grade.student_name.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  useEffect(() => {
    fetchEnrolledStudentsAndGrades();
    fetchEnrolledSubjectsAndLevels();

    return () => {
      if (statsUpdateTimeoutRef.current) {
        clearTimeout(statsUpdateTimeoutRef.current);
      }
    };
  }, [fetchEnrolledStudentsAndGrades, fetchEnrolledSubjectsAndLevels]);

  // Listen for grade events
  useEffect(() => {
    const unsubscribe = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      fetchEnrolledStudentsAndGrades();
    });

    return unsubscribe;
  }, [fetchEnrolledStudentsAndGrades]);

  return {
    students,
    grades,
    filteredGrades,
    isLoading,
    error,
    filters,
    setFilters,
    saveGrade,
    refetch: fetchEnrolledStudentsAndGrades,
    stats,
    enrolledSubjects,
    availableGradeLevels,
    subjectsLoading,
  };
};

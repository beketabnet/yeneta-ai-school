import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface StudentGradeData {
  id?: number;
  score: number;
  max_score: number;
  percentage?: number;
  feedback?: string;
  graded_at?: string;
  assignment_type?: string;
  exam_type?: string;
}

export interface SubjectGrades {
  subject: string;
  assignmentGrades: StudentGradeData[];
  examGrades: StudentGradeData[];
  assignmentAverage: number | null;
  examAverage: number | null;
  overallGrade: number | null;
}

interface UseStudentGradesEnhancedReturn {
  gradesBySubject: SubjectGrades[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudentGradesEnhanced = (): UseStudentGradesEnhancedReturn => {
  const [gradesBySubject, setGradesBySubject] = useState<SubjectGrades[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAverage = (grades: StudentGradeData[]): number | null => {
    if (!grades || grades.length === 0) return null;

    let totalPercentage = 0;
    let count = 0;

    for (const grade of grades) {
      const percentage = grade.max_score > 0
        ? (grade.score / grade.max_score) * 100
        : 0;
      totalPercentage += percentage;
      count++;
    }

    return count > 0 ? Math.round((totalPercentage / count) * 100) / 100 : null;
  };

  const organizeGrades = useCallback((gradebookData: any): SubjectGrades[] => {
    if (!gradebookData || Object.keys(gradebookData).length === 0) {
      return [];
    }

    const organized: SubjectGrades[] = [];

    for (const [subjectName, subjectData] of Object.entries(gradebookData)) {
      const subject = subjectData as {
        subject: string;
        assignments: Record<string, StudentGradeData[]>;
        exams: Record<string, StudentGradeData[]>;
        overall_grade: number | null;
      };

      const assignmentGrades: StudentGradeData[] = [];
      const examGrades: StudentGradeData[] = [];

      if (subject.assignments && typeof subject.assignments === 'object') {
        for (const [assignmentType, grades] of Object.entries(subject.assignments)) {
          if (Array.isArray(grades)) {
            const gradesWithType = grades.map(g => ({
              ...g,
              assignment_type: assignmentType
            }));
            assignmentGrades.push(...gradesWithType);
          }
        }
      }

      if (subject.exams && typeof subject.exams === 'object') {
        for (const [examType, grades] of Object.entries(subject.exams)) {
          if (Array.isArray(grades)) {
            const gradesWithType = grades.map(g => ({
              ...g,
              exam_type: examType
            }));
            examGrades.push(...gradesWithType);
          }
        }
      }

      const assignmentAverage = calculateAverage(assignmentGrades);
      const examAverage = calculateAverage(examGrades);

      let overallGrade: number | null = null;
      if (assignmentAverage !== null && examAverage !== null) {
        overallGrade = (assignmentAverage * 0.4) + (examAverage * 0.6);
      } else if (assignmentAverage !== null) {
        overallGrade = assignmentAverage;
      } else if (examAverage !== null) {
        overallGrade = examAverage;
      }

      organized.push({
        subject: subject.subject || subjectName,
        assignmentGrades,
        examGrades,
        assignmentAverage,
        examAverage,
        overallGrade
      });
    }

    return organized;
  }, []);

  const fetchGrades = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both approved courses and gradebook data
      const [approvedCoursesData, gradebookData] = await Promise.all([
        apiService.getApprovedCoursesWithGrades().catch(() => []),
        apiService.getStudentGradebook().catch(() => [])
      ]);

      const validCoursesData = Array.isArray(approvedCoursesData) ? approvedCoursesData : [];

      // Create a set of approved subject keys for filtering
      const approvedSubjects = new Set<string>();
      // Fallback map for matching when stream is missing in grades
      const approvedSubjectsFallback = new Map<string, string>();

      for (const course of validCoursesData) {
        if (course.subject && course.grade_level) {
          const key = `${course.subject}_${course.grade_level}_${course.stream || ''}`;
          approvedSubjects.add(key);

          const shortKey = `${course.subject}_${course.grade_level}`;
          approvedSubjectsFallback.set(shortKey, key);
        }
      }

      console.log('Approved subjects:', Array.from(approvedSubjects));
      console.log('Gradebook data before filtering:', gradebookData);

      // Filter gradebook data to only include approved subjects
      let filteredGradebookData: any = {};
      if (Array.isArray(gradebookData)) {
        for (const item of gradebookData) {
          if (item.subject && item.grade_level) {
            const key = `${item.subject}_${item.grade_level}_${item.stream || ''}`;
            const shortKey = `${item.subject}_${item.grade_level}`;

            if (approvedSubjects.has(key)) {
              filteredGradebookData[item.subject] = item;
            } else if ((!item.stream || item.stream === '') && approvedSubjectsFallback.has(shortKey)) {
              // Fallback match: Grade has no stream, but matches Subject+Grade of an approved course
              console.log(`Soft matching subject (missing stream): ${key} -> ${approvedSubjectsFallback.get(shortKey)}`);
              filteredGradebookData[item.subject] = item;
            } else {
              console.log(`Filtering out non-approved subject: ${key}`);
            }
          }
        }
      }

      console.log('Gradebook data after filtering:', filteredGradebookData);

      const organized = organizeGrades(filteredGradebookData);

      setGradesBySubject(organized);
    } catch (err) {
      console.error('Error fetching student grades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grades');
      setGradesBySubject([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizeGrades]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  return {
    gradesBySubject,
    isLoading,
    error,
    refetch: fetchGrades
  };
};

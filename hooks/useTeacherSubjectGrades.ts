import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface SubjectInfo {
  id: number;
  title: string;
  grade_level: string;
  student_count: number;
  total_grades: number;
  avg_score: number | null;
}

export interface StudentWithGrades {
  student_id: number;
  student_name: string;
  grade_level: string;
  enrollment_date: string;
  grades: any[];
  assignment_grades: any[];
  exam_grades: any[];
  total_grades: number;
}

export interface SubjectGradesData {
  subject_id: number;
  subject_name: string;
  grade_level: string;
  students: StudentWithGrades[];
  total_students: number;
}

export interface UseTeacherSubjectGradesReturn {
  subjects: SubjectInfo[];
  selectedSubjectData: SubjectGradesData | null;
  summary: any;
  isLoading: boolean;
  error: string | null;
  selectSubject: (subjectId: number) => Promise<void>;
  refetchSubjects: () => Promise<void>;
  refetchSubjectData: () => Promise<void>;
  submitBulkGrades: (gradesData: any[]) => Promise<any>;
}

export const useTeacherSubjectGrades = (): UseTeacherSubjectGradesReturn => {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectData, setSelectedSubjectData] = useState<SubjectGradesData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getTeacherEnrolledSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subjects';
      setError(errorMessage);
      console.error('Error fetching subjects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchSubjectData = useCallback(async () => {
    if (!selectedSubjectId) return;

    setIsLoading(true);
    setError(null);
    try {
      const [subjectData, summaryData] = await Promise.all([
        apiService.getSubjectStudentsWithGrades(selectedSubjectId),
        apiService.getSubjectGradeSummary(selectedSubjectId)
      ]);
      setSelectedSubjectData(subjectData);
      setSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subject data';
      setError(errorMessage);
      console.error('Error fetching subject data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubjectId]);

  const selectSubject = useCallback(async (subjectId: number) => {
    setSelectedSubjectId(subjectId);
    setIsLoading(true);
    setError(null);
    try {
      const [subjectData, summaryData] = await Promise.all([
        apiService.getSubjectStudentsWithGrades(subjectId),
        apiService.getSubjectGradeSummary(subjectId)
      ]);
      setSelectedSubjectData(subjectData);
      setSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subject data';
      setError(errorMessage);
      console.error('Error fetching subject data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitBulkGrades = useCallback(async (gradesData: any[]) => {
    try {
      const result = await apiService.bulkGradeEntry(gradesData);
      if (result.created > 0) {
        eventService.emit(EVENTS.GRADE_CREATED, { count: result.created });
        await refetchSubjectData();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit grades';
      setError(errorMessage);
      throw err;
    }
  }, [refetchSubjectData]);

  useEffect(() => {
    refetchSubjects();
  }, [refetchSubjects]);

  useEffect(() => {
    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, () => {
      refetchSubjectData();
      refetchSubjects();
    });

    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      refetchSubjectData();
      refetchSubjects();
    });

    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, () => {
      refetchSubjectData();
      refetchSubjects();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [refetchSubjectData, refetchSubjects]);

  return {
    subjects,
    selectedSubjectData,
    summary,
    isLoading,
    error,
    selectSubject,
    refetchSubjects,
    refetchSubjectData,
    submitBulkGrades
  };
};

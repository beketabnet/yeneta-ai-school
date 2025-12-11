import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface GradeData {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  graded_at: string;
}

export interface AggregatedGradeData {
  student_id: number;
  subject: string;
  assignment_grades: Record<string, any>;
  exam_grades: Record<string, any>;
  assignment_average: number | null;
  exam_average: number | null;
  overall_grade: number | null;
  total_grades: number;
  pending_grades: number;
  completed_grades: number;
}

export interface UseTeacherGradebookEnhancedReturn {
  grades: GradeData[];
  aggregatedData: AggregatedGradeData | null;
  stats: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchAggregated: (studentId: number, subject: string) => Promise<void>;
}

export const useTeacherGradebookEnhanced = (): UseTeacherGradebookEnhancedReturn => {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedGradeData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [gradesData, statsData] = await Promise.all([
        apiService.getStudentGradesBySubject(''),
        apiService.getGradeStatistics()
      ]);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grades';
      setError(errorMessage);
      console.error('Error fetching grades:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAggregated = useCallback(async (studentId: number, subject: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAggregatedGrades(studentId, subject);
      setAggregatedData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch aggregated grades';
      setError(errorMessage);
      console.error('Error fetching aggregated grades:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, () => {
      refetch();
    });

    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      refetch();
    });

    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, () => {
      refetch();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [refetch]);

  return {
    grades,
    aggregatedData,
    stats,
    isLoading,
    error,
    refetch,
    fetchAggregated
  };
};

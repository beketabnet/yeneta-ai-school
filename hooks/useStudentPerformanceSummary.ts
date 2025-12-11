import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface StudentPerformanceSummary {
  student_id: number;
  overall_average: number | null;
  subjects: Record<string, {
    assignment_avg: number | null;
    exam_avg: number | null;
    overall: number | null;
  }>;
  total_subjects: number;
  total_grades: number;
}

export interface UseStudentPerformanceSummaryReturn {
  summary: StudentPerformanceSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudentPerformanceSummary = (studentId: number): UseStudentPerformanceSummaryReturn => {
  const [summary, setSummary] = useState<StudentPerformanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!studentId) {
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getStudentPerformanceSummary(studentId);
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch performance summary';
      setError(errorMessage);
      console.error('Error fetching performance summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsubscribe = eventService.subscribe(EVENTS.GRADE_UPDATED, () => {
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  return {
    summary,
    isLoading,
    error,
    refetch
  };
};

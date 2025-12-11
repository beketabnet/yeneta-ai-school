import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface SubjectAnalytics {
  subject: string;
  average_score: number;
  latest_score: number | null;
  total_grades: number;
  trend: 'improving' | 'declining' | 'stable';
  trend_value: number;
  performance_level: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  min_score: number;
  max_score: number;
}

export interface StudentAnalytics {
  student_id: number;
  student_name: string;
  average_score: number;
  total_grades: number;
  subjects: number;
  subject_analytics: SubjectAnalytics[];
  completion_rate: number;
}

export interface PerformanceAlert {
  type: 'low_grade' | 'declining_trend' | 'improvement_milestone';
  student_name: string;
  subject: string;
  score?: number;
  decline_percentage?: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalyticsSummary {
  total_children: number;
  total_subjects: number;
  average_performance: number | null;
  performance_alerts: PerformanceAlert[];
  filters_applied: {
    min_score: string | null;
    max_score: string | null;
    days_back: string | null;
    performance_level: string | null;
    subject: string | null;
  };
}

export interface UseAcademicPerformanceAnalyticsReturn {
  analytics: StudentAnalytics[];
  summary: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  applyFilters: (filters: FilterOptions) => Promise<void>;
  getSortedSubjects: (studentId: number, sortBy: 'score' | 'name' | 'trend') => SubjectAnalytics[];
  getAlertsByStudent: (studentId: number) => PerformanceAlert[];
  getAlertsBySeverity: (severity: 'high' | 'medium' | 'low') => PerformanceAlert[];
}

export interface FilterOptions {
  min_score?: number;
  max_score?: number;
  days_back?: number;
  performance_level?: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  subject?: string;
}

export const useAcademicPerformanceAnalytics = (): UseAcademicPerformanceAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const fetchAnalytics = useCallback(async (filters: FilterOptions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching academic performance analytics with filters:', filters);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.min_score !== undefined) params.append('min_score', filters.min_score.toString());
      if (filters.max_score !== undefined) params.append('max_score', filters.max_score.toString());
      if (filters.days_back !== undefined) params.append('days_back', filters.days_back.toString());
      if (filters.performance_level) params.append('performance_level', filters.performance_level);
      if (filters.subject) params.append('subject', filters.subject);

      const response = await apiService.get(
        `/academics/parent-academic-analytics/?${params.toString()}`
      );

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response structure from server');
      }

      const analyticsData = response.analytics || [];
      const summaryData = response.summary || null;

      if (!Array.isArray(analyticsData)) {
        throw new Error('Analytics data is not an array');
      }

      setAnalytics(analyticsData);
      setSummary(summaryData);
      setCurrentFilters(filters);

      console.log(`Successfully loaded analytics for ${analyticsData.length} students`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load academic analytics';
      console.error('Error fetching analytics:', err);
      setError(errorMessage);
      setAnalytics([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for grade updates
  useEffect(() => {
    const handleGradeEvent = () => {
      console.log('Grade event received, refreshing analytics...');
      fetchAnalytics(currentFilters);
    };

    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [fetchAnalytics, currentFilters]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const applyFilters = useCallback(async (filters: FilterOptions) => {
    await fetchAnalytics(filters);
  }, [fetchAnalytics]);

  const getSortedSubjects = useCallback(
    (studentId: number, sortBy: 'score' | 'name' | 'trend'): SubjectAnalytics[] => {
      const student = analytics.find(s => s.student_id === studentId);
      if (!student) return [];

      const subjects = [...student.subject_analytics];

      switch (sortBy) {
        case 'score':
          return subjects.sort((a, b) => b.average_score - a.average_score);
        case 'name':
          return subjects.sort((a, b) => a.subject.localeCompare(b.subject));
        case 'trend':
          return subjects.sort((a, b) => {
            const trendOrder = { improving: 1, stable: 0, declining: -1 };
            return (trendOrder[b.trend] || 0) - (trendOrder[a.trend] || 0);
          });
        default:
          return subjects;
      }
    },
    [analytics]
  );

  const getAlertsByStudent = useCallback(
    (studentId: number): PerformanceAlert[] => {
      if (!summary) return [];
      const student = analytics.find(s => s.student_id === studentId);
      if (!student) return [];

      return summary.performance_alerts.filter(alert => alert.student_name === student.student_name);
    },
    [analytics, summary]
  );

  const getAlertsBySeverity = useCallback(
    (severity: 'high' | 'medium' | 'low'): PerformanceAlert[] => {
      if (!summary) return [];
      return summary.performance_alerts.filter(alert => alert.severity === severity);
    },
    [summary]
  );

  return {
    analytics,
    summary,
    isLoading,
    error,
    refetch: () => fetchAnalytics(currentFilters),
    applyFilters,
    getSortedSubjects,
    getAlertsByStudent,
    getAlertsBySeverity
  };
};

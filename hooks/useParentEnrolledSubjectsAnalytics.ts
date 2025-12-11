import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface Subject {
  id: number;
  subject: string;
  grade_level: string;
  stream?: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    full_name?: string;
  };
  enrolled_date: string;
  status: string;
  assignment_average?: number;
  exam_average?: number;
  overall_grade?: number;
  performance_level: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement' | 'no_grade';
  total_grades: number;
  trend?: 'improving' | 'declining' | 'stable';
  trend_value?: number;
}

export interface Student {
  student_id: number;
  student_name: string;
  subjects: Subject[];
}

export interface Family {
  family_id: number;
  family_name: string;
  total_students: number;
  students: Student[];
}

export interface Summary {
  total_subjects: number;
  active_subjects: number;
  average_performance: number | null;
  filters_applied: {
    grade_level: string | null;
    subject: string | null;
    status: string | null;
    days_back: string | null;
    performance_level: string | null;
  };
}

export interface FilterOptions {
  grade_level?: string;
  subject?: string;
  status?: string;
  days_back?: number;
  performance_level?: string;
}

export interface UseParentEnrolledSubjectsAnalyticsReturn {
  families: Family[];
  summary: Summary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  applyFilters: (filters: FilterOptions) => Promise<void>;
  getSortedSubjects: (studentId: number, sortBy: 'name' | 'grade' | 'date' | 'trend') => Subject[];
  getSubjectsByPerformance: (studentId: number, level: string) => Subject[];
}

export const useParentEnrolledSubjectsAnalytics = (): UseParentEnrolledSubjectsAnalyticsReturn => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const fetchAnalytics = useCallback(async (filters: FilterOptions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching enrolled subjects analytics with filters:', filters);

      const params = new URLSearchParams();
      if (filters.grade_level) params.append('grade_level', filters.grade_level);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.status) params.append('status', filters.status);
      if (filters.days_back !== undefined) params.append('days_back', filters.days_back.toString());
      if (filters.performance_level) params.append('performance_level', filters.performance_level);

      const response = await apiService.get(
        `/academics/parent-enrolled-subjects-analytics/?${params.toString()}`
      );

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response structure from server');
      }

      const familiesData = response.families || [];
      const summaryData = response.summary || null;

      if (!Array.isArray(familiesData)) {
        throw new Error('Families data is not an array');
      }

      setFamilies(familiesData);
      setSummary(summaryData);
      setCurrentFilters(filters);

      console.log(`Successfully loaded analytics for ${familiesData.length} families`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load enrolled subjects analytics';
      console.error('Error fetching analytics:', err);
      setError(errorMessage);
      setFamilies([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleEvent = () => {
      console.log('Enrollment/grade event received, refreshing analytics...');
      fetchAnalytics(currentFilters);
    };

    const unsubscribeEnrollmentApproved = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_APPROVED, handleEvent);
    const unsubscribeEnrollmentDeclined = eventService.subscribe(EVENTS.ENROLLMENT_REQUEST_DECLINED, handleEvent);
    const unsubscribeGradeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleEvent);
    const unsubscribeGradeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleEvent);
    const unsubscribeGradeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleEvent);

    return () => {
      unsubscribeEnrollmentApproved();
      unsubscribeEnrollmentDeclined();
      unsubscribeGradeCreated();
      unsubscribeGradeUpdated();
      unsubscribeGradeDeleted();
    };
  }, [fetchAnalytics, currentFilters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const applyFilters = useCallback(async (filters: FilterOptions) => {
    await fetchAnalytics(filters);
  }, [fetchAnalytics]);

  const getSortedSubjects = useCallback(
    (studentId: number | null, sortBy: 'name' | 'grade' | 'date' | 'trend'): Subject[] => {
      let subjects: Subject[] = [];

      if (studentId) {
        // Get subjects for specific student
        // Get subjects for specific student
        for (const family of families) {
          const student = family.students.find(s => s.student_id === studentId);
          if (student) {
            subjects = [...subjects, ...student.subjects];
            // Do not break; aggregate across all families in case student exists in multiple (e.g. Direct + Family)
          }
        }
      } else {
        // Get all subjects from all students
        families.forEach(family => {
          family.students.forEach(student => {
            // Add student name to subject for display context if needed, though subject object structure might need update or we rely on pre-existing data
            // For now, just aggregating
            subjects = [...subjects, ...student.subjects];
          });
        });
      }

      switch (sortBy) {
        case 'name':
          return subjects.sort((a, b) => a.subject.localeCompare(b.subject));
        case 'grade':
          return subjects.sort((a, b) => {
            const gradeA = a.overall_grade || 0;
            const gradeB = b.overall_grade || 0;
            return gradeB - gradeA;
          });
        case 'date':
          return subjects.sort((a, b) => {
            return new Date(b.enrolled_date).getTime() - new Date(a.enrolled_date).getTime();
          });
        case 'trend':
          const performanceOrder = { excellent: 4, good: 3, average: 2, below_average: 1, needs_improvement: 0, no_grade: -1 };
          return subjects.sort((a, b) => {
            return (performanceOrder[b.performance_level] || 0) - (performanceOrder[a.performance_level] || 0);
          });
        default:
          return subjects;
      }
    },
    [families]
  );

  const getSubjectsByPerformance = useCallback(
    (studentId: number, level: string): Subject[] => {
      for (const family of families) {
        const student = family.students.find(s => s.student_id === studentId);
        if (student) {
          return student.subjects.filter(s => s.performance_level === level);
        }
      }
      return [];
    },
    [families]
  );

  return {
    families,
    summary,
    isLoading,
    error,
    refetch: () => fetchAnalytics(currentFilters),
    applyFilters,
    getSortedSubjects,
    getSubjectsByPerformance
  };
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface ChartSubjectData {
  id: string; // unique identifier: subject_gradeLevel_stream
  subject: string;
  grade_level: string;
  stream?: string;
  teacher_name: string;
  average_grade: number;
  overall_grade: number | null;
  assignment_average: number | null;
  exam_average: number | null;
  has_grades: boolean;
}

interface UseGradeChartDataReturn {
  subjects: ChartSubjectData[];
  allSubjects: ChartSubjectData[];
  isLoading: boolean;
  error: string | null;
  filters: {
    subject?: string;
    grade_level?: string;
  };
  setFilters: (filters: { subject?: string; grade_level?: string }) => void;
  refetch: () => Promise<void>;
}

export const useGradeChartData = (): UseGradeChartDataReturn => {
  const [allSubjects, setAllSubjects] = useState<ChartSubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ subject?: string; grade_level?: string }>({});

  const fetchChartData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ONLY fetch from approved courses - this is the source of truth
      const coursesData = await apiService.getApprovedCoursesWithGrades().catch(() => []);
      const validCoursesData = Array.isArray(coursesData) ? coursesData : [];

      console.log('Approved courses data:', validCoursesData);

      // Create a map to store unique subjects with all their details
      const subjectsMap = new Map<string, ChartSubjectData>();

      // Process approved courses - these are the ONLY valid subjects to display
      for (const course of validCoursesData) {
        // Skip courses with null or "Unknown" grade_level
        if (!course.grade_level || course.grade_level === 'Unknown') {
          console.log('Skipping course with invalid grade_level:', course);
          continue;
        }

        const id = course.id;
        const teacher_name = getTeacherName(course.teacher);

        console.log(`Processing approved course: ${id}`, { subject: course.subject, grade_level: course.grade_level, teacher: teacher_name });

        if (!subjectsMap.has(id)) {
          subjectsMap.set(id, {
            id,
            subject: course.subject || 'Unknown',
            grade_level: course.grade_level,
            stream: course.stream,
            teacher_name,
            average_grade: course.overall_grade || 0,
            overall_grade: course.overall_grade || null,
            assignment_average: course.assignment_average,
            exam_average: course.exam_average,
            has_grades: (course.overall_grade || 0) > 0
          });
        } else {
          // Update existing entry with teacher info if not already set
          const existing = subjectsMap.get(id)!;
          if (existing.teacher_name === 'Unknown Teacher' && teacher_name !== 'Unknown Teacher') {
            existing.teacher_name = teacher_name;
          }
        }
      }

      console.log(`Total approved courses after processing: ${subjectsMap.size}`);

      // Convert to sorted array
      const subjectsArray = Array.from(subjectsMap.values())
        .filter(subject => subject.grade_level !== 'Unknown')
        .sort((a, b) => {
          const subjectCompare = a.subject.localeCompare(b.subject);
          if (subjectCompare !== 0) return subjectCompare;
          return (a.grade_level || '').localeCompare(b.grade_level || '');
        });

      console.log('Final subjects array:', subjectsArray);
      setAllSubjects(subjectsArray);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      setAllSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Listen for grade updates
  useEffect(() => {
    const handleGradeEvent = () => {
      fetchChartData();
    };

    const unsubscribeCreated = eventService.subscribe(EVENTS.GRADE_CREATED, handleGradeEvent);
    const unsubscribeUpdated = eventService.subscribe(EVENTS.GRADE_UPDATED, handleGradeEvent);
    const unsubscribeDeleted = eventService.subscribe(EVENTS.GRADE_DELETED, handleGradeEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [fetchChartData]);

  // Apply filters
  const subjects = useMemo(() => {
    return allSubjects.filter(subject => {
      if (filters.subject && subject.subject !== filters.subject) {
        return false;
      }
      if (filters.grade_level && subject.grade_level !== filters.grade_level) {
        return false;
      }
      return true;
    });
  }, [allSubjects, filters]);

  return {
    subjects,
    allSubjects,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchChartData
  };
};

// Helper function to safely get teacher name
function getTeacherName(teacher: any): string {
  try {
    if (!teacher) return 'Unknown Teacher';

    if (typeof teacher === 'string') {
      return teacher.trim() || 'Unknown Teacher';
    }

    if (typeof teacher === 'object') {
      const firstName = (teacher.first_name || '').trim();
      const lastName = (teacher.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Unknown Teacher';
    }
  } catch (e) {
    console.warn('Error getting teacher name:', e);
  }
  return 'Unknown Teacher';
}

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface EnrolledSubjectInfo {
  subject_id: number;
  subject: string;
  grade_level: string;
  teacher_name: string;
  enrolled_date: string;
  course_count: number;
}

export interface UseChildEnrolledSubjectsReturn {
  subjects: EnrolledSubjectInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useChildEnrolledSubjects = (childId: number | null): UseChildEnrolledSubjectsReturn => {
  const [subjects, setSubjects] = useState<EnrolledSubjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!childId) {
      setSubjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Use the unified analytics endpoint
      const response = await apiService.get('/academics/parent-enrolled-subjects-analytics/');

      const families = response.families || [];
      let studentSubjects: any[] = [];

      // Find the specific child across all families
      for (const family of families) {
        if (family.students) {
          const foundStudent = family.students.find((s: any) => s.student_id === childId);
          if (foundStudent && foundStudent.subjects) {
            studentSubjects = foundStudent.subjects;
            break;
          }
        }
      }

      // Transform and organize subjects
      const transformedSubjects: EnrolledSubjectInfo[] = studentSubjects.map((item: any) => ({
        subject_id: item.id || 0,
        subject: item.subject || 'Unknown',
        grade_level: item.grade_level || 'N/A',
        teacher_name: item.teacher?.full_name || (item.teacher?.first_name ? `${item.teacher.first_name} ${item.teacher.last_name}` : 'Unknown'),
        enrolled_date: item.enrolled_date || new Date().toISOString(),
        course_count: 1
      }));

      setSubjects(transformedSubjects);
    } catch (err) {
      console.error('Error fetching enrolled subjects:', err);
      setError('Failed to load enrolled subjects');
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    subjects,
    isLoading,
    error,
    refetch: fetchSubjects
  };
};

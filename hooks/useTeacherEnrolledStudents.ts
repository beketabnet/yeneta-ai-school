import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface EnrolledStudent {
  id: number;
  student_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  student_name?: string;
  email?: string;
  grade_level?: string;
  stream?: string;
  subjects?: EnrolledSubject[];
  courses?: EnrolledCourse[];
}

export interface EnrolledSubject {
  id?: number;
  subject: string;
  grade_level: string;
  stream?: string;
}

export interface EnrolledCourse {
  subject: string;
  grade_level: string;
  stream?: string;
}

export interface UseTeacherEnrolledStudentsReturn {
  students: EnrolledStudent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTeacherEnrolledStudents = (): UseTeacherEnrolledStudentsReturn => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/academics/teacher-enrolled-students/');
      const rawData = Array.isArray(response) ? response : response.data || [];
      
      // Transform backend response to match component expectations
      const transformedData: EnrolledStudent[] = rawData.map((student: any) => {
        const firstName = student.first_name || '';
        const lastName = student.last_name || '';
        const studentName = `${firstName} ${lastName}`.trim() || student.username || 'Unknown Student';
        const gradeLevel = (student.courses && student.courses.length > 0) 
          ? student.courses[0].grade_level 
          : 'N/A';
        
        return {
          id: student.id,
          student_id: student.id,
          username: student.username,
          first_name: firstName,
          last_name: lastName,
          student_name: studentName,
          email: student.email,
          grade_level: gradeLevel,
          subjects: (student.courses || []).map((course: EnrolledCourse) => ({
            id: Math.random(), // Generate temporary ID
            subject: course.subject,
            grade_level: course.grade_level,
            stream: course.stream,
          })),
          courses: student.courses || [],
        };
      });
      
      console.log('Transformed students data:', transformedData);
      setStudents(transformedData);
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      setError('Failed to load enrolled students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    isLoading,
    error,
    refetch: fetchStudents
  };
};

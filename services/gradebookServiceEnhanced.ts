import { apiService } from './apiService';

export interface EnrolledSubjectWithStudents {
  subject_id: number;
  subject_name: string;
  grade_level: string;
  student_count: number;
  average_score?: number;
  students: Array<{
    student_id: number;
    student_name: string;
    username: string;
  }>;
}

export interface StudentForGrading {
  student_id: number;
  student_name: string;
  username: string;
  email?: string;
}

export interface GradeStatistics {
  subject: string;
  total_grades: number;
  average_score: number;
  assignment_count: number;
  exam_count: number;
  assignment_average: number;
  exam_average: number;
}

class GradebookServiceEnhanced {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000;

  private getCacheKey(endpoint: string): string {
    return `gradebook_${endpoint}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  async getTeacherEnrolledSubjectsWithStudents(): Promise<EnrolledSubjectWithStudents[]> {
    const cacheKey = this.getCacheKey('enrolled_subjects_with_students');

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || [];
    }

    try {
      const response = await apiService.get('/academics/teacher-enrolled-subjects-with-students/');
      let subjects = Array.isArray(response) ? response : response?.data || [];

      if (!Array.isArray(subjects)) {
        subjects = [];
      }

      this.cache.set(cacheKey, {
        data: subjects,
        timestamp: Date.now(),
      });

      return subjects;
    } catch (error) {
      console.error('Error fetching enrolled subjects with students:', error);
      return [];
    }
  }

  async getSubjectStudentsForGrading(subjectId: number): Promise<StudentForGrading[]> {
    try {
      const response = await apiService.get(
        `/academics/subject-students-for-grading/${subjectId}/`
      );
      return response.students || [];
    } catch (error) {
      console.error('Error fetching students for grading:', error);
      return [];
    }
  }

  async getStudentGradesForSubject(
    studentId: number,
    subject: string
  ): Promise<any[]> {
    try {
      const response = await apiService.get(
        `/academics/student-grades-for-subject/${studentId}/?subject=${encodeURIComponent(subject)}`
      );
      return response.grades || [];
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return [];
    }
  }

  async saveStudentGrade(gradeData: {
    student_id: number;
    subject: string;
    assignment_type?: string;
    exam_type?: string;
    score: number;
    max_score: number;
    feedback?: string;
  }): Promise<any> {
    try {
      const response = await apiService.post('/academics/save-student-grade/', gradeData);
      // Invalidate cache on success
      this.clearCache();
      return response;
    } catch (error) {
      console.error('Error saving grade:', error);
      throw error;
    }
  }

  async getGradeStatisticsForSubject(subjectName: string): Promise<GradeStatistics | null> {
    try {
      const response = await apiService.get(
        `/academics/grade-statistics-for-subject/${encodeURIComponent(subjectName)}/`
      );
      return response || null;
    } catch (error) {
      console.error('Error fetching grade statistics:', error);
      return null;
    }
  }

  clearCache(endpoint?: string): void {
    if (endpoint) {
      this.cache.delete(this.getCacheKey(endpoint));
    } else {
      this.cache.clear();
    }
  }
}

export const gradebookServiceEnhanced = new GradebookServiceEnhanced();

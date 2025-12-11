import { apiService } from './apiService';

export interface EnrolledSubject {
  subject_id: number;
  subject_name: string;
  grade_level: string;
  student_count: number;
  average_score?: number;
}

export interface SubjectGradeStats {
  subject_id: number;
  subject_name: string;
  grade_level: string;
  student_count: number;
  average_score: number | null;
  graded_count: number;
}

export interface GradeLevel {
  level: string;
  subjects_count: number;
}

class GradebookService {
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

  async getEnrolledSubjects(): Promise<EnrolledSubject[]> {
    const cacheKey = this.getCacheKey('enrolled_subjects');

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || [];
    }

    try {
      const response = await apiService.get('/academics/teacher-enrolled-subjects/');
      let subjects = Array.isArray(response) ? response : response?.data || [];

      if (!Array.isArray(subjects)) {
        subjects = [];
      }

      const formattedSubjects = subjects.map((item: any) => ({
        subject_id: item.subject_id || parseInt(item.subject_name) || Math.random(),
        subject_name: item.subject_name,
        grade_level: item.grade_level || 'N/A',
        student_count: item.student_count || 0,
        average_score: item.average_score,
      }));

      const uniqueSubjects = this.getUniqueSubjects(formattedSubjects);

      this.cache.set(cacheKey, {
        data: uniqueSubjects,
        timestamp: Date.now(),
      });

      return uniqueSubjects;
    } catch (error) {
      console.error('Error fetching enrolled subjects:', error);
      return [];
    }
  }

  private getUniqueSubjects(subjects: EnrolledSubject[]): EnrolledSubject[] {
    const uniqueMap = new Map<string, EnrolledSubject>();

    subjects.forEach(subject => {
      const key = subject.subject_name;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, subject);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
      a.subject_name.localeCompare(b.subject_name)
    );
  }

  async getAvailableGradeLevels(): Promise<string[]> {
    const cacheKey = this.getCacheKey('grade_levels');

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || [];
    }

    try {
      const subjects = await this.getEnrolledSubjects();
      
      const allLevels = Array.from(new Set(subjects.map(s => s.grade_level)))
        .filter(level => level && level !== 'N/A')
        .sort((a, b) => {
          const aNum = a === 'KG' ? -1 : parseInt(a);
          const bNum = b === 'KG' ? -1 : parseInt(b);
          return aNum - bNum;
        });

      this.cache.set(cacheKey, {
        data: allLevels,
        timestamp: Date.now(),
      });

      return allLevels;
    } catch (error) {
      console.error('Error fetching grade levels:', error);
      return [];
    }
  }

  async getSubjectsForGradeLevel(gradeLevel: string): Promise<EnrolledSubject[]> {
    try {
      const subjects = await this.getEnrolledSubjects();
      return subjects.filter(s => s.grade_level === gradeLevel);
    } catch (error) {
      console.error('Error fetching subjects for grade level:', error);
      return [];
    }
  }

  async getSubjectGradeStats(subjectId: number): Promise<SubjectGradeStats | null> {
    try {
      const response = await apiService.get(
        `/academics/subject-grade-summary/${subjectId}/`
      );
      return response || null;
    } catch (error) {
      console.error('Error fetching subject grade stats:', error);
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

  private groupGradesBySubjectAndGrade(
    grades: any[]
  ): Record<string, EnrolledSubject> {
    const grouped: Record<string, EnrolledSubject> = {};
    const studentSubjectMap: Set<string> = new Set();

    grades.forEach(item => {
      const key = `${item.subject}_${item.grade_level || 'N/A'}`;
      const studentKey = `${item.student}_${item.subject}_${item.grade_level}`;

      if (!grouped[key]) {
        grouped[key] = {
          subject_id: parseInt(item.subject) || Math.random(),
          subject_name: item.subject,
          grade_level: item.grade_level || 'N/A',
          student_count: 0,
          average_score: 0,
        };
      }

      if (!studentSubjectMap.has(studentKey)) {
        grouped[key].student_count += 1;
        studentSubjectMap.add(studentKey);
      }
    });

    return grouped;
  }

  private groupSubjectsByName(
    subjects: any[]
  ): Record<string, EnrolledSubject> {
    const grouped: Record<string, EnrolledSubject> = {};

    subjects.forEach(item => {
      const key = `${item.subject_name}_${item.grade_level}`;

      if (!grouped[key]) {
        grouped[key] = {
          subject_id: item.subject_id || Math.random(),
          subject_name: item.subject_name,
          grade_level: item.grade_level,
          student_count: 0,
          average_score: 0,
        };
      }

      grouped[key].student_count += 1;
    });

    return grouped;
  }

  private enrichSubjectData(
    grouped: Record<string, EnrolledSubject>
  ): EnrolledSubject[] {
    return Object.values(grouped).sort((a, b) => {
      const levelDiff = parseInt(a.grade_level) - parseInt(b.grade_level);
      if (levelDiff !== 0) return levelDiff;
      return a.subject_name.localeCompare(b.subject_name);
    });
  }
}

export const gradebookService = new GradebookService();

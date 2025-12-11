import { apiService } from './apiService';
import { LessonContent } from '../contexts/LessonContext';

class LessonService {
  private apiBase = '/api/lessons';

  async saveLessonPlan(lessonData: Partial<LessonContent>): Promise<LessonContent> {
    try {
      const response = await apiService.post(`${this.apiBase}/save`, lessonData);
      return response;
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      throw error;
    }
  }

  async getLessonPlan(lessonId: string): Promise<LessonContent> {
    try {
      const response = await apiService.get(`${this.apiBase}/${lessonId}`);
      return response;
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      throw error;
    }
  }

  async getUserLessons(): Promise<LessonContent[]> {
    try {
      const response = await apiService.get(`${this.apiBase}/my-lessons`);
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      console.error('Error fetching user lessons:', error);
      return [];
    }
  }

  async deleteLessonPlan(lessonId: string): Promise<void> {
    try {
      await apiService.delete(`${this.apiBase}/${lessonId}`);
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  async exportLessonPlan(lessonId: string, format: 'pdf' | 'json' | 'docx' = 'pdf'): Promise<Blob> {
    try {
      const response = await apiService.get(`${this.apiBase}/${lessonId}/export?format=${format}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting lesson plan:', error);
      throw error;
    }
  }

  async shareLessonPlan(lessonId: string, usersToShare: number[]): Promise<void> {
    try {
      await apiService.post(`${this.apiBase}/${lessonId}/share`, {
        user_ids: usersToShare
      });
    } catch (error) {
      console.error('Error sharing lesson plan:', error);
      throw error;
    }
  }

  async recordLessonSession(lessonId: string, sessionData: any): Promise<void> {
    try {
      await apiService.post(`${this.apiBase}/${lessonId}/session`, sessionData);
    } catch (error) {
      console.error('Error recording lesson session:', error);
      throw error;
    }
  }
}

export const lessonService = new LessonService();

import { apiService } from './apiService';

interface TeacherResponse {
  message: string;
  type: 'instruction' | 'question' | 'feedback' | 'encouragement' | 'challenge';
  confidence?: number;
  suggestions?: string[];
}

interface LessonProgress {
  masteryLevel: 'beginning' | 'developing' | 'proficient' | 'advanced';
  score: number;
  recommendations: string[];
  nextSteps: string[];
}

class AITeacherService {
  private apiBase = '/api/ai-teacher';

  async generateTeacherResponse(
    studentInput: string,
    lessonContext: any,
    conversationHistory: any[] = []
  ): Promise<TeacherResponse> {
    try {
      const response = await apiService.post(`${this.apiBase}/respond`, {
        student_input: studentInput,
        lesson_context: lessonContext,
        conversation_history: conversationHistory
      });
      return response;
    } catch (error) {
      console.error('Error generating teacher response:', error);
      return {
        message: 'I understand. Let me help you with that.',
        type: 'instruction',
        confidence: 0.5
      };
    }
  }

  async providePersonalizedFeedback(
    studentResponse: string,
    learningObjective: string,
    gradeLevel: string,
    previousFeedback?: string
  ): Promise<string> {
    try {
      const response = await apiService.post(`${this.apiBase}/feedback`, {
        student_response: studentResponse,
        objective: learningObjective,
        grade_level: gradeLevel,
        previous_feedback: previousFeedback
      });
      return response.feedback || 'Well done! Keep working on mastering this concept.';
    } catch (error) {
      console.error('Error providing feedback:', error);
      return 'Great effort! Continue practicing.';
    }
  }

  async assessStudentUnderstanding(
    lessonId: string,
    responses: any[]
  ): Promise<LessonProgress> {
    try {
      const response = await apiService.post(`${this.apiBase}/assess`, {
        lesson_id: lessonId,
        responses
      });
      return response;
    } catch (error) {
      console.error('Error assessing student understanding:', error);
      return {
        masteryLevel: 'developing',
        score: 60,
        recommendations: ['Continue practicing', 'Review key concepts'],
        nextSteps: ['Complete practice exercises', 'Try harder problems']
      };
    }
  }

  async generateAdaptiveQuestion(
    lessonContext: any,
    difficultyLevel: number = 5,
    studentHistory?: any[]
  ): Promise<string> {
    try {
      const response = await apiService.post(`${this.apiBase}/question`, {
        lesson_context: lessonContext,
        difficulty: difficultyLevel,
        student_history: studentHistory
      });
      return response.question || 'What is your understanding of this concept?';
    } catch (error) {
      console.error('Error generating adaptive question:', error);
      return 'Can you explain what you learned?';
    }
  }

  async getMotivationalMessage(
    engagementLevel: number,
    currentPhase: string
  ): Promise<string> {
    try {
      const response = await apiService.post(`${this.apiBase}/motivation`, {
        engagement_level: engagementLevel,
        phase: currentPhase
      });
      return response.message || 'You\'re doing great! Keep going!';
    } catch (error) {
      console.error('Error getting motivational message:', error);
      return 'You\'re making excellent progress!';
    }
  }

  async generateHint(
    lessonContext: any,
    currentProblem: string,
    attemptCount: number = 1
  ): Promise<string> {
    try {
      const response = await apiService.post(`${this.apiBase}/hint`, {
        lesson_context: lessonContext,
        problem: currentProblem,
        attempts: attemptCount
      });
      return response.hint || 'Try breaking down the problem into smaller steps.';
    } catch (error) {
      console.error('Error generating hint:', error);
      return 'Think about the key concepts we covered.';
    }
  }

  async analyzeEngagement(
    studentExpressions: string[],
    interactionCount: number,
    responseTime: number[]
  ): Promise<{ level: number; suggestions: string[] }> {
    try {
      const response = await apiService.post(`${this.apiBase}/engagement`, {
        expressions: studentExpressions,
        interactions: interactionCount,
        response_times: responseTime
      });
      return response;
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      return {
        level: 50,
        suggestions: ['Try asking questions', 'Take more time to respond']
      };
    }
  }

  async generateSummary(
    lessonId: string,
    interactions: any[]
  ): Promise<{ summary: string; keyPoints: string[]; nextLesson?: string }> {
    try {
      const response = await apiService.post(`${this.apiBase}/summary`, {
        lesson_id: lessonId,
        interactions
      });
      return response;
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: 'Great lesson! You learned important concepts today.',
        keyPoints: ['Review the main points covered'],
        nextLesson: 'Take the practice assessment'
      };
    }
  }
}

export const aiTeacherService = new AITeacherService();

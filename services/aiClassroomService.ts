import { apiService } from './apiService';
import { chapterAwarenessService, ChapterIdentifier } from './chapterAwarenessService';
import { LessonContent } from '../contexts/LessonContext';

export interface AITeacherResponse {
  message: string;
  type: 'instruction' | 'question' | 'feedback' | 'encouragement';
  nextPhase?: string;
  suggestedActivities?: string[];
}

class AIClassroomService {
  private apiBase = '/ai-tools';

  async generateLessonContent(
    subject: string,
    gradeLevel: string,
    topic: string,
    duration: number,
    learningObjectives: string[],
    stream?: string,
    chapter?: string,
    useEthiopianCurriculum?: boolean,
    region?: string
  ): Promise<Partial<LessonContent>> {
    try {
      const parsedChapter = chapter
        ? chapterAwarenessService.parseChapterInput(chapter)
        : null;

      const ragQuery = useEthiopianCurriculum
        ? chapterAwarenessService.buildChapterAwareQuery(
          topic,
          parsedChapter,
          subject,
          gradeLevel
        )
        : undefined;

      const enhancedObjectives =
        learningObjectives && learningObjectives.length > 0
          ? learningObjectives
          : useEthiopianCurriculum && chapter
            ? chapterAwarenessService.extractLearningObjectives(
              chapter,
              topic
            )
            : undefined;

      const response = await apiService.post(`${this.apiBase}/generate-ai-teacher-lesson/`, {
        subject,
        grade_level: gradeLevel,
        topic,
        duration,
        learning_objectives: enhancedObjectives,
        stream,
        chapter: chapter
          ? chapterAwarenessService.normalizeChapterFormat(chapter)
          : undefined,
        use_ethiopian_curriculum: useEthiopianCurriculum,
        rag_query: ragQuery,
        region,
      });
      return response;
    } catch (error) {
      console.error('Error generating lesson content:', error);
      return this.generateDefaultLesson(
        subject,
        gradeLevel,
        topic,
        duration,
        learningObjectives
      );
    }
  }

  async getAITeacherResponse(
    studentMessage: string,
    lessonContent: LessonContent,
    conversationHistory: any[]
  ): Promise<AITeacherResponse> {
    try {
      const response = await apiService.post(`${this.apiBase}/teacher-response`, {
        student_message: studentMessage,
        lesson_context: lessonContent,
        conversation_history: conversationHistory
      });
      return response;
    } catch (error) {
      console.error('Error getting AI teacher response:', error);
      return {
        message: 'I understand. Let\'s continue with the lesson. What would you like to explore next?',
        type: 'instruction'
      };
    }
  }

  async generateFeedback(
    studentResponse: string,
    lessonObjective: string,
    rubric?: string
  ): Promise<string> {
    try {
      const response = await apiService.post(`${this.apiBase}/generate-feedback`, {
        student_response: studentResponse,
        objective: lessonObjective,
        rubric
      });
      return response.feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return 'Great effort! Keep practicing and you\'ll improve.';
    }
  }

  async analyzeLessonProgress(
    lessonId: string,
    studentResponses: any[]
  ): Promise<any> {
    try {
      const response = await apiService.post(`${this.apiBase}/analyze-progress`, {
        lesson_id: lessonId,
        student_responses: studentResponses
      });
      return response;
    } catch (error) {
      console.error('Error analyzing lesson progress:', error);
      return {
        mastery_level: 'developing',
        recommendations: []
      };
    }
  }

  async getNextLessonPhaseGuidance(
    currentPhase: string,
    studentEngagement: number,
    lessonContent: LessonContent
  ): Promise<any> {
    try {
      const response = await apiService.post(`${this.apiBase}/next-phase-guidance`, {
        current_phase: currentPhase,
        student_engagement: studentEngagement,
        lesson_content: lessonContent
      });
      return response;
    } catch (error) {
      console.error('Error getting phase guidance:', error);
      return {
        next_phase: 'explore',
        duration: 10,
        activities: []
      };
    }
  }

  async generateEngagementActivities(
    gradeLevel: string,
    subject: string,
    topic: string,
    engagementLevel: number
  ): Promise<string[]> {
    try {
      const response = await apiService.post(`${this.apiBase}/engagement-activities`, {
        grade_level: gradeLevel,
        subject,
        topic,
        engagement_level: engagementLevel
      });
      return response.activities || [];
    } catch (error) {
      console.error('Error generating engagement activities:', error);
      return ['Interactive discussion', 'Group activity', 'Hands-on experiment'];
    }
  }

  private generateDefaultLesson(
    subject: string,
    gradeLevel: string,
    topic: string,
    duration: number,
    learningObjectives: string[]
  ): Partial<LessonContent> {
    return {
      title: `${subject}: ${topic}`,
      subject,
      gradeLevel,
      objectives: learningObjectives,
      materials: ['Whiteboard', 'Markers', 'Student notebooks'],
      duration,
      content: `This is a ${duration}-minute lesson on ${topic} for ${gradeLevel} students.`,
      activities: [
        'Engage: Introduction to the topic',
        'Explore: Students discover key concepts',
        'Explain: Teacher explains main ideas',
        'Elaborate: Students apply learning',
        'Evaluate: Assessment of understanding'
      ],
      assessmentPlan: 'Formative assessment through questioning and observation',
      fiveESequence: [
        {
          phase: 'Engage',
          duration: 5,
          activities: ['Hook question', 'Visual demonstration'],
          teacherActions: ['Present problem', 'Facilitate discussion'],
          studentActions: ['Observe', 'Brainstorm']
        },
        {
          phase: 'Explore',
          duration: 10,
          activities: ['Guided investigation', 'Data collection'],
          teacherActions: ['Provide materials', 'Facilitate exploration'],
          studentActions: ['Experiment', 'Observe patterns']
        },
        {
          phase: 'Explain',
          duration: 10,
          activities: ['Concept explanation', 'Knowledge building'],
          teacherActions: ['Explain concepts', 'Answer questions'],
          studentActions: ['Take notes', 'Ask clarifying questions']
        },
        {
          phase: 'Elaborate',
          duration: 10,
          activities: ['Application activities', 'Transfer learning'],
          teacherActions: ['Guide practice', 'Provide feedback'],
          studentActions: ['Complete exercises', 'Apply concepts']
        },
        {
          phase: 'Evaluate',
          duration: 10,
          activities: ['Assessment', 'Reflection'],
          teacherActions: ['Conduct assessment', 'Provide feedback'],
          studentActions: ['Respond to assessment', 'Self-reflect']
        }
      ]
    };
  }
}

export const aiClassroomService = new AIClassroomService();

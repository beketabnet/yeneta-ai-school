import React, { createContext, useState, useCallback, ReactNode } from 'react';

export interface LessonContent {
  id?: string;
  title: string;
  subject: string;
  gradeLevel: string;
  objectives: string[];
  materials: string[];
  duration: number;
  content: string;
  activities: string[];
  assessmentPlan: string;
  fiveESequence?: any[];
  differentiationStrategies?: any[];
  resourceConstraints?: any;
  studentReadiness?: any;
  localContext?: any;
  createdAt?: string;
  teacherNotes?: string;
}

export interface LessonContextType {
  currentLesson: LessonContent | null;
  setCurrentLesson: (lesson: LessonContent) => void;
  createLesson: (lessonData: Partial<LessonContent>) => Promise<string>;
  updateLesson: (lesson: LessonContent) => Promise<void>;
  clearLesson: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LessonContext = createContext<LessonContextType | undefined>(undefined);

export const LessonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLesson = useCallback(async (lessonData: Partial<LessonContent>): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const lessonId = `lesson-${Date.now()}`;
      const newLesson: LessonContent = {
        id: lessonId,
        title: lessonData.title || 'Untitled Lesson',
        subject: lessonData.subject || '',
        gradeLevel: lessonData.gradeLevel || '',
        objectives: lessonData.objectives || [],
        materials: lessonData.materials || [],
        duration: lessonData.duration || 45,
        content: lessonData.content || '',
        activities: lessonData.activities || [],
        assessmentPlan: lessonData.assessmentPlan || '',
        createdAt: new Date().toISOString(),
        ...lessonData
      };
      setCurrentLesson(newLesson);
      localStorage.setItem(`lesson-${lessonId}`, JSON.stringify(newLesson));
      return lessonId;
    } catch (err: any) {
      setError(err.message || 'Failed to create lesson');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLesson = useCallback(async (lesson: LessonContent): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      setCurrentLesson(lesson);
      if (lesson.id) {
        localStorage.setItem(`lesson-${lesson.id}`, JSON.stringify(lesson));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update lesson');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLesson = useCallback(() => {
    setCurrentLesson(null);
    setError(null);
  }, []);

  const value: LessonContextType = {
    currentLesson,
    setCurrentLesson,
    createLesson,
    updateLesson,
    clearLesson,
    isLoading,
    error
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};

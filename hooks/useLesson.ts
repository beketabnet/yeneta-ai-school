import { useContext } from 'react';
import { LessonContext, LessonContextType } from '../contexts/LessonContext';

export const useLesson = (): LessonContextType => {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLesson must be used within LessonProvider');
  }
  return context;
};

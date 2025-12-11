import { useContext } from 'react';
import { AIClassroomContext, AIClassroomContextType } from '../contexts/AIClassroomContext';

export const useAIClassroom = (): AIClassroomContextType => {
  const context = useContext(AIClassroomContext);
  if (!context) {
    throw new Error('useAIClassroom must be used within AIClassroomProvider');
  }
  return context;
};

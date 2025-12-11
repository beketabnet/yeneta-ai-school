import React, { useContext, useState } from 'react';
import { View } from '../../../App';
import { LessonContext } from '../../../contexts/LessonContext';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';
import { AuthContext } from '../../../contexts/AuthContext';
import LessonCreator from './LessonCreator';
import VirtualClassroom from '@/components/VirtualClassroom/VirtualClassroom';
import { LessonPlan, LessonStep } from '../../../types';

interface AIClassroomManagerProps {
  onExit: () => void;
  setView?: (view: View) => void;
}

type Screen = 'lessonCreator' | 'virtualClassroom';

const AIClassroomManager: React.FC<AIClassroomManagerProps> = ({ onExit, setView }) => {
  const { currentLesson, clearLesson } = useContext(LessonContext) || {};
  const { logout } = useContext(AuthContext);
  const aiClassroom = useContext(AIClassroomContext);
  const [screen, setScreen] = useState<Screen>('lessonCreator');
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // Auto-start if lesson exists in context (e.g. from LessonPlanner)
  React.useEffect(() => {
    if (currentLesson?.id && screen === 'lessonCreator' && !currentLessonId) {
      setCurrentLessonId(currentLesson.id);
      setScreen('virtualClassroom');
    }
  }, [currentLesson, screen, currentLessonId]);

  const handleLessonCreated = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    setScreen('virtualClassroom');
  };

  const handleExitClassroom = (result?: any) => {
    clearLesson?.();
    aiClassroom?.clearChatHistory();
    aiClassroom?.clearWhiteboard();
    aiClassroom?.clearInteractiveWhiteboard();
    aiClassroom?.updateClassroomState({
      isActive: false,
      studentEngagement: 0,
      webcamActive: false
    });
    // If we are in the standalone flow (checked by not having a setView prop or specific prop?), 
    // strictly speaking, the user said "The logout from 'AI Virtual Classroom' should logout the user".
    // This component is the AI Virtual Classroom wrapper.
    // So we should logout here.
    logout();
    onExit();
  };

  const handleCancelLessonCreation = () => {
    onExit();
  };

  return (
    <>
      {screen === 'lessonCreator' && (
        <LessonCreator
          onLessonCreated={handleLessonCreated}
          onCancel={handleCancelLessonCreation}
        />
      )}

      {screen === 'virtualClassroom' && currentLessonId && currentLesson && (
        <VirtualClassroom
          lessonPlan={{
            ...currentLesson,
            // Ensure steps are parsed from content string if stored there
            steps: typeof currentLesson.content === 'string' && currentLesson.content.startsWith('[')
              ? JSON.parse(currentLesson.content) as LessonStep[]
              : [],
            // Map other disparate fields if necessary
            grade: currentLesson.gradeLevel,
            topic: currentLesson.title // Assuming title maps to topic
          } as unknown as LessonPlan}
          onEndSession={handleExitClassroom}
        />
      )}
    </>
  );
};

export default AIClassroomManager;

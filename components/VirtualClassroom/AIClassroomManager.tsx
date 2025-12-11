import React, { useContext, useState, useEffect } from 'react';
import { View } from '../../App';
import { LessonContext } from '../../contexts/LessonContext';
import { AIClassroomContext } from '../../contexts/AIClassroomContext';
import LessonCreator from './LessonCreator';
import VirtualClassroom from './VirtualClassroom';
import { LessonPlan, LessonStep } from '../../types';

interface AIClassroomManagerProps {
    onExit: () => void;
    setView?: (view: View) => void;
}

type Screen = 'lessonCreator' | 'virtualClassroom';

const AIClassroomManager: React.FC<AIClassroomManagerProps> = ({ onExit, setView }) => {
    const { currentLesson, clearLesson } = useContext(LessonContext) || {};
    const aiClassroom = useContext(AIClassroomContext);
    const [screen, setScreen] = useState<Screen>('lessonCreator');
    const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

    // Debugging: Log currentLesson changes
    useEffect(() => {
        if (currentLesson) {
            console.log('AIClassroomManager: currentLesson updated:', currentLesson);
            if (currentLesson.content) {
                try {
                    const parsedSteps = JSON.parse(currentLesson.content);
                    console.log('AIClassroomManager: Parsed steps length:', Array.isArray(parsedSteps) ? parsedSteps.length : 'Not an array');
                } catch (e) {
                    console.log('AIClassroomManager: Content is not JSON:', currentLesson.content.substring(0, 50) + '...');
                }
            } else {
                console.log('AIClassroomManager: currentLesson has NO content');
            }
        }
    }, [currentLesson]);

    // Auto-start if lesson exists in context (e.g. from LessonPlanner)
    useEffect(() => {
        if (currentLesson?.id && screen === 'lessonCreator' && !currentLessonId) {
            console.log('AIClassroomManager: Auto-starting virtual classroom for lesson', currentLesson.id);
            setCurrentLessonId(currentLesson.id);
            setScreen('virtualClassroom');
        }
    }, [currentLesson, screen, currentLessonId]);

    const handleLessonCreated = (lessonId: string) => {
        setCurrentLessonId(lessonId);
        // Redirect to AI Tutor page instead of virtual classroom
        if (setView) {
            setView('aiTutor');
        } else {
            setScreen('virtualClassroom');
        }
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

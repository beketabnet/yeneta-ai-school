import React, { createContext, useState, useCallback, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  role: 'student' | 'ai-teacher';
  content: string;
  timestamp: string;
  type?: 'text' | 'instruction' | 'question' | 'feedback';
}

export interface WhiteboardElement {
  id: string;
  type: 'text' | 'drawing' | 'shape' | 'image';
  content: string;
  position: { x: number; y: number };
  color?: string;
  size?: number;
}

export interface AIClassroomState {
  isActive: boolean;
  currentPhase: 'engage' | 'explore' | 'explain' | 'elaborate' | 'evaluate';
  studentEngagement: number;
  studentExpressions?: string[];
  webcamActive: boolean;
}

export interface AIClassroomContextType {
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;

  lessonWhiteboard: WhiteboardElement[];
  addWhiteboardElement: (element: WhiteboardElement) => void;
  clearWhiteboard: () => void;

  interactiveWhiteboard: WhiteboardElement[];
  addInteractiveElement: (element: WhiteboardElement) => void;
  clearInteractiveWhiteboard: () => void;

  classroomState: AIClassroomState;
  updateClassroomState: (state: Partial<AIClassroomState>) => void;

  isLoading: boolean;
  error: string | null;
}

export const AIClassroomContext = createContext<AIClassroomContextType | undefined>(undefined);

export const AIClassroomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [lessonWhiteboard, setLessonWhiteboard] = useState<WhiteboardElement[]>([]);
  const [interactiveWhiteboard, setInteractiveWhiteboard] = useState<WhiteboardElement[]>([]);
  const [classroomState, setClassroomState] = useState<AIClassroomState>({
    isActive: false,
    currentPhase: 'engage',
    studentEngagement: 0,
    webcamActive: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  const addWhiteboardElement = useCallback((element: WhiteboardElement) => {
    setLessonWhiteboard(prev => [...prev, element]);
  }, []);

  const clearWhiteboard = useCallback(() => {
    setLessonWhiteboard([]);
  }, []);

  const addInteractiveElement = useCallback((element: WhiteboardElement) => {
    setInteractiveWhiteboard(prev => [...prev, element]);
  }, []);

  const clearInteractiveWhiteboard = useCallback(() => {
    setInteractiveWhiteboard([]);
  }, []);

  const updateClassroomState = useCallback((newState: Partial<AIClassroomState>) => {
    setClassroomState(prev => ({ ...prev, ...newState }));
  }, []);

  const value: AIClassroomContextType = {
    chatHistory,
    addChatMessage,
    clearChatHistory,
    lessonWhiteboard,
    addWhiteboardElement,
    clearWhiteboard,
    interactiveWhiteboard,
    addInteractiveElement,
    clearInteractiveWhiteboard,
    classroomState,
    updateClassroomState,
    isLoading,
    error
  };

  return (
    <AIClassroomContext.Provider value={value}>
      {children}
    </AIClassroomContext.Provider>
  );
};

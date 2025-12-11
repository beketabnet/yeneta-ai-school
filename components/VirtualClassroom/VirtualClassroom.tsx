import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LessonPlan, LessonResult, ChatMessage } from '../../types';
import { LessonStepType, EngagementLevel } from '../../types';
import Whiteboard from './Whiteboard';
import ControlPanel from './ControlPanel';
import ChatPanel from './ChatPanel';
import StudentEngagementMonitor from './StudentEngagementMonitor';
import PerformanceDashboard from './PerformanceDashboard';
import { regenerateStepContent, getAdaptiveSuggestion, generateImage, generateVideoUrl } from '../../services/geminiService';
import { speak, stopSpeaking } from '../../services/speechService';
import { getUserProfile, type UserProfileResponse } from '../../services/apiService';
import { ThumbsUp } from 'lucide-react';
import SmartWhiteboard from './SmartWhiteboard';
import { useImageGeneration } from '../../contexts/ImageGenerationContext';

interface VirtualClassroomProps {
  lessonPlan: LessonPlan;
  onEndSession: (result?: LessonResult) => void;
  isGuest?: boolean;
}

const VirtualClassroom: React.FC<VirtualClassroomProps> = ({ lessonPlan, onEndSession, isGuest = false }) => {
  const { mode: imageGenerationMode, webSearchEnabled } = useImageGeneration();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan>(lessonPlan);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>(EngagementLevel.HIGH);
  const [isAdapting, setIsAdapting] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [suggestionMadeForStep, setSuggestionMadeForStep] = useState<number | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);

  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayProgress, setAutoplayProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const autoplayIntervalRef = useRef<number | null>(null);
  const smartWhiteboardRef = useRef<{
    getCanvasState: () => Promise<{ json: any; image: string }>;
    aiAddText: (text: string, options: any) => void;
    aiAddShape: (shapeType: string, options: any) => void;
    aiAddImage: (imageUrl: string, options: any) => void;
    aiAddVideo: (videoUrl: string, options: any) => void;
    aiClearCanvas: () => void;
  }>(null);

  const currentStep = currentLessonPlan.steps?.[currentStepIndex];

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <p className="text-xl font-semibold mb-2">Loading Lesson...</p>
          <p className="text-gray-500">Please wait while we prepare your classroom.</p>
        </div>
      </div>
    );
  }

  // Load user profile for RAG preferences
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Default to using RAG if profile fails to load (for authenticated users only)
        setUserProfile({ use_rag_ai: !isGuest } as UserProfileResponse);
      }
    };

    // Guest users always use standard AI (no RAG)
    if (isGuest) {
      setUserProfile({ use_rag_ai: false } as UserProfileResponse);
      return;
    }

    // Only load profile for authenticated users
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user.id && user.id !== 0) { // 0 indicates guest
        loadUserProfile();
      } else {
        // Guest user - default to standard AI
        setUserProfile({ use_rag_ai: false } as UserProfileResponse);
      }
    } else {
      // No user info - default to standard AI
      setUserProfile({ use_rag_ai: false } as UserProfileResponse);
    }
  }, [isGuest]);

  const stopAutoplayTimer = () => {
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }
    setAutoplayProgress(0);
  };

  const finishLesson = useCallback(() => {
    stopSpeaking();
    setIsAutoplay(false);
    const totalQuizzes = currentLessonPlan.steps.filter(s => s.type === LessonStepType.QUIZ).length;
    const correctAnswers = quizAnswers.filter(Boolean).length;
    const score = totalQuizzes > 0 ? Math.round((correctAnswers / totalQuizzes) * 100) : 100;
    const xpEarned = 10 + (correctAnswers * 10) + (score === 100 ? 20 : 0);

    const result: LessonResult = {
      id: crypto.randomUUID(),
      topic: currentLessonPlan.topic, subject: currentLessonPlan.subject, grade: currentLessonPlan.grade,
      score, correctAnswers, totalQuizzes,
      completedAt: new Date().toISOString(),
      lessonPlan: currentLessonPlan, xpEarned,
    };

    setLessonResult(result);
    setLessonFinished(true);
  }, [currentLessonPlan, quizAnswers]);


  const handleNextStep = useCallback(() => {
    setHasInteracted(true);
    stopSpeaking();
    stopAutoplayTimer();
    if (currentStepIndex < currentLessonPlan.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      finishLesson();
    }
  }, [currentStepIndex, currentLessonPlan.steps.length, finishLesson]);

  // Autoplay timer effect
  useEffect(() => {
    if (isAutoplay) {
      const stepDurationSeconds = (currentStep.duration || 1) * 60;
      let secondsElapsed = 0;

      autoplayIntervalRef.current = window.setInterval(() => {
        secondsElapsed++;
        setAutoplayProgress((secondsElapsed / stepDurationSeconds) * 100);

        if (secondsElapsed >= stepDurationSeconds) {
          handleNextStep();
        }
      }, 1000);
    } else {
      stopAutoplayTimer();
    }

    return () => {
      stopAutoplayTimer();
    };
  }, [isAutoplay, currentStepIndex, currentStep.duration, handleNextStep]);

  // TTS effect
  useEffect(() => {
    if (!isMuted && hasInteracted) {
      let textToSpeak = currentStep.content;
      if (currentStep.type === LessonStepType.QUIZ && currentStep.quizOptions) {
        textToSpeak += ' Your options are: ' + currentStep.quizOptions.map(o => o.option).join(', ');
      }
      speak(textToSpeak, () => { });
    } else {
      stopSpeaking();
    }
    return () => stopSpeaking();
  }, [currentStepIndex, currentStep, isMuted, hasInteracted]);

  // Adaptive teaching effect for low engagement
  useEffect(() => {
    const handleLowEngagement = async () => {
      if (engagementLevel === EngagementLevel.LOW && !isAdapting && suggestionMadeForStep !== currentStepIndex) {
        setSuggestionMadeForStep(currentStepIndex);
        stopSpeaking();
        setIsAutoplay(false);

        const suggestionText = await getAdaptiveSuggestion(currentStep.content, engagementLevel);

        const suggestionMessage: ChatMessage = {
          sender: 'ai',
          text: suggestionText,
          suggestion: {
            label: "Yes, let's try another way!",
            action: 'regenerate',
          }
        };
        setMessages(prev => [...prev, suggestionMessage]);
      }
    };

    const timer = setTimeout(handleLowEngagement, 2000);
    return () => clearTimeout(timer);
  }, [engagementLevel, currentStepIndex, isAdapting, suggestionMadeForStep, currentStep.content]);

  useEffect(() => {
    setSuggestionMadeForStep(null);
  }, [currentStepIndex]);

  const handlePrevStep = () => {
    setHasInteracted(true);
    stopSpeaking();
    stopAutoplayTimer();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    setQuizAnswers(prev => [...prev, isCorrect]);
    setTimeout(() => {
      handleNextStep();
    }, 2000);
  };

  const handleEngagementChange = useCallback((level: EngagementLevel) => {
    setEngagementLevel(level);
  }, []);

  const handleRaiseHand = () => {
    setHasInteracted(true);
    stopSpeaking();
    setIsAutoplay(false);
    setMessages(prev => [...prev, { sender: 'ai', text: "I see you've raised your hand! What's your question?" }]);
  };

  const handleRegenerate = async () => {
    setHasInteracted(true);
    setIsAdapting(true);
    stopSpeaking();
    const newContent = await regenerateStepContent(currentStep, engagementLevel);
    const newSteps = [...currentLessonPlan.steps];
    newSteps[currentStepIndex] = { ...currentStep, content: newContent };
    setCurrentLessonPlan({ ...currentLessonPlan, steps: newSteps });
    setIsAdapting(false);
  };

  const handleSuggestionAction = (action: 'regenerate') => {
    if (action === 'regenerate') {
      setMessages(prev => [...prev, { sender: 'ai', text: "Great! Let's rephrase this..." }]);
      handleRegenerate();
    }
  };

  const handleEndLesson = useCallback(() => {
    setHasInteracted(true);
    finishLesson();
  }, [finishLesson]);

  const handleToggleMute = () => {
    setHasInteracted(true);
    setIsMuted(prev => !prev);
  }

  const handleAiAddImage = async (prompt: string, options: any) => {
    if (!smartWhiteboardRef.current) return;
    setIsAiGenerating('image');
    try {
      const imageUrl = await generateImage(prompt, imageGenerationMode);
      smartWhiteboardRef.current.aiAddImage(imageUrl, options || {});
      setMessages(prev => [...prev, { sender: 'ai', text: `I've added an image about "${prompt}" to the whiteboard using ${imageGenerationMode} mode!` }]);
    } catch (error: any) {
      console.error("Failed to add AI image to whiteboard:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: error.message || "I tried to create an image, but something went wrong. Try switching image generation modes or check your settings." }]);
    } finally {
      setIsAiGenerating(null);
    }
  };

  const handleAiAddVideo = async (prompt: string, options: any) => {
    if (!smartWhiteboardRef.current) return;
    setIsAiGenerating('video');
    try {
      const videoUrl = await generateVideoUrl(prompt, imageGenerationMode);
      smartWhiteboardRef.current.aiAddVideo(videoUrl, options || {});
      setMessages(prev => [...prev, { sender: 'ai', text: `I've added the video about "${prompt}" to the whiteboard using ${imageGenerationMode} mode!` }]);
    } catch (error: any) {
      console.error("Failed to add AI video to whiteboard:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: error.message || "I tried to create that video, but something went wrong. Try switching to Google AI mode or check your billing settings." }]);
    } finally {
      setIsAiGenerating(null);
    }
  };

  const handleAiToolCall = (toolCall: { name: string; args: any }) => {
    if (!smartWhiteboardRef.current) return;

    switch (toolCall.name) {
      case 'addText':
        smartWhiteboardRef.current.aiAddText(toolCall.args.text, toolCall.args.options || {});
        break;
      case 'addShape':
        smartWhiteboardRef.current.aiAddShape(toolCall.args.shapeType, toolCall.args.options || {});
        break;
      case 'addImage':
        handleAiAddImage(toolCall.args.prompt, toolCall.args.options || {});
        break;
      case 'addVideo':
        handleAiAddVideo(toolCall.args.prompt, toolCall.args.options || {});
        break;
      case 'clearCanvas':
        smartWhiteboardRef.current.aiClearCanvas();
        break;
      default:
        console.warn(`Unknown AI tool called: ${toolCall.name}`);
    }
  };

  const getWhiteboardState = async () => {
    if (smartWhiteboardRef.current) {
      return await smartWhiteboardRef.current.getCanvasState();
    }
    return null;
  };

  if (lessonFinished && lessonResult) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Lesson Complete!</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Here's your performance summary for "{lessonResult.topic}".</p>
        <PerformanceDashboard lessonResult={lessonResult} />
        <div className="mt-8 text-center">
          <button onClick={() => onEndSession(lessonResult)} className="w-full max-w-xs mx-auto flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <ThumbsUp className="h-5 w-5" />
            <span>Finish and Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Whiteboard step={currentStep} onQuizAnswer={handleQuizAnswer} isAdapting={isAdapting} />
          <ControlPanel
            currentStepIndex={currentStepIndex}
            totalSteps={currentLessonPlan.steps.length}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onEndSession={handleEndLesson}
            onRegenerate={handleRegenerate}
            isAdapting={isAdapting}
            isAutoplay={isAutoplay}
            onToggleAutoplay={() => { setHasInteracted(true); setIsAutoplay(prev => !prev); }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            autoplayProgress={autoplayProgress}
          />
          <SmartWhiteboard ref={smartWhiteboardRef} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ChatPanel
            messages={messages} setMessages={setMessages}
            lessonContext={`${currentLessonPlan.topic} - ${currentStep.title}`}
            onRaiseHand={handleRaiseHand}
            onSuggestionAction={handleSuggestionAction}
            onAiToolCall={handleAiToolCall}
            getWhiteboardState={getWhiteboardState}
            useRag={isGuest ? false : (userProfile?.use_rag_ai ?? true)}
            useWebSearch={webSearchEnabled}
          />
          <StudentEngagementMonitor onEngagementChange={handleEngagementChange} />
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroom;
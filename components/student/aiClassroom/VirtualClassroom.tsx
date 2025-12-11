import React, { useContext, useState, useEffect } from 'react';
import { LessonContext } from '../../../contexts/LessonContext';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';
import LessonWhiteboard from './LessonWhiteboard';
import InteractiveWhiteboard from './InteractiveWhiteboard';
import ChatInterface from './ChatInterface';
import EngagementMonitor from './EngagementMonitor';
import LessonNavigation from './LessonNavigation';
import Spinner from '../../common/Spinner';

interface VirtualClassroomProps {
  lessonId: string;
  onExit: () => void;
}

const VirtualClassroom: React.FC<VirtualClassroomProps> = ({ lessonId, onExit }) => {
  const { currentLesson } = useContext(LessonContext) || {};
  const aiClassroom = useContext(AIClassroomContext);
  const [isLoading, setIsLoading] = useState(!currentLesson);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'focus'>('grid');

  useEffect(() => {
    if (currentLesson) {
      setIsLoading(false);
      aiClassroom?.updateClassroomState({ isActive: true });
    }
  }, [currentLesson, aiClassroom]);

  if (isLoading || !currentLesson) {
    return <Spinner />;
  }

  const phases = ['engage', 'explore', 'explain', 'elaborate', 'evaluate'] as const;
  const currentPhaseIndex = phases.indexOf(aiClassroom?.classroomState.currentPhase || 'engage');

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentLesson.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentLesson.subject} • Grade {currentLesson.gradeLevel}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setLayoutMode('focus')}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  layoutMode === 'focus'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                }`}
              >
                Focus
              </button>
            </div>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Exit Class
            </button>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="mt-4 flex gap-2">
          {phases.map((phase, index) => (
            <div
              key={phase}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index <= currentPhaseIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Current Phase: <span className="font-semibold capitalize">{aiClassroom?.classroomState.currentPhase}</span>
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
            {/* Lesson Whiteboard */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <LessonWhiteboard lesson={currentLesson} />
              </div>

              {/* Interactive Whiteboard */}
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <InteractiveWhiteboard lessonId={lessonId} />
              </div>
            </div>

            {/* Right Panel: Chat + Engagement */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                <ChatInterface lessonId={lessonId} currentLesson={currentLesson} />
              </div>

              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <EngagementMonitor lessonId={lessonId} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-full">
            {/* Focus on Chat */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              <ChatInterface lessonId={lessonId} currentLesson={currentLesson} expanded />
            </div>

            {/* Side panels */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <EngagementMonitor lessonId={lessonId} />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <LessonNavigation currentLesson={currentLesson} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Navigation Footer */}
      {layoutMode === 'grid' && (
        <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <LessonNavigation currentLesson={currentLesson} />
        </div>
      )}
    </div>
  );
};

export default VirtualClassroom;

import React, { useContext } from 'react';
import { LessonContent } from '../../../contexts/LessonContext';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';

interface LessonNavigationProps {
  currentLesson: LessonContent;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({ currentLesson }) => {
  const aiClassroom = useContext(AIClassroomContext);

  const phases = [
    { name: 'engage' as const, title: 'Engage', duration: 5, description: 'Hook & Interest' },
    { name: 'explore' as const, title: 'Explore', duration: 10, description: 'Discovery' },
    { name: 'explain' as const, title: 'Explain', duration: 10, description: 'Teach' },
    { name: 'elaborate' as const, title: 'Elaborate', duration: 10, description: 'Apply' },
    { name: 'evaluate' as const, title: 'Evaluate', duration: 10, description: 'Assess' }
  ];

  const handlePhaseChange = (phase: typeof phases[0]['name']) => {
    aiClassroom?.updateClassroomState({
      currentPhase: phase
    });
  };

  const currentPhaseIndex = phases.findIndex(p => p.name === aiClassroom?.classroomState.currentPhase);

  return (
    <div className="flex flex-col gap-4">
      {/* Phase Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map((phase, index) => (
          <button
            key={phase.name}
            onClick={() => handlePhaseChange(phase.name)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-semibold transition-all text-center whitespace-nowrap ${
              aiClassroom?.classroomState.currentPhase === phase.name
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : index <= currentPhaseIndex
                ? 'bg-blue-200 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="text-xs">{phase.title}</div>
            <div className="text-lg">{phase.duration}m</div>
          </button>
        ))}
      </div>

      {/* Current Phase Info */}
      {currentPhaseIndex >= 0 && currentPhaseIndex < phases.length && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {phases[currentPhaseIndex].title}: {phases[currentPhaseIndex].description}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Est. duration: {phases[currentPhaseIndex].duration} minutes
          </p>
        </div>
      )}

      {/* Total Lesson Time */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Lesson Time</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {currentLesson.duration} minutes
        </p>
      </div>
    </div>
  );
};

export default LessonNavigation;

import React, { useContext, useState } from 'react';
import { LessonContent } from '../../../contexts/LessonContext';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';
import MarkdownRenderer from '../../common/MarkdownRenderer';

interface LessonWhiteboardProps {
  lesson: LessonContent;
}

const LessonWhiteboard: React.FC<LessonWhiteboardProps> = ({ lesson }) => {
  const aiClassroom = useContext(AIClassroomContext);
  const [activeTab, setActiveTab] = useState<'content' | 'objectives' | 'activities'>('content');

  const phases = [
    { name: 'engage', title: 'Engage', icon: '🔥', description: 'Hook and interest students' },
    { name: 'explore', title: 'Explore', icon: '🔍', description: 'Hands-on discovery' },
    { name: 'explain', title: 'Explain', icon: '💡', description: 'Teach core concepts' },
    { name: 'elaborate', title: 'Elaborate', icon: '🎯', description: 'Apply learning' },
    { name: 'evaluate', title: 'Evaluate', icon: '✓', description: 'Assess understanding' }
  ];

  const currentPhase = phases.find(p => p.name === aiClassroom?.classroomState.currentPhase);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 border-b border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Lesson Whiteboard</h2>
            <p className="text-sm text-blue-100">
              {currentPhase && (
                <>
                  {currentPhase.icon} {currentPhase.title} - {currentPhase.description}
                </>
              )}
            </p>
          </div>
          <div className="text-3xl">{currentPhase?.icon}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'content'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('objectives')}
          className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'objectives'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
        >
          Objectives
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'activities'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
        >
          Activities
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'content' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Lesson Content
            </h3>
            {lesson.fiveESequence && lesson.fiveESequence.length > 0 ? (
              <div className="space-y-4">
                {lesson.fiveESequence.map((phase, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${aiClassroom?.classroomState.currentPhase === phase.phase.toLowerCase()
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {phase.phase} ({phase.duration} mins)
                    </h4>
                    <ul className="space-y-2">
                      {phase.activities.map((activity, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                          • {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <MarkdownRenderer content={lesson.content || ''} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'objectives' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Learning Objectives
            </h3>
            <ul className="space-y-3">
              {lesson.objectives.map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900"
                >
                  <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓</span>
                  <span className="text-gray-800 dark:text-gray-200">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Lesson Activities
            </h3>
            <div className="space-y-3">
              {lesson.activities && lesson.activities.length > 0 ? (
                lesson.activities.map((activity, index) => (
                  <div
                    key={index}
                    className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-900"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Activity {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {activity}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No activities defined</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Info */}
      <div className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Subject</p>
            <p className="font-semibold text-gray-900 dark:text-white">{lesson.subject}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Duration</p>
            <p className="font-semibold text-gray-900 dark:text-white">{lesson.duration} minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonWhiteboard;

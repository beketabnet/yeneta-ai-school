import React, { useContext, useState } from 'react';
import { LessonContext, LessonContent } from '../../../contexts/LessonContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { MoonIcon, SunIcon } from '../../icons/Icons';
import { aiClassroomService } from '../../../services/aiClassroomService';
import EnhancedLessonConfigForm, {
  LessonConfig,
} from './EnhancedLessonConfigForm';
import Spinner from '../../common/Spinner';

interface LessonCreatorProps {
  onLessonCreated: (lessonId: string) => void;
  onCancel: () => void;
  variant?: 'page' | 'embedded'; // 'page' implies full background/layout control, 'embedded' delegates to parent
}

const LessonCreator: React.FC<LessonCreatorProps> = ({
  onLessonCreated,
  onCancel,
  variant = 'page',
}) => {
  const { createLesson } = useContext(LessonContext) || {};
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [step, setStep] = useState<'form' | 'generating'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<LessonConfig | null>(null);

  const handleGenerateLesson = async (config: LessonConfig) => {
    setCurrentConfig(config);
    setStep('generating');
    setIsLoading(true);

    try {
      const generatedContent =
        await aiClassroomService.generateLessonContent(
          config.subject || 'General',
          config.gradeLevel,
          config.topic,
          config.duration,
          config.objectives.filter((obj) => obj.trim()),
          config.stream,
          config.chapter,
          config.useEthiopianCurriculum,
          config.region
        );

      const lessonId = await createLesson?.({
        ...generatedContent,
        subject: config.subject || 'General',
        gradeLevel: config.gradeLevel,
        duration: config.duration,
        title: config.topic,
        localContext: {
          chapter: config.chapter,
          region: config.region,
          stream: config.stream
        },
      });

      if (lessonId) {
        onLessonCreated(lessonId);
      }
    } catch (error) {
      console.error('Failed to create lesson:', error);
      alert('Failed to create lesson. Please try again.');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'generating' && isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${variant === 'page' ? 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800' : 'h-full py-12'}`}>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md mx-auto text-center border border-white/20">
          <Spinner />
          <h3 className="mt-8 text-xl font-bold text-gray-900 dark:text-white">
            Crafting Your Lesson
          </h3>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Our AI is analyzing {currentConfig?.useEthiopianCurriculum ? 'Ethiopian curriculum standards' : 'global educational standards'} to build a personalized plan for <strong>{currentConfig?.topic}</strong>.
          </p>
          <div className="mt-6 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={variant === 'page' ? "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-6" : "w-full"}>
      <div className={variant === 'page' ? "max-w-4xl mx-auto" : ""}>
        <EnhancedLessonConfigForm
          onConfigChange={setCurrentConfig}
          onGenerateLesson={handleGenerateLesson}
          isLoading={isLoading}
          onBack={onCancel}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    </div>
  );
};

export default LessonCreator;

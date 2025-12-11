import React, { useContext, useState } from 'react';
import { LessonContext, LessonContent } from '../../contexts/LessonContext';
import { aiClassroomService } from '../../services/aiClassroomService';
import EnhancedLessonConfigForm, { LessonConfig } from '@/components/VirtualClassroom/EnhancedLessonConfigForm';
import Spinner from '../common/Spinner';

interface LessonCreatorProps {
    onLessonCreated: (lessonId: string) => void;
    onCancel: () => void;
}

const LessonCreator: React.FC<LessonCreatorProps> = ({
    onLessonCreated,
    onCancel,
}) => {
    const { createLesson } = useContext(LessonContext) || {};
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
                    config.useEthiopianCurriculum
                );

            const lessonId = await createLesson?.({
                ...generatedContent,
                subject: config.subject || 'General',
                gradeLevel: config.gradeLevel,
                duration: config.duration,
                title: config.topic,
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
                <Spinner />
                <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
                    Generating your personalized lesson...
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This may take a moment. We're extracting content from Ethiopian
                    curriculum textbooks and creating engaging lesson material.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-4xl mx-auto">
                <EnhancedLessonConfigForm
                    onConfigChange={setCurrentConfig}
                    onGenerateLesson={handleGenerateLesson}
                    isLoading={isLoading}
                    onBack={onCancel}
                />
            </div>
        </div>
    );
};

export default LessonCreator;

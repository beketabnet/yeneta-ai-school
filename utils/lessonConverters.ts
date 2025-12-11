import { LessonPlan, LessonStep, LessonStepType, FiveEPhase } from '../types';

export const convertFiveEToSteps = (fiveESequence?: FiveEPhase[]): LessonStep[] => {
    if (!fiveESequence || fiveESequence.length === 0) return [];

    return fiveESequence.map(phase => {
        const content = [
            `**Activities:**\n${phase.activities.map(a => `- ${a}`).join('\n')}`,
            phase.teacherActions && phase.teacherActions.length > 0 ? `\n**Teacher Actions:**\n${phase.teacherActions.map(a => `- ${a}`).join('\n')}` : '',
            phase.studentActions && phase.studentActions.length > 0 ? `\n**Student Actions:**\n${phase.studentActions.map(a => `- ${a}`).join('\n')}` : ''
        ].filter(Boolean).join('\n\n');

        return {
            title: phase.phase,
            type: LessonStepType.LECTURE, // Default type, can be refined if needed
            content: content,
            duration: phase.duration,
            quizOptions: []
        };
    });
};

import { LessonPlan } from '../types';

export const generateLessonPlanTextContent = (plan: LessonPlan): string => {
    let content = '';
    
    content += `LESSON PLAN\n`;
    content += `${'='.repeat(80)}\n\n`;
    
    content += `Title: ${plan.title}\n`;
    content += `Grade Level: ${plan.grade}\n`;
    content += `Subject: ${plan.subject}\n`;
    content += `Duration: ${plan.duration} minutes\n`;
    if (plan.moeStandardId) {
        content += `MoE Standard ID: ${plan.moeStandardId}\n`;
    }
    content += `\n`;
    
    if (plan.objectives && plan.objectives.length > 0) {
        content += `LEARNING OBJECTIVES\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.objectives.forEach((obj, idx) => {
            content += `${idx + 1}. ${obj}\n`;
        });
        content += `\n`;
    }
    
    if (plan.materials && plan.materials.length > 0) {
        content += `MATERIALS NEEDED\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.materials.forEach((material) => {
            content += `• ${material}\n`;
        });
        content += `\n`;
    }
    
    if (plan.fiveESequence && plan.fiveESequence.length > 0) {
        content += `INSTRUCTIONAL SEQUENCE (5E Model)\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.fiveESequence.forEach((phase) => {
            content += `\n${phase.phase.toUpperCase()} (${phase.duration} min):\n`;
            if (phase.activities.length > 0) {
                content += `Activities:\n`;
                phase.activities.forEach(act => content += `  • ${act}\n`);
            }
        });
        content += `\n`;
    } else if (plan.activities && plan.activities.length > 0) {
        content += `MAIN ACTIVITIES\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.activities.forEach((activity, idx) => {
            if (typeof activity === 'string') {
                content += `\nActivity ${idx + 1}:\n${activity}\n`;
            } else {
                content += `\nActivity ${idx + 1} (${activity.duration} min):\n`;
                content += `${activity.description}\n`;
            }
        });
        content += `\n`;
    }
    
    if (plan.assessmentPlan) {
        content += `ASSESSMENT\n`;
        content += `${'-'.repeat(80)}\n`;
        if (plan.assessmentPlan.formativeChecks && plan.assessmentPlan.formativeChecks.length > 0) {
            content += `Formative Checks:\n`;
            plan.assessmentPlan.formativeChecks.forEach(check => content += `  • ${check}\n`);
        }
        if (plan.assessmentPlan.summativeTask) {
            content += `Summative Task: ${plan.assessmentPlan.summativeTask}\n`;
        }
        content += `\n`;
    } else if (plan.assessment) {
        content += `ASSESSMENT\n`;
        content += `${'-'.repeat(80)}\n`;
        content += `${plan.assessment}\n\n`;
    }
    
    if (plan.differentiationStrategies && plan.differentiationStrategies.length > 0) {
        content += `DIFFERENTIATION\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.differentiationStrategies.forEach((strategy) => {
            content += `${strategy.level}:\n`;
            if (strategy.contentAdaptations) {
                strategy.contentAdaptations.forEach(adapt => content += `  • ${adapt}\n`);
            }
        });
        content += `\n`;
    }
    
    if (plan.homework) {
        content += `HOMEWORK\n`;
        content += `${'-'.repeat(80)}\n`;
        content += `${plan.homework}\n\n`;
    }
    
    if (plan.reflectionPrompts && plan.reflectionPrompts.length > 0) {
        content += `TEACHER REFLECTION\n`;
        content += `${'-'.repeat(80)}\n`;
        plan.reflectionPrompts.forEach((prompt, idx) => {
            content += `${idx + 1}. ${prompt}\n`;
        });
        content += `\n`;
    } else if (plan.teacherNotes) {
        content += `TEACHER NOTES\n`;
        content += `${'-'.repeat(80)}\n`;
        content += `${plan.teacherNotes}\n\n`;
    }
    
    return content;
};

export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[^a-z0-9_\-\.]/gi, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
};

export const getMimeType = (format: string): string => {
    const mimeTypes: { [key: string]: string } = {
        'txt': 'text/plain',
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[format] || 'application/octet-stream';
};

export const saveWithFilePicker = async (
    content: string | Blob,
    filename: string,
    mimeType: string
): Promise<void> => {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'File',
                    accept: { [mimeType]: [`.${filename.split('.').pop()}`] }
                }]
            });
            
            const writable = await handle.createWritable();
            
            if (typeof content === 'string') {
                await writable.write(content);
            } else {
                await writable.write(content);
            }
            
            await writable.close();
        } catch (err: any) {
            if (err.name === 'AbortError') {
                throw new Error('Save cancelled by user');
            }
            throw err;
        }
    } else {
        await downloadFile(content, filename, mimeType);
    }
};

export const downloadFile = async (
    content: string | Blob,
    filename: string,
    mimeType: string
): Promise<void> => {
    let blob: Blob;
    
    if (typeof content === 'string') {
        blob = new Blob([content], { type: mimeType });
    } else {
        blob = content;
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

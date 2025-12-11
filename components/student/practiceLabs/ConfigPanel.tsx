import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PracticeConfig, QuestionMode, Difficulty, CoachPersonality } from './types';
import { apiService } from '../../../services/apiService';
import SubjectModeConfig from './SubjectModeConfig';
import RandomModeConfig from './RandomModeConfig';
import DiagnosticModeConfig from './DiagnosticModeConfig';
import MatricExamConfig from './MatricExamConfig';
import ModelExamConfig from './ModelExamConfig';
import { AdjustmentsHorizontalIcon, AcademicCapIcon, BookOpenIcon, BeakerIcon } from '../../icons/Icons';

interface ConfigPanelProps {
    config: PracticeConfig;
    onConfigChange: (config: Partial<PracticeConfig>) => void;
    onStartPractice: () => void;
    isGenerating: boolean;
    regions: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    streams: { id: number; name: string }[];
    getSubjectsFor: (region?: string, grade?: string, stream?: string, useRAG?: boolean) => Promise<string[]>;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
    config,
    onConfigChange,
    onStartPractice,
    isGenerating,
    regions,
    gradeLevels,
    streams,
    getSubjectsFor
}) => {
    // Dynamic curriculum state
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [isStreamRequired, setIsStreamRequired] = useState(false);
    const [curriculumConfig, setCurriculumConfig] = useState<any>(null);

    // Track previous grade/stream to avoid unnecessary fetches
    const prevGradeRef = useRef<number | string | null>(null);
    const prevStreamRef = useRef<string | null>(null);
    const isInitialMount = useRef(true);
    const currentSubjectRef = useRef<string>('');

    const topicsBySubject: Record<string, string[]> = {
        'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'],
        'Physics': ['Mechanics', 'Electricity', 'Magnetism', 'Optics', 'Thermodynamics'],
        'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
        'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Human Anatomy', 'Botany'],
        'English': ['Grammar', 'Literature', 'Writing', 'Reading Comprehension'],
        'History': ['Ancient History', 'Modern History', 'Ethiopian History', 'World History'],
        'Geography': ['Physical Geography', 'Human Geography', 'Ethiopian Geography'],
        'Amharic': ['Grammar', 'Literature', 'Writing'],
        'Economics': ['Microeconomics', 'Macroeconomics', 'International Trade', 'Economic Development'],
        'Citizenship Education': ['Ethiopian Constitution', 'Human Rights', 'Civic Engagement'],
        'Information Technology': ['Computer Science', 'Information Systems', 'Networking', 'Cybersecurity'],
        'Health and Physical Education': ['Anatomy', 'Physiology', 'Nutrition', 'Fitness'],
        'Performing & Visual Arts': ['Music', 'Theater', 'Dance', 'Visual Arts'],
        'Career and Technical Education': ['Agriculture', 'Business', 'Health Science', 'Technology'],
        'General Science': ['Biology', 'Chemistry', 'Physics', 'Earth Science'],
        'Environmental Science': ['Ecology', 'Conservation', 'Sustainability', 'Climate Change'],
        'Social Studies': ['History', 'Geography', 'Economics', 'Government'],
        'Integrated Science': ['Biology', 'Chemistry', 'Physics', 'Earth Science'],
        'Agriculture': ['Crop Production', 'Animal Science', 'Soil Science', 'Agricultural Economics'],
        'Moral Education': ['Ethics', 'Morality', 'Values', 'Character Development']
    };

    // Fetch curriculum configuration on mount
    useEffect(() => {
        const fetchCurriculumConfig = async () => {
            try {
                const config = await apiService.getCurriculumConfig();
                setCurriculumConfig(config);
            } catch (err) {
                console.error('Failed to fetch curriculum config:', err);
            }
        };
        fetchCurriculumConfig();
    }, []);

    // Update subject ref whenever config.subject changes
    useEffect(() => {
        currentSubjectRef.current = config.subject;
    }, [config.subject]);

    // Fetch subjects when grade or stream changes
    const fetchSubjectsForGrade = useCallback(async (grade: number | string, stream?: string, shouldResetSubject: boolean = true) => {
        try {
            const gradeStr = grade === 'KG' ? 'KG' : `Grade ${grade}`;
            const subjects = await getSubjectsFor(
                config.region || undefined,
                gradeStr,
                stream && stream !== 'N/A' ? stream : undefined,
                config.useCurriculumRAG // Pass the RAG filter state
            );

            setAvailableSubjects(subjects || []);

            // Determine stream requirement based on grade (simple logic for now)
            // Ideally this should come from getSubjectsFor or similar, but for now:
            const isGrade11Or12 = grade === 11 || grade === 12 || grade === 'Grade 11' || grade === 'Grade 12';
            setIsStreamRequired(isGrade11Or12);

            // Reset subject ONLY if it's not in the new list AND we should reset
            const currentSubject = currentSubjectRef.current;
            if (shouldResetSubject && currentSubject && subjects && subjects.length > 0 && !subjects.includes(currentSubject)) {
                console.log('Subject not in new list, resetting:', currentSubject);
                onConfigChange({ subject: '' });
            }
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
            setAvailableSubjects([]);
        }
    }, [onConfigChange, getSubjectsFor, config.region]);

    // Load subjects when grade level or stream changes (but NOT when subject changes)
    useEffect(() => {
        if (config.gradeLevel) {
            const streamParam = (config.gradeLevel === 11 || config.gradeLevel === 12) && config.stream && config.stream !== 'N/A'
                ? config.stream
                : undefined;

            // On initial mount, just set the refs and fetch subjects without resetting subject
            if (isInitialMount.current) {
                console.log('Initial mount, fetching subjects for:', config.gradeLevel, streamParam);
                fetchSubjectsForGrade(config.gradeLevel, streamParam, false); // Don't reset subject on initial load
                prevGradeRef.current = config.gradeLevel;
                prevStreamRef.current = streamParam || null;
                isInitialMount.current = false;
                return;
            }

            // Only fetch if grade or stream actually changed after initial mount
            const gradeChanged = prevGradeRef.current !== config.gradeLevel;
            const streamChanged = prevStreamRef.current !== streamParam;

            if (gradeChanged || streamChanged) {
                console.log('Grade or stream changed, fetching subjects:', config.gradeLevel, streamParam);
                fetchSubjectsForGrade(config.gradeLevel, streamParam, true); // Reset subject if not in new list
                prevGradeRef.current = config.gradeLevel;
                prevStreamRef.current = streamParam || null;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.gradeLevel, config.stream, config.region, config.useCurriculumRAG]);

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-violet-500" />
                Practice Configuration
            </h3>

            {/* Question Mode Selection */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Select Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: 'subject', label: 'Subject-Based', icon: '📚' },
                        { id: 'random', label: 'Random', icon: '🎲' },
                        { id: 'diagnostic', label: 'Diagnostic', icon: '🎯' },
                        { id: 'matric', label: 'Grade 12 Matric', icon: '🎓' },
                        { id: 'model', label: 'Grade 12 Model', icon: '📝' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => {
                                let updates: any = { questionMode: mode.id };
                                if (mode.id === 'matric' || mode.id === 'model') {
                                    updates.gradeLevel = 12;
                                }
                                onConfigChange(updates);
                            }}
                            className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center gap-2 ${config.questionMode === mode.id
                                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white border-transparent shadow-lg shadow-violet-500/30'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                                }`}
                        >
                            <span className="text-lg">{mode.icon}</span>
                            {mode.label}
                            {config.questionMode === mode.id && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Configuration Components */}
            <div className="space-y-6">
                {config.questionMode === 'subject' && (
                    <SubjectModeConfig
                        config={config}
                        onConfigChange={onConfigChange}
                        availableSubjects={availableSubjects}
                        curriculumConfig={curriculumConfig}
                        topicsBySubject={topicsBySubject}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                    />
                )}

                {config.questionMode === 'random' && (
                    <RandomModeConfig
                        config={config}
                        onConfigChange={onConfigChange}
                        curriculumConfig={curriculumConfig}
                        availableSubjects={availableSubjects}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                    />
                )}

                {config.questionMode === 'diagnostic' && (
                    <DiagnosticModeConfig
                        config={config}
                        onConfigChange={onConfigChange}
                        curriculumConfig={curriculumConfig}
                        availableSubjects={availableSubjects}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                    />
                )}

                {config.questionMode === 'matric' && (
                    <MatricExamConfig
                        config={config}
                        onConfigChange={onConfigChange}
                        availableSubjects={availableSubjects}
                        curriculumConfig={curriculumConfig}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                    />
                )}

                {config.questionMode === 'model' && (
                    <ModelExamConfig
                        config={config}
                        onConfigChange={onConfigChange}
                        availableSubjects={availableSubjects}
                        curriculumConfig={curriculumConfig}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                    />
                )}
            </div>

            {/* Start Button */}
            <div className="mt-8">
                <button
                    onClick={onStartPractice}
                    disabled={
                        isGenerating ||
                        (config.questionMode === 'subject' && !config.subject) ||
                        (config.questionMode === 'matric' && !config.subject) ||
                        (config.questionMode === 'model' && !config.subject)
                    }
                    className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-violet-500/25 font-bold text-lg flex items-center justify-center gap-3"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Generating Question...</span>
                        </>
                    ) : (
                        <>
                            <span>🚀</span>
                            <span>
                                {config.questionMode === 'diagnostic' ? 'Start Diagnostic Test' :
                                    config.questionMode === 'matric' ? 'Generate Matric Exam Question' :
                                        config.questionMode === 'model' ? 'Generate Model Exam Question' :
                                            'Generate Practice Question'}
                            </span>
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
                    {isGenerating ? 'AI is crafting your question...' : 'Click to start your practice session'}
                </p>
            </div>
        </div>
    );
};

export default ConfigPanel;

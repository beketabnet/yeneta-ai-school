import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCurriculum } from '../../hooks/useCurriculum';
import Card from '../Card';
import { LessonPlan, SavedLessonPlan, ResourceConstraints, StudentReadiness, LocalContext } from '../../types';
import { apiService } from '../../services/apiService';
import { BookOpenIcon, ChevronDownIcon, ChevronUpIcon, SaveIcon, DownloadIcon, SparklesIcon } from '../icons/Icons';
import SaveLessonPlanModal, { SaveLessonPlanFormat } from './lessonplanner/SaveLessonPlanModal';
import { generateLessonPlanTextContent, sanitizeFilename, getMimeType, saveWithFilePicker, downloadFile } from '../../utils/lessonPlanExportUtils';
import Toast from '../common/Toast';
import ReactMarkdown from 'react-markdown';
import GirlReadingAnimation from './GirlReadingAnimation';

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; label: string }> = ({ isEnabled, onToggle, label }) => (
    <div className="flex items-center cursor-pointer" onClick={onToggle}>
        <button
            type="button"
            className={`${isEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            aria-pressed={isEnabled}
        >
            <span className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-sm`} />
        </button>
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 select-none group-hover:text-indigo-600">{label}</span>
    </div>
);


interface LessonPlannerProps {
    loadedPlan?: SavedLessonPlan | null;
    onPlanLoaded?: () => void;
    onPlanSaved?: (planId: number) => void;
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ loadedPlan, onPlanLoaded, onPlanSaved }) => {
    // Basic lesson information
    const [topic, setTopic] = useState("");
    const [region, setRegion] = useState("Addis Ababa");
    const [gradeLevel, setGradeLevel] = useState("Grade 7");
    const [stream, setStream] = useState("");
    const [subject, setSubject] = useState("");
    const [objectives, setObjectives] = useState("");
    const [duration, setDuration] = useState(45);
    const [moeStandardId, setMoeStandardId] = useState("");
    const [chapter, setChapter] = useState("");

    // Extraction state
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [showExtractedContent, setShowExtractedContent] = useState(false);
    const [extractedChapters, setExtractedChapters] = useState<{ number: string | number; title: string; label?: string }[]>([]);
    const [isExtractingChapters, setIsExtractingChapters] = useState(false);

    // Save/Export modals
    const [showSavePlanModal, setShowSavePlanModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isSavingFile, setIsSavingFile] = useState(false);
    const [isExportingFile, setIsExportingFile] = useState(false);
    const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
    const [toastState, setToastState] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Resource constraints
    const [resourceConstraints, setResourceConstraints] = useState<ResourceConstraints>({
        availableMaterials: ['Textbook', 'Chalk/Whiteboard', 'Notebooks'],
        internetAccess: false,
        electricityAccess: true,
        fieldTripAvailable: false,
        budgetLimit: 'Very Low',
        classSize: 40
    });

    // Student readiness
    const [studentReadiness, setStudentReadiness] = useState<StudentReadiness>({
        averagePriorKnowledge: 'Medium',
        commonMisconceptions: [],
        specialNeedsGroups: []
    });

    // Local context
    const [localContext, setLocalContext] = useState<LocalContext>({
        region: 'Urban',
        dominantEconomy: '',
        culturalConsiderations: []
    });

    // UI state
    const [plan, setPlan] = useState<LessonPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useRAG, setUseRAG] = useState(true);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    // Curriculum Hook
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();

    // Note Generation state
    const [generatedNote, setGeneratedNote] = useState<any>(null);
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [showSaveNoteModal, setShowSaveNoteModal] = useState(false);
    const [showExportNoteModal, setShowExportNoteModal] = useState(false);

    // Collapsible sections
    const [showResourceConstraints, setShowResourceConstraints] = useState(false);
    const [showStudentReadiness, setShowStudentReadiness] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);
    const [showLocalContext, setShowLocalContext] = useState(false);

    // Refs for height alignment
    const inputFormRef = useRef<HTMLDivElement>(null);
    const [formHeight, setFormHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        const updateHeight = () => {
            if (inputFormRef.current) {
                setFormHeight(inputFormRef.current.offsetHeight);
            }
        };

        // Initial measurement
        updateHeight();
        // Wait for DOM updates/animations
        const timer = setTimeout(updateHeight, 100);

        window.addEventListener('resize', updateHeight);
        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(timer);
        };
    }, [topic, objectives, duration, showResourceConstraints, resourceConstraints, plan, generatedNote]); // Update when content changes

    // Material options
    const materialOptions = [
        'Textbook', 'Chalk/Whiteboard', 'Notebooks', 'Pencils/Pens',
        'Local Objects', 'Stones/Sticks', 'Paper', 'Scissors',
        'Glue', 'Colored Pencils', 'Ruler', 'Compass',
        'Calculator', 'Maps', 'Charts', 'Models'
    ];

    // --- Persistence Logic ---

    // Load cached data on mount
    useEffect(() => {
        // Only load cache if NOT loading a specific plan from props
        if (!loadedPlan) {
            const cachedPlan = localStorage.getItem('cached_lesson_plan');
            if (cachedPlan) {
                try {
                    setPlan(JSON.parse(cachedPlan));
                } catch (e) {
                    console.error("Failed to parse cached lesson plan", e);
                }
            }

            const cachedConfig = localStorage.getItem('cached_lesson_planner_config');
            if (cachedConfig) {
                try {
                    const config = JSON.parse(cachedConfig);
                    if (config.topic) setTopic(config.topic);
                    if (config.gradeLevel) setGradeLevel(config.gradeLevel);
                    if (config.subject) setSubject(config.subject);
                    if (config.objectives) setObjectives(config.objectives);
                    if (config.duration) setDuration(config.duration);
                    if (config.moeStandardId) setMoeStandardId(config.moeStandardId);
                    if (config.chapter) setChapter(config.chapter);
                    if (config.resourceConstraints) setResourceConstraints(config.resourceConstraints);
                    if (config.studentReadiness) setStudentReadiness(config.studentReadiness);
                    if (config.localContext) setLocalContext(config.localContext);
                    if (config.useRAG !== undefined) setUseRAG(config.useRAG);
                } catch (e) {
                    console.error("Failed to parse cached lesson planner config", e);
                }
            }
        }
    }, [loadedPlan]);

    // Save generated plan to cache
    useEffect(() => {
        if (plan) {
            localStorage.setItem('cached_lesson_plan', JSON.stringify(plan));
        }
    }, [plan]);

    // Save config to cache
    useEffect(() => {
        const config = {
            topic,
            gradeLevel,
            subject,
            objectives,
            duration,
            moeStandardId,
            chapter,
            resourceConstraints,
            studentReadiness,
            localContext,
            useRAG
        };
        localStorage.setItem('cached_lesson_planner_config', JSON.stringify(config));
    }, [topic, gradeLevel, subject, objectives, duration, moeStandardId, chapter, resourceConstraints, studentReadiness, localContext, useRAG]);

    // --- End Persistence Logic ---

    // Fetch subjects when filters change
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!gradeLevel) {
                setAvailableSubjects([]);
                return;
            }
            try {
                const subjects = await getSubjectsFor(
                    region || undefined,
                    gradeLevel,
                    stream || undefined,
                    useRAG // Pass the RAG toggle state
                );
                setAvailableSubjects(subjects || []);

                // Reset subject if not in new list
                if (subject && subjects && !subjects.includes(subject)) {
                    setSubject('');
                }
            } catch (err) {
                console.error('Failed to fetch subjects:', err);
                setAvailableSubjects([]);
            }
        };
        fetchSubjects();
    }, [region, gradeLevel, stream, getSubjectsFor, useRAG]);

    useEffect(() => {
        if (loadedPlan) {
            setTopic(loadedPlan.topic);
            setGradeLevel(loadedPlan.grade);
            setSubject(loadedPlan.subject);
            setObjectives(loadedPlan.objectives.join('\n'));
            setDuration(loadedPlan.duration);
            setMoeStandardId(loadedPlan.moeStandardId || '');
            setPlan(loadedPlan);
            if (onPlanLoaded) onPlanLoaded();
        }
    }, [loadedPlan, onPlanLoaded]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setPlan(null);

        try {
            // Validate required fields
            if (!topic.trim()) {
                throw new Error('Topic is required');
            }
            if (!subject.trim()) {
                throw new Error('Subject is required');
            }
            if (!objectives.trim()) {
                throw new Error('Learning objectives are required');
            }

            // Prepare request payload with all contextual data
            const payload = {
                topic,
                gradeLevel,
                subject,
                objectives,
                duration,
                useRAG,
                moeStandardId,
                resourceConstraints,
                studentReadiness,
                localContext
            };

            console.log('Generating lesson plan with payload:', payload);

            const result = await apiService.generateLessonPlan(
                topic,
                gradeLevel,
                objectives,
                useRAG,
                subject,
                duration,
                moeStandardId,
                resourceConstraints,
                studentReadiness,
                localContext,
                region, // Pass geographic region
                chapter // Pass chapter for context
            );

            console.log('Lesson Plan Response:', result);

            // Validate response structure
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response format from server');
            }

            if (!result.title) {
                throw new Error('Response missing required title field');
            }

            setPlan(result);
            setPlan(result);
        } catch (err: any) {
            if (useRAG && (err.message.includes("Vector Store") || err.message.includes("not found"))) {
                setWarningMessage("Curriculum data not available. Retrying with standard AI generation...");
                // Retry without RAG
                try {
                    const fallbackResult = await apiService.generateLessonPlan(
                        topic, gradeLevel, objectives, false, subject, duration, moeStandardId, resourceConstraints, studentReadiness, localContext, region, undefined
                    );
                    setPlan(fallbackResult);
                    setToastState({ message: "Generated lesson plan using standard AI (Curriculum data unavailable)", type: 'warning' });
                } catch (retryErr: any) {
                    console.error('Lesson Plan Retry Error:', retryErr);
                    setError(retryErr.message || "Failed to generate lesson plan.");
                }
            } else {
                console.error('Lesson Plan Error:', err);
                setError(err.message || "Failed to generate lesson plan. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions for managing arrays
    const toggleMaterial = (material: string) => {
        setResourceConstraints(prev => ({
            ...prev,
            availableMaterials: prev.availableMaterials.includes(material)
                ? prev.availableMaterials.filter(m => m !== material)
                : [...prev.availableMaterials, material]
        }));
    };

    const addMisconception = (misconception: string) => {
        if (misconception.trim() && !studentReadiness.commonMisconceptions?.includes(misconception)) {
            setStudentReadiness(prev => ({
                ...prev,
                commonMisconceptions: [...(prev.commonMisconceptions || []), misconception]
            }));
        }
    };

    const removeMisconception = (index: number) => {
        setStudentReadiness(prev => ({
            ...prev,
            commonMisconceptions: prev.commonMisconceptions?.filter((_, i) => i !== index) || []
        }));
    };

    const addSpecialNeed = (need: string) => {
        if (need.trim() && !studentReadiness.specialNeedsGroups?.includes(need)) {
            setStudentReadiness(prev => ({
                ...prev,
                specialNeedsGroups: [...(prev.specialNeedsGroups || []), need]
            }));
        }
    };

    const removeSpecialNeed = (index: number) => {
        setStudentReadiness(prev => ({
            ...prev,
            specialNeedsGroups: prev.specialNeedsGroups?.filter((_, i) => i !== index) || []
        }));
    };

    const addCulturalConsideration = (consideration: string) => {
        if (consideration.trim() && !localContext.culturalConsiderations?.includes(consideration)) {
            setLocalContext(prev => ({
                ...prev,
                culturalConsiderations: [...(prev.culturalConsiderations || []), consideration]
            }));
        }
    };

    const removeCulturalConsideration = (index: number) => {
        setLocalContext(prev => ({
            ...prev,
            culturalConsiderations: prev.culturalConsiderations?.filter((_, i) => i !== index) || []
        }));
    };

    // Save to Library handler
    const handleSaveToLibrary = async () => {
        if (!plan) return;

        setIsSavingToLibrary(true);
        try {
            const savedPlan = await apiService.saveLessonPlan({
                ...plan,
                is_public: false,
                tags: [plan.subject, plan.grade]
            });
            alert(`✅ Lesson plan saved to Library! ID: ${savedPlan.id}`);

            if (onPlanSaved) {
                onPlanSaved(savedPlan.id);
            }
        } catch (err: any) {
            console.error('Save error:', err);
            alert(`Failed to save to library: ${err.message}`);
        } finally {
            setIsSavingToLibrary(false);
        }
    };

    // Save Plan (file) handler
    const handleSavePlan = async (format: SaveLessonPlanFormat) => {
        if (!plan) return;

        setIsSavingFile(true);
        setShowSavePlanModal(false);

        try {
            const filename = sanitizeFilename(`${plan.title}.${format}`);
            const mimeType = getMimeType(format);

            if (format === 'txt') {
                const textContent = generateLessonPlanTextContent(plan);
                await saveWithFilePicker(textContent, filename, mimeType);
            } else {
                const savedPlan = await apiService.saveLessonPlan({
                    ...plan,
                    is_public: false,
                    tags: [plan.subject, plan.grade]
                });
                const blob = await apiService.exportLessonPlanPDF(savedPlan.id);
                await saveWithFilePicker(blob, filename, mimeType);
            }

            alert(`✅ Lesson plan saved as ${format.toUpperCase()} file`);
        } catch (err: any) {
            if (err.message !== 'Save cancelled by user') {
                console.error('Save error:', err);
                alert(`Failed to save file: ${err.message}`);
            }
        } finally {
            setIsSavingFile(false);
        }
    };

    // Export handler
    const handleExport = async (format: SaveLessonPlanFormat) => {
        if (!plan) return;

        setIsExportingFile(true);
        setShowExportModal(false);

        try {
            const filename = sanitizeFilename(`${plan.title}.${format}`);
            const mimeType = getMimeType(format);

            if (format === 'txt') {
                const textContent = generateLessonPlanTextContent(plan);
                await downloadFile(textContent, filename, mimeType);
            } else {
                const savedPlan = await apiService.saveLessonPlan({
                    ...plan,
                    is_public: false,
                    tags: [plan.subject, plan.grade]
                });
                const blob = await apiService.exportLessonPlanPDF(savedPlan.id);
                await downloadFile(blob, filename, mimeType);
            }

            alert(`✅ Lesson plan exported as ${format.toUpperCase()}`);
        } catch (err: any) {
            console.error('Export error:', err);
            alert(`Failed to export: ${err.message}`);
        } finally {
            setIsExportingFile(false);
        }
    };

    const handleExtractChapter = async () => {
        if (!chapter.trim() || !gradeLevel || !subject) {
            setExtractionError('Please select grade, subject, and enter a chapter name');
            return;
        }

        setIsExtracting(true);
        setExtractionError(null);
        setShowExtractedContent(false);

        try {
            // Use extractCurriculumContent to get comprehensive chapter data including topics
            const response = await apiService.extractCurriculumContent({
                grade_level: gradeLevel,
                subject,
                chapter_input: chapter,
                suggest_topic: true, // Request topics explicitly
                region,
                document_type: 'lesson_plan'
            });

            if (response.success) {
                // const content = response.extracted_content; // REMOVED: Not in extractCurriculumContent response
                // const metadata = content.extraction_metadata || {}; // REMOVED
                const hasFullChapter = !!response.chapter_context; // inferred from presence of context

                // Auto-populate fields with enhanced content
                // Auto-populate fields with enhanced content
                if (response.suggested_topics && response.suggested_topics.length > 0) {
                    // Use chapter title as main topic if available, otherwise first topic
                    const mainTopic = response.chapter_context?.chapter_title || response.suggested_topics[0];
                    setTopic(mainTopic);
                }

                if (response.learning_objectives && response.learning_objectives.length > 0) {
                    setObjectives(response.learning_objectives.join('\n'));
                }

                if (response.standards && response.standards.length > 0) {
                    setMoeStandardId(response.standards[0]);
                }

                // Estimate duration based on content length/complexity
                let durationNote = '';
                // Default to 90 mins for a full chapter, or calculate based on objectives
                const estimatedMinutes = Math.min((response.learning_objectives?.length || 0) * 15 + 45, 180);
                setDuration(estimatedMinutes);

                setShowExtractedContent(true);

                // Build success message with enhanced details
                let successMsg = `✅ Chapter content extracted successfully!\n\n`;

                if (hasFullChapter) {
                    successMsg += `📚 COMPLETE CHAPTER EXTRACTED\n`;
                    successMsg += `Chapter: ${response.chapter_context?.chapter_title || chapter}\n\n`;
                }

                successMsg += `📊 Extraction Summary:\n`;
                successMsg += `• Topics: ${response.suggested_topics?.length || 0}\n`;
                successMsg += `• Learning Objectives: ${response.learning_objectives?.length || 0}\n`;
                successMsg += `• Key Concepts: ${response.key_concepts?.length || 0}\n`;

                // Show objectives source - Not available in this endpoint
                // if (response.learning_objectives && response.learning_objectives.length > 0) {
                //    successMsg += `\n✅ Objectives extracted from curriculum content\n`;
                // }

                successMsg += `\n✨ Fields have been auto-populated. You can edit them before generating the plan.${durationNote}`;

                alert(successMsg);
                alert(successMsg);
            } else {
                if (useRAG) {
                    setExtractionError(null); // clear error
                    setWarningMessage("RAG content not found. Auto-populating based on topic AI inference instead.");
                    // We could retry without rag here if needed, but extraction endpoint actually does dual duty (rag + ai). 
                    // If it failed, it means both might have failed or just RAG.
                    // The backend extract_curriculum_content usually falls back internally? 
                    // Wait, apiService throws on 400. 
                    // If we are here, result.success is false.

                    // Let's rely on the catch block for network/404 errors.
                    // If result.success is false, it means specific logical failure.
                    let errorMsg = response.error || 'No content found for this chapter';
                    if (errorMsg.includes("Vector Store") || errorMsg.includes("not found")) {
                        setWarningMessage("Curriculum content not found. You can fill fields manually.");
                    } else {
                        setExtractionError(errorMsg);
                    }
                } else {
                    let errorMsg = response.error || 'No content found for this chapter';
                    setExtractionError(errorMsg);
                }
            }
        } catch (err: any) {
            if (useRAG && (err.message.includes("Vector Store") || err.message.includes("not found"))) {
                setExtractionError(null);
                setWarningMessage("Curriculum data not available for this subject. Please enter topic details manually.");
            } else {
                console.error('Extraction error:', err);
                setExtractionError(err.message || 'Failed to extract chapter content');
            }
        } finally {
            setIsExtracting(false);
        }
    };

    const handleExtractChapters = async () => {
        if (!gradeLevel || !subject) {
            setExtractionError('Please select grade and subject to extract chapters');
            return;
        }

        setIsExtractingChapters(true);
        setExtractionError(null);
        setExtractedChapters([]);

        try {
            const result = await apiService.extractChapters({
                subject,
                grade_level: gradeLevel,
                region,
                stream,
            });

            if (result.success) {
                setExtractedChapters(result.chapters);
                // setSuccessMessage(`✅ Found ${result.chapters.length} chapters!`);
            } else {
                setExtractionError(result.error || "Failed to extract chapters");
            }
        } catch (err: any) {
            setExtractionError(err.message || "Failed to extract chapters");
        } finally {
            setIsExtractingChapters(false);
        }
    };

    const handleGenerateNote = async () => {
        if (!plan) return;

        setIsGeneratingNote(true);
        setNoteError(null);
        setGeneratedNote(null);

        try {
            const result = await apiService.generateTeacherNote(plan, useRAG, chapter);
            setGeneratedNote(result);
        } catch (err: any) {
            console.error('Note Generation Error:', err);
            setNoteError(err.message || "Failed to generate teacher's note. Please try again.");
        } finally {
            setIsGeneratingNote(false);
        }
    };

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-inner">
                    <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                        AI-Powered Lesson Planner
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Create comprehensive, curriculum-aligned lesson plans in seconds</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input Form */}
                <div ref={inputFormRef} className="md:col-span-1 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <div className="pb-2">
                        <ToggleSwitch
                            isEnabled={useRAG}
                            onToggle={() => setUseRAG(!useRAG)}
                            label="Use Ethiopian Curriculum"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {useRAG
                                ? '✅ Lesson plan will be based on uploaded curriculum textbooks and materials'
                                : '⚠️ Lesson plan will be generated from AI model knowledge only'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
                        <select
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        >
                            {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                        <select
                            value={gradeLevel}
                            onChange={e => {
                                setGradeLevel(e.target.value);
                                if (e.target.value !== 'Grade 11' && e.target.value !== 'Grade 12') {
                                    setStream('');
                                }
                            }}
                            className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        >
                            {gradeLevels.map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    {(gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stream</label>
                            <select
                                value={stream}
                                onChange={e => setStream(e.target.value)}
                                className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            >
                                <option value="">Select Stream</option>
                                {streams.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subject {useRAG && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            disabled={availableSubjects.length === 0}
                        >
                            <option value="">
                                {availableSubjects.length === 0 ? 'Loading subjects...' : 'Select a subject...'}
                            </option>
                            {availableSubjects.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                        {useRAG && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Required for curriculum-based lesson plans
                            </p>
                        )}
                    </div>

                    {/* Chapter Content Extraction */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Chapter Assistant</h3>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                            Enter the chapter/unit name <strong>exactly as it appears in your textbook</strong> for best results.
                            The AI also understands variations like "Chapter 3", "Unit Three", "Lesson 5", etc.
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 italic">
                            💡 Tip: Check your textbook's table of contents and use the exact term (e.g., if it says "Unit Three", enter "Unit Three")
                        </p>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={chapter}
                                onChange={e => setChapter(e.target.value)}
                                placeholder="Enter as shown in textbook (e.g., Unit Three, Chapter 3)"
                                className="w-full p-3 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/30"
                                disabled={!gradeLevel || !subject}
                            />

                            {/* Extract Chapters Button & Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                        Available Chapters
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleExtractChapters}
                                        disabled={isExtractingChapters || !gradeLevel || !subject}
                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
                                    >
                                        {isExtractingChapters ? 'Scanning...' : 'Scan for Chapters'}
                                    </button>
                                </div>

                                {extractedChapters.length > 0 && (
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = extractedChapters.find(c => c.number.toString() === e.target.value);
                                                if (selected) {
                                                    const label = selected.label || 'Chapter';
                                                    setChapter(`${label} ${selected.number}: ${selected.title}`);
                                                }
                                            }
                                        }}
                                        className="w-full p-2 text-sm border border-blue-300 rounded-md dark:bg-gray-700 dark:border-blue-700 dark:text-white"
                                    >
                                        <option value="">Select a chapter from list...</option>
                                        {extractedChapters.map((c, idx) => (
                                            <option key={idx} value={c.number.toString()}>
                                                {c.label || 'Chapter'} {c.number}: {c.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button
                                onClick={handleExtractChapter}
                                disabled={isExtracting || !chapter.trim() || !gradeLevel || !subject}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 shadow-md text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                {isExtracting ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Extracting...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-4 h-4" />
                                        Extract Chapter Content
                                    </>
                                )}
                            </button>
                            {extractionError && (
                                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                    <div className="font-semibold mb-1">❌ Extraction Failed</div>
                                    <div className="whitespace-pre-line">{extractionError}</div>
                                </div>
                            )}
                            {showExtractedContent && (
                                <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    ✅ Content extracted! Fields below have been auto-populated.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g., Reading Comprehension" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Objectives (one per line) <span className="text-red-500">*</span></label>
                        <textarea
                            value={objectives}
                            onChange={e => setObjectives(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            placeholder="e.g., Students will analyze..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (min)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value) || 45)}
                                className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                min="15"
                                max="180"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MoE Code</label>
                            <input
                                type="text"
                                value={moeStandardId}
                                onChange={e => setMoeStandardId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    {/* Resource Constraints Section */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowResourceConstraints(!showResourceConstraints)}
                            className="flex items-center justify-between w-full text-left p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">📦 Resource Constraints (Optional)</span>
                            {showResourceConstraints ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                        </button>
                        {showResourceConstraints && (
                            <div className="mt-3 space-y-3 pl-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Class Size</label>
                                    <input
                                        type="number"
                                        value={resourceConstraints.classSize}
                                        onChange={e => setResourceConstraints({ ...resourceConstraints, classSize: parseInt(e.target.value) || 40 })}
                                        className="w-full p-1.5 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budget Level</label>
                                    <select
                                        value={resourceConstraints.budgetLimit}
                                        onChange={e => setResourceConstraints({ ...resourceConstraints, budgetLimit: e.target.value })}
                                        className="w-full p-1.5 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="Very Low">Very Low</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Available Materials</label>
                                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                                        {materialOptions.map(mat => (
                                            <label key={mat} className="flex items-center text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={resourceConstraints.availableMaterials.includes(mat)}
                                                    onChange={() => toggleMaterial(mat)}
                                                    className="mr-1"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">{mat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-xs">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={resourceConstraints.internetAccess}
                                            onChange={e => setResourceConstraints({ ...resourceConstraints, internetAccess: e.target.checked })}
                                            className="mr-1"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">Internet</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={resourceConstraints.electricityAccess}
                                            onChange={e => setResourceConstraints({ ...resourceConstraints, electricityAccess: e.target.checked })}
                                            className="mr-1"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">Electricity</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>


                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center space-x-2 px-6 py-4 text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                    >
                        <BookOpenIcon className="w-6 h-6" />
                        <span>{isLoading ? 'Creating Plan...' : 'Generate Lesson Plan'}</span>
                    </button>

                    <button
                        onClick={handleGenerateNote}
                        disabled={!plan || isGeneratingNote || isLoading}
                        className="w-full flex justify-center items-center space-x-2 px-6 py-4 text-white font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 mt-4"
                    >
                        <SparklesIcon className="w-6 h-6 animate-pulse" />
                        <span>{isGeneratingNote ? 'Generating Note...' : 'Generate Teacher\'s Note'}</span>
                    </button>
                    {!plan && (
                        <p className="text-xs text-center text-gray-500 mt-1">
                            Generate a lesson plan first to enable note generation.
                        </p>
                    )}
                </div>

                {/* Output Display */}
                {/* Output Display */}
                <div className="md:col-span-2 flex flex-col">
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">Crafting your lesson plan...</p>
                        </div>
                    )}

                    {!plan && !isLoading && !error && (
                        <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <GirlReadingAnimation />
                        </div>
                    )}

                    {error && <div className="p-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-2xl shadow-sm">{error}</div>}

                    {plan && (
                        <div
                            className="space-y-6 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-y-auto shadow-sm custom-scrollbar scroll-smooth"
                            style={{ height: formHeight ? `${formHeight}px` : 'auto' }}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-2xl font-bold text-primary dark:text-secondary">{plan.title}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveToLibrary}
                                            disabled={isSavingToLibrary}
                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Save to Library"
                                        >
                                            <SaveIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setShowSavePlanModal(true)}
                                            disabled={isSavingFile}
                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                            title="Save as File"
                                        >
                                            <SaveIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setShowExportModal(true)}
                                            disabled={isExportingFile}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Export"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* RAG Status Indicator */}
                                {plan.rag_enabled && plan.curriculum_sources && plan.curriculum_sources.length > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 text-sm font-semibold">✅ Based on Ethiopian Curriculum</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            This lesson plan was generated using content from:
                                        </p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4 list-disc">
                                            {plan.curriculum_sources.map((source: string, i: number) => (
                                                <li key={i}>{source}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* RAG Fallback Warning */}
                                {plan.rag_status === 'fallback' && plan.rag_message && (
                                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <span className="text-orange-600 dark:text-orange-400 text-sm font-semibold">⚠️ Curriculum Documents Not Available</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {plan.rag_message}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                            This lesson plan was generated using the AI model's general knowledge. For curriculum-aligned content, please upload documents in the <strong>Curriculum Manager</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* RAG Disabled */}
                                {plan.rag_status === 'disabled' && (
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">ℹ️ AI Model Generation</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            This lesson plan was generated from the AI model's knowledge. Enable "Use Ethiopian Curriculum" for content aligned with official textbooks.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Fallback for non-JSON response */}
                            {plan.content && (
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-md">
                                    <pre className="whitespace-pre-wrap text-sm">{plan.content}</pre>
                                </div>
                            )}

                            {/* Structured response */}
                            {plan.objectives && plan.objectives.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Learning Objectives</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {plan.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                    </ul>
                                </div>
                            )}

                            {plan.materials && plan.materials.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Materials</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {plan.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                                    </ul>
                                </div>
                            )}

                            {plan.activities && plan.activities.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Activities & Timeline</h4>
                                    <table className="w-full mt-2 text-sm text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-2 w-1/4">Duration</th>
                                                <th className="px-4 py-2">Activity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {plan.activities.map((act, i) => (
                                                <tr key={i} className="border-b dark:border-gray-700">
                                                    <td className="px-4 py-2 font-medium">{act.duration} mins</td>
                                                    <td className="px-4 py-2">{act.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 5E Instructional Sequence */}
                            {plan.fiveESequence && plan.fiveESequence.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🎯 5E Instructional Sequence</h4>
                                    <div className="space-y-3">
                                        {plan.fiveESequence.map((phase, i) => (
                                            <div key={i} className="border-l-4 border-primary pl-3 py-2 bg-white dark:bg-gray-800 rounded">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h5 className="font-semibold text-primary dark:text-secondary">{phase.phase}</h5>
                                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{phase.duration} min</span>
                                                </div>
                                                <div className="text-sm space-y-1">
                                                    {phase.activities && phase.activities.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">Activities:</span>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                                                {phase.activities.map((act, j) => <li key={j}>{act}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {phase.teacherActions && phase.teacherActions.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">Teacher:</span>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                                                {phase.teacherActions.map((action, k) => <li key={k}>{action}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {phase.studentActions && phase.studentActions.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">Students:</span>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                                                {phase.studentActions.map((action, k) => <li key={k}>{action}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assessment Plan */}
                            {plan.assessmentPlan && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📊 Assessment Plan</h4>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded space-y-2 text-sm">
                                        {plan.assessmentPlan.formativeChecks && plan.assessmentPlan.formativeChecks.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Formative Checks:</span>
                                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                                    {plan.assessmentPlan.formativeChecks.map((check, i) => <li key={i}>{check}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {plan.assessmentPlan.summativeTask && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Summative Task:</span>
                                                <p className="text-gray-600 dark:text-gray-400">{plan.assessmentPlan.summativeTask}</p>
                                            </div>
                                        )}
                                        {plan.assessmentPlan.successCriteria && plan.assessmentPlan.successCriteria.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Success Criteria:</span>
                                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                                                    {plan.assessmentPlan.successCriteria.map((criteria, i) => <li key={i}>{criteria}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Differentiation Strategies */}
                            {plan.differentiationStrategies && plan.differentiationStrategies.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🎨 Differentiation Strategies</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {plan.differentiationStrategies.map((strategy, i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                <h5 className="font-medium text-xs text-primary dark:text-secondary mb-1">{strategy.level}</h5>
                                                <div className="text-xs space-y-1">
                                                    {strategy.contentAdaptations && strategy.contentAdaptations.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Content:</span>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-1">
                                                                {strategy.contentAdaptations.map((adapt, j) => <li key={j}>{adapt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {strategy.processAdaptations && strategy.processAdaptations.length > 0 && (
                                                        <div>
                                                            <span className="font-medium">Process:</span>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-1">
                                                                {strategy.processAdaptations.map((adapt, j) => <li key={j}>{adapt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Legacy Assessment */}
                            {plan.assessment && !plan.assessmentPlan && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Assessment</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{plan.assessment}</p>
                                </div>
                            )}

                            {plan.homework && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">📝 Homework</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{plan.homework}</p>
                                </div>
                            )}

                            {/* Extensions */}
                            {plan.extensions && plan.extensions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">🚀 Extensions</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {plan.extensions.map((ext, i) => <li key={i}>{ext}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Reflection Prompts */}
                            {plan.reflectionPrompts && plan.reflectionPrompts.length > 0 && (
                                <div className="border-t pt-3">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">💭 Teacher Reflection</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {plan.reflectionPrompts.map((prompt, i) => <li key={i}>{prompt}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Generated Note Section */}
                            {isGeneratingNote && (
                                <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                        <p>Generating detailed teacher's note...</p>
                                        <p className="text-xs mt-2">This may take a minute as we craft a comprehensive note.</p>
                                    </div>
                                </div>
                            )}

                            {noteError && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                    <h4 className="font-semibold mb-1">Generation Failed</h4>
                                    <p className="text-sm">{noteError}</p>
                                </div>
                            )}

                            {generatedNote && (
                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <SparklesIcon className="w-6 h-6 text-green-600" />
                                            Teacher's Note
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (!generatedNote) return;
                                                    try {
                                                        setIsSavingFile(true);
                                                        // Convert structured note to Markdown for saving
                                                        const markdownContent = generateNoteMarkdown(generatedNote);

                                                        await apiService.saveLesson({
                                                            title: generatedNote.title,
                                                            grade: gradeLevel,
                                                            subject: subject,
                                                            topic: topic,
                                                            content: markdownContent,
                                                            rag_enabled: generatedNote.rag_enabled,
                                                            curriculum_sources: generatedNote.curriculum_sources,
                                                            is_public: false,
                                                        });
                                                        setToastState({ message: 'Note saved to Library successfully!', type: 'success' });
                                                    } catch (error: any) {
                                                        console.error('Error saving note:', error);
                                                        setToastState({ message: error.message || 'Failed to save note', type: 'error' });
                                                    } finally {
                                                        setIsSavingFile(false);
                                                    }
                                                }}
                                                disabled={isSavingFile}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
                                            >
                                                {isSavingFile ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <SaveIcon className="w-4 h-4" />
                                                )}
                                                <span>Add To Library</span>
                                            </button>
                                            <button
                                                onClick={() => setShowExportNoteModal(true)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                                <span>Export</span>
                                            </button>
                                        </div>
                                    </div>

                                    {generatedNote.rag_enabled && (
                                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">✅ Enhanced with Ethiopian Curriculum</span>
                                            </div>
                                            {generatedNote.curriculum_sources && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    Sources: {generatedNote.curriculum_sources.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Structured Note Display */}
                                    <div className="space-y-6">
                                        {/* Overview Card */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Overview</h4>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {generatedNote.overview || generatedNote.content}
                                            </p>
                                        </div>

                                        {/* Key Concepts Grid */}
                                        {generatedNote.keyConcepts && generatedNote.keyConcepts.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <span className="text-xl">🔑</span> Key Concepts
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {generatedNote.keyConcepts.map((concept: any, idx: number) => (
                                                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                                            <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{concept.concept}</h5>
                                                            <p className="text-sm text-blue-800 dark:text-blue-200">{concept.explanation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Visual Aids Section */}
                                        {generatedNote.visualAids && generatedNote.visualAids.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <span className="text-xl">👁️</span> Visual Aids & Resources
                                                </h4>
                                                <div className="space-y-3">
                                                    {generatedNote.visualAids.map((aid: any, idx: number) => (
                                                        <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800 flex gap-4">
                                                            <div className="flex-shrink-0 mt-1">
                                                                <span className="text-2xl">🖼️</span>
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-amber-900 dark:text-amber-100">{aid.title} <span className="text-xs font-normal opacity-75">({aid.type})</span></h5>
                                                                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{aid.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Teaching Strategies */}
                                        {generatedNote.teachingStrategies && generatedNote.teachingStrategies.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <span className="text-xl">🧠</span> Teaching Strategies
                                                </h4>
                                                <div className="space-y-4">
                                                    {generatedNote.teachingStrategies.map((strategy: any, idx: number) => (
                                                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h5 className="font-semibold text-gray-900 dark:text-white">{strategy.phase}</h5>
                                                                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">{strategy.strategy}</span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm">{strategy.activity}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Misconceptions */}
                                        {generatedNote.misconceptions && generatedNote.misconceptions.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <span className="text-xl">⚠️</span> Common Misconceptions
                                                </h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {generatedNote.misconceptions.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                                                            <p className="text-sm font-medium text-red-900 dark:text-red-100">❌ {item.misconception}</p>
                                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">✅ {item.correction}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Assessment Questions */}
                                        {generatedNote.assessmentQuestions && generatedNote.assessmentQuestions.length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <span className="text-xl">❓</span> Check for Understanding
                                                </h4>
                                                <ul className="space-y-2">
                                                    {generatedNote.assessmentQuestions.map((q: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                            <span className="text-gray-800 dark:text-gray-200 text-sm pt-0.5">{q}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Save Plan Modal */}
            <SaveLessonPlanModal
                isOpen={showSavePlanModal}
                onClose={() => setShowSavePlanModal(false)}
                onSave={handleSavePlan}
                planTitle={plan?.title || 'Lesson Plan'}
                isSaving={isSavingFile}
            />
            {/* Export Modal for Lesson Plan */}
            <SaveLessonPlanModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onSave={handleExport}
                planTitle={plan?.title || 'Lesson Plan'}
                isSaving={isExportingFile}
            />

            {/* Export Modal for Generated Note */}
            <SaveLessonPlanModal
                isOpen={showExportNoteModal}
                onClose={() => setShowExportNoteModal(false)}
                onSave={async (format) => {
                    if (!generatedNote) return;

                    try {
                        const filename = sanitizeFilename(`${generatedNote.title || 'TeacherNote'}.${format}`);
                        const mimeType = getMimeType(format);

                        // Generate markdown content from structured data
                        const noteContent = generateNoteMarkdown(generatedNote);

                        if (format === 'txt') {
                            const blob = new Blob([noteContent], { type: 'text/plain' });
                            await downloadFile(blob, filename, mimeType);
                        } else {
                            // For PDF/DOCX, we need the backend. 
                            let lessonId = generatedNote.id;
                            if (!lessonId) {
                                const saved = await apiService.saveLesson({
                                    title: generatedNote.title,
                                    grade: gradeLevel,
                                    subject: subject,
                                    topic: topic,
                                    content: noteContent,
                                    rag_enabled: generatedNote.rag_enabled,
                                    curriculum_sources: generatedNote.curriculum_sources,
                                    is_public: false,
                                });
                                lessonId = saved.id;
                            }

                            const blob = await apiService.exportSavedLesson(lessonId, format);
                            await downloadFile(blob, filename, mimeType);
                        }

                        setShowExportNoteModal(false);
                        setToastState({ message: `Note exported as ${format.toUpperCase()}`, type: 'success' });
                    } catch (error: any) {
                        console.error('Export error:', error);
                        setToastState({ message: `Failed to export: ${error.message}`, type: 'error' });
                    }
                }}
                planTitle={generatedNote?.title || 'Teacher Note'}
                isSaving={false}
            />

            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                    onClose={() => setToastState(null)}
                />
            )}
        </div>
    );
};


// Helper to convert structured note to Markdown for saving/exporting
const generateNoteMarkdown = (note: any): string => {
    let md = `# ${note.title}\n\n`;

    if (note.overview) {
        md += `## Overview\n${note.overview}\n\n`;
    }

    if (note.keyConcepts && note.keyConcepts.length > 0) {
        md += `## Key Concepts\n`;
        note.keyConcepts.forEach((c: any) => {
            md += `### ${c.concept}\n${c.explanation}\n\n`;
        });
    }

    if (note.visualAids && note.visualAids.length > 0) {
        md += `## Visual Aids & Resources\n`;
        note.visualAids.forEach((aid: any) => {
            md += `### ${aid.title} (${aid.type})\n${aid.description}\n\n`;
        });
    }

    if (note.teachingStrategies && note.teachingStrategies.length > 0) {
        md += `## Teaching Strategies\n`;
        note.teachingStrategies.forEach((s: any) => {
            md += `### ${s.phase}: ${s.strategy}\n${s.activity}\n\n`;
        });
    }

    if (note.misconceptions && note.misconceptions.length > 0) {
        md += `## Common Misconceptions\n`;
        note.misconceptions.forEach((m: any) => {
            md += `- **Misconception**: ${m.misconception}\n  **Correction**: ${m.correction}\n`;
        });
        md += `\n`;
    }

    if (note.assessmentQuestions && note.assessmentQuestions.length > 0) {
        md += `## Check for Understanding\n`;
        note.assessmentQuestions.forEach((q: string) => {
            md += `- ${q}\n`;
        });
        md += `\n`;
    }

    return md;
};

export default LessonPlanner;
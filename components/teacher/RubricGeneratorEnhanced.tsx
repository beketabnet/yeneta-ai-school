import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { GeneratedRubric, RubricType, RubricGenerationParams, SavedRubric } from '../../types';
import { apiService } from '../../services/apiService';
import { ScaleIcon, BookmarkIcon } from '../icons/Icons';
import RubricTypeSelector from './rubric/RubricTypeSelector';
import RubricConfigPanel from './rubric/RubricConfigPanel';
import LearningObjectivesInput from './rubric/LearningObjectivesInput';
import RubricDisplay from './rubric/RubricDisplay';
import RubricRAGConfig from './rubricgenerator/RubricRAGConfig';
import LearningObjectivesList from './rubricgenerator/LearningObjectivesList';
import EditableSuggestionField from './rubricgenerator/EditableSuggestionField';
import TopicSuggestionsDisplay from './rubricgenerator/TopicSuggestionsDisplay';
import DocumentTypeSelector, { DocumentType } from './rubricgenerator/DocumentTypeSelector';
import AssignmentDescriptionGenerator from './rubricgenerator/AssignmentDescriptionGenerator';
import { ExportFormat } from './rubric/ExportOptionsModal';
import { SaveFormat } from './rubric/SaveRubricModal';
import { generateRubricTextContent, downloadFile, sanitizeFilename, getMimeType, saveWithFilePicker } from '../../utils/rubricExportUtils';
import { useCurriculum } from '../../hooks/useCurriculum';

interface RubricGeneratorEnhancedProps {
    loadedRubric?: SavedRubric | null;
    onRubricLoaded?: () => void;
    onRubricSaved?: (rubricId: number) => void;
}

const RubricGeneratorEnhanced: React.FC<RubricGeneratorEnhancedProps> = ({ loadedRubric, onRubricLoaded, onRubricSaved }) => {
    // Curriculum Hook
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();

    // Basic inputs
    const [documentType, setDocumentType] = useState<DocumentType>('essay');
    const [topic, setTopic] = useState("History Essay on the Axumite Kingdom");
    const [assignmentDescription, setAssignmentDescription] = useState("");

    // Filter States
    const [region, setRegion] = useState("Addis Ababa");
    const [gradeLevel, setGradeLevel] = useState("Grade 9");
    const [stream, setStream] = useState("");
    const [subject, setSubject] = useState("");
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    // Rubric configuration
    const [rubricType, setRubricType] = useState<RubricType>('analytic');
    const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
    const [moeStandardId, setMoeStandardId] = useState("");
    const [numCriteria, setNumCriteria] = useState(5);
    const [weightingEnabled, setWeightingEnabled] = useState(false);
    const [multimodalAssessment, setMultimodalAssessment] = useState(false);
    const [tonePreference, setTonePreference] = useState("professional");

    // RAG configuration
    const [useRAG, setUseRAG] = useState(false);
    const [ragRegion, setRagRegion] = useState("Addis Ababa");
    const [ragGradeLevel, setRagGradeLevel] = useState("");
    const [ragStream, setRagStream] = useState("");
    const [ragSubject, setRagSubject] = useState("");
    const [ragChapterInput, setRagChapterInput] = useState("");
    const [ragAvailableSubjects, setRagAvailableSubjects] = useState<string[]>([]);
    const [extractedChapters, setExtractedChapters] = useState<{ number: string | number; title: string; label?: string }[]>([]);
    const [isExtractingChapters, setIsExtractingChapters] = useState(false);

    // AI Suggestions
    const [objectiveSuggestions, setObjectiveSuggestions] = useState<string[]>([]);
    const [standardSuggestions, setStandardSuggestions] = useState<string[]>([]);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [enableTopicSuggestion, setEnableTopicSuggestion] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // State
    const [rubric, setRubric] = useState<GeneratedRubric | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

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

    // Fetch subjects for RAG when filters change
    useEffect(() => {
        const fetchRAGSubjects = async () => {
            if (!ragGradeLevel) {
                setRagAvailableSubjects([]);
                return;
            }
            try {
                const subjects = await getSubjectsFor(
                    ragRegion || undefined,
                    ragGradeLevel,
                    ragStream || undefined,
                    true // Enforce RAG filtering (English only)
                );
                setRagAvailableSubjects(subjects || []);

                // Reset subject if not in new list
                if (ragSubject && subjects && !subjects.includes(ragSubject)) {
                    setRagSubject('');
                }
            } catch (err) {
                console.error('Failed to fetch RAG subjects:', err);
                setRagAvailableSubjects([]);
            }
        };
        if (useRAG) {
            fetchRAGSubjects();
        }
    }, [ragRegion, ragGradeLevel, ragStream, getSubjectsFor, useRAG]);

    // Load rubric from Library
    useEffect(() => {
        if (loadedRubric) {
            setTopic(loadedRubric.topic);
            setGradeLevel(loadedRubric.grade_level);
            setSubject(loadedRubric.subject || '');
            setRubricType(loadedRubric.rubric_type);
            setLearningObjectives(loadedRubric.learning_objectives || []);
            setWeightingEnabled(loadedRubric.weighting_enabled || false);
            setMultimodalAssessment(loadedRubric.multimodal_assessment || false);

            // Try to set region/stream if available in loaded rubric (might need to infer or add to SavedRubric type later)
            // For now, we keep defaults or let user select

            // Convert SavedRubric to GeneratedRubric format
            const generatedRubric: GeneratedRubric = {
                title: loadedRubric.title,
                grade_level: loadedRubric.grade_level,
                subject: loadedRubric.subject,
                rubric_type: loadedRubric.rubric_type,
                learning_objectives: loadedRubric.learning_objectives,
                criteria: loadedRubric.criteria,
                total_points: loadedRubric.total_points,
                weighting_enabled: loadedRubric.weighting_enabled,
                multimodal_assessment: loadedRubric.multimodal_assessment,
                alignment_validated: loadedRubric.alignment_validated,
                alignment_score: loadedRubric.alignment_score,
            };
            setRubric(generatedRubric);
            setSuccessMessage('Rubric loaded from Library');

            if (onRubricLoaded) {
                onRubricLoaded();
            }
        }
    }, [loadedRubric, onRubricLoaded]);

    const handleExtractChapters = async () => {
        if (!ragSubject || !ragGradeLevel) {
            setError("Please select subject and grade level to extract chapters");
            return;
        }

        setIsExtractingChapters(true);
        setError(null);
        setExtractedChapters([]);

        try {
            const result = await apiService.extractChapters({
                subject: ragSubject,
                grade_level: ragGradeLevel,
                region: ragRegion,
                stream: ragStream,
            });

            if (result.success) {
                setExtractedChapters(result.chapters);
                setSuccessMessage(`✅ Found ${result.chapters.length} chapters!`);
            } else {
                setError(result.error || "Failed to extract chapters");
            }
        } catch (err: any) {
            setError(err.message || "Failed to extract chapters");
        } finally {
            setIsExtractingChapters(false);
        }
    };

    const handleExtractContent = async () => {
        if (!ragSubject || !ragGradeLevel) {
            setError("Please select subject and grade level for content extraction");
            return;
        }

        setIsExtracting(true);
        setError(null);
        setObjectiveSuggestions([]);
        setStandardSuggestions([]);

        try {
            const result = await apiService.extractCurriculumContent({
                subject: ragSubject,
                grade_level: ragGradeLevel,
                topic: topic,
                chapter_input: ragChapterInput,
                suggest_topic: enableTopicSuggestion,
                document_type: documentType,  // NEW: Pass document type for topic suggestions
                region: ragRegion,
            });

            if (result.success) {
                setObjectiveSuggestions(result.learning_objectives);
                setStandardSuggestions(result.standards);

                // Set suggested topics if enabled
                if (enableTopicSuggestion && result.suggested_topics && result.suggested_topics.length > 0) {
                    setSuggestedTopics(result.suggested_topics);
                }

                // Auto-populate if fields are empty
                if (result.standards.length > 0 && !moeStandardId) {
                    setMoeStandardId(result.standards[0]);
                }

                if (result.suggested_criteria_count) {
                    setNumCriteria(result.suggested_criteria_count);
                }

                // Auto-populate subject and grade if not set
                if (!subject) setSubject(ragSubject);
                if (!gradeLevel || gradeLevel === "Grade 9") setGradeLevel(ragGradeLevel);

                const topicMsg = enableTopicSuggestion && result.suggested_topics && result.suggested_topics.length > 0 ? `, ${result.suggested_topics.length} topic suggestions` : '';
                setSuccessMessage(`✅ Extracted ${result.learning_objectives.length} objectives, ${result.standards.length} standards${topicMsg} from curriculum!`);
            } else {
                if (useRAG) {
                    setWarningMessage("RAG content not found for this subject. Falling back to standard AI generation.");
                    // Fallback to standard extraction logic (implemented by calling again without rag, or just letting user fill manually)
                    // Currently we just warn.
                } else {
                    setError(result.error || "Failed to extract content");
                }
            }
        } catch (err: any) {
            if (useRAG && (err.message.includes("Vector Store") || err.message.includes("not found"))) {
                setWarningMessage("Curriculum data not available for this subject. Using standard AI generation instead.");
            } else {
                setError(err.message || "Failed to extract curriculum content");
            }
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!topic) {
            setError("Please enter a topic first to generate description");
            return;
        }

        setIsGeneratingDescription(true);
        setError(null);

        try {
            const result = await apiService.generateAssignmentDescription({
                topic,
                document_type: documentType,
                subject: subject || ragSubject,
                grade_level: gradeLevel || ragGradeLevel,
                learning_objectives: learningObjectives.length > 0 ? learningObjectives : objectiveSuggestions.slice(0, 3),
            });

            if (result.success && result.description) {
                setAssignmentDescription(result.description);
                setSuccessMessage(`✅ Generated assignment description (${result.description.length} characters)`);
            } else {
                setError(result.error || "Failed to generate description");
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate assignment description. Please try again.");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setRubric(null);

        const params: RubricGenerationParams = {
            topic,
            grade_level: gradeLevel,
            subject,
            rubric_type: rubricType,
            learning_objectives: learningObjectives,
            moe_standard_id: moeStandardId,
            num_criteria: numCriteria,
            weighting_enabled: weightingEnabled,
            multimodal_assessment: multimodalAssessment,
            tone_preference: tonePreference,
            document_type: documentType,
            // Pass RAG parameters if enabled
            use_vector_store: !!(useRAG && ragSubject && ragGradeLevel),
            chapter_input: useRAG ? ragChapterInput : undefined,
        };

        try {


            const result = await apiService.generateRubric(params);
            setRubric(result);
        } catch (err: any) {
            if (useRAG && (err.message.includes("Vector Store") || err.message.includes("not found"))) {
                setWarningMessage("Curriculum data not available for this subject. Retrying with standard AI generation...");
                // Retry without RAG
                try {
                    const fallbackParams = { ...params, use_vector_store: false, chapter_input: undefined };
                    const result = await apiService.generateRubric(fallbackParams);
                    setRubric(result);
                    setSuccessMessage("Generated rubric using standard AI (Curriculum data was unavailable).");
                } catch (retryErr: any) {
                    setError(retryErr.message || "Failed to generate rubric.");
                }
            } else {
                setError(err.message || "Failed to generate rubric. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (format: SaveFormat) => {
        if (!rubric) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const filename = sanitizeFilename(`${rubric.title}.${format}`);
            const mimeType = getMimeType(format);

            if (format === 'txt') {
                // Client-side text export with folder selection
                const textContent = generateRubricTextContent(
                    rubric,
                    topic,
                    gradeLevel,
                    subject,
                    learningObjectives,
                    weightingEnabled
                );

                await downloadFile(textContent, filename, mimeType);
                setSuccessMessage(`✅ Rubric saved as ${format.toUpperCase()} file to your chosen location`);
            } else {
                // Backend API call for PDF/DOCX with folder selection
                const rubricData = {
                    title: rubric.title,
                    topic,
                    grade_level: gradeLevel,
                    subject,
                    rubric_type: rubricType,
                    total_points: rubric.total_points || 100,
                    learning_objectives: learningObjectives,
                    criteria: rubric.criteria,
                    weighting_enabled: weightingEnabled,
                    multimodal_assessment: multimodalAssessment,
                    alignment_validated: rubric.alignment_validated,
                    alignment_score: rubric.alignment_score,
                };

                const blob = await apiService.exportRubric(rubricData, format);
                await downloadFile(blob, filename, mimeType);
                setSuccessMessage(`✅ Rubric saved as ${format.toUpperCase()} file to your chosen location`);
            }
        } catch (err: any) {
            if (err.message === 'Save cancelled by user') {
                setSuccessMessage(null);
            } else {
                setError(err.message || `Failed to save rubric as ${format.toUpperCase()}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!rubric) return;

        setIsSavingToLibrary(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const savedRubric = await apiService.saveRubric({
                title: rubric.title,
                topic,
                grade_level: gradeLevel,
                subject,
                rubric_type: rubricType,
                total_points: rubric.total_points || 100,
                learning_objectives: learningObjectives,
                criteria: rubric.criteria,
                weighting_enabled: weightingEnabled,
                multimodal_assessment: multimodalAssessment,
                alignment_validated: rubric.alignment_validated,
                alignment_score: rubric.alignment_score,
                is_public: false,
                tags: [subject, gradeLevel, rubricType]
            });

            setSuccessMessage(`✅ Rubric saved to Library! ID: ${savedRubric.id}`);

            // Notify parent component that a rubric was saved
            if (onRubricSaved) {
                onRubricSaved(savedRubric.id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save rubric to library');
        } finally {
            setIsSavingToLibrary(false);
        }
    };

    const handleExport = async (format: ExportFormat) => {
        if (!rubric) return;

        setIsExporting(true);
        setError(null);

        try {
            const filename = sanitizeFilename(`${rubric.title}.${format}`);
            const mimeType = getMimeType(format);

            if (format === 'txt') {
                // Client-side text export - downloads to default folder
                const textContent = generateRubricTextContent(
                    rubric,
                    topic,
                    gradeLevel,
                    subject,
                    learningObjectives,
                    weightingEnabled
                );

                const blob = new Blob([textContent], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSuccessMessage('✅ Rubric exported as text file to Downloads folder');
            } else {
                // Backend API call for PDF/DOCX - downloads to default folder
                const rubricData = {
                    title: rubric.title,
                    topic,
                    grade_level: gradeLevel,
                    subject,
                    rubric_type: rubricType,
                    total_points: rubric.total_points || 100,
                    learning_objectives: learningObjectives,
                    criteria: rubric.criteria,
                    weighting_enabled: weightingEnabled,
                    multimodal_assessment: multimodalAssessment,
                    alignment_validated: rubric.alignment_validated,
                    alignment_score: rubric.alignment_score,
                };

                const blob = await apiService.exportRubric(rubricData, format);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSuccessMessage(`✅ Rubric exported as ${format.toUpperCase()} file to Downloads folder`);
            }
        } catch (err: any) {
            setError(err.message || `Failed to export rubric as ${format.toUpperCase()}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card title="AI-Powered Rubric Generator">
            <div className="space-y-6">
                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md flex items-center space-x-2">
                        <BookmarkIcon />
                        <span>{successMessage}</span>
                    </div>
                )}
                {warningMessage && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md flex items-center space-x-2">
                        <span className="text-xl">⚠️</span>
                        <span>{warningMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                {/* Document Type Selector */}
                <DocumentTypeSelector
                    value={documentType}
                    onChange={setDocumentType}
                    disabled={isLoading || isExtracting}
                />

                {/* RAG Configuration Panel */}
                <RubricRAGConfig
                    enabled={useRAG}
                    onEnabledChange={setUseRAG}
                    region={ragRegion}
                    onRegionChange={setRagRegion}
                    gradeLevel={ragGradeLevel}
                    onGradeLevelChange={setRagGradeLevel}
                    stream={ragStream}
                    onStreamChange={setRagStream}
                    subject={ragSubject}
                    onSubjectChange={setRagSubject}
                    chapterInput={ragChapterInput}
                    onChapterInputChange={setRagChapterInput}
                    enableTopicSuggestion={enableTopicSuggestion}
                    onTopicSuggestionChange={setEnableTopicSuggestion}
                    isExtracting={isExtracting}
                    onExtractContent={handleExtractContent}
                    regions={regions}
                    gradeLevels={gradeLevels}
                    streams={streams}
                    availableSubjects={ragAvailableSubjects}
                    extractedChapters={extractedChapters}
                    isExtractingChapters={isExtractingChapters}
                    onExtractChapters={handleExtractChapters}
                />

                {/* Input Form */}
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {/* Topic Suggestions Display (only when RAG enabled and topic suggestion enabled) */}
                    {useRAG && enableTopicSuggestion && (
                        <TopicSuggestionsDisplay
                            suggestedTopics={suggestedTopics}
                            onSelectTopic={(topic) => setTopic(topic)}
                            isLoading={isExtracting}
                        />
                    )}

                    {/* Basic Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assignment Topic *
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="e.g., Research Paper on Climate Change"
                            />
                        </div>

                        {!useRAG && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Region
                                    </label>
                                    <select
                                        value={region}
                                        onChange={e => setRegion(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {regions.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Grade Level *
                                    </label>
                                    <select
                                        value={gradeLevel}
                                        onChange={e => {
                                            setGradeLevel(e.target.value);
                                            if (e.target.value !== 'Grade 11' && e.target.value !== 'Grade 12') {
                                                setStream('');
                                            }
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {gradeLevels.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {(gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Stream
                                        </label>
                                        <select
                                            value={stream}
                                            onChange={e => setStream(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                        Subject
                                    </label>
                                    <select
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        disabled={availableSubjects.length === 0}
                                    >
                                        <option value="">Select Subject</option>
                                        {availableSubjects.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Assignment Description Generator */}
                    <AssignmentDescriptionGenerator
                        topic={topic}
                        description={assignmentDescription}
                        onDescriptionChange={setAssignmentDescription}
                        onGenerate={handleGenerateDescription}
                        isGenerating={isGeneratingDescription}
                        disabled={isLoading || isExtracting}
                    />

                    {/* Rubric Type Selector */}
                    <RubricTypeSelector selectedType={rubricType} onChange={setRubricType} />

                    {/* Learning Objectives with AI Suggestions */}
                    <LearningObjectivesList
                        objectives={learningObjectives}
                        onAdd={(obj) => setLearningObjectives([...learningObjectives, obj])}
                        onRemove={(index) => setLearningObjectives(learningObjectives.filter((_, i) => i !== index))}
                        onEdit={(index, value) => {
                            const updated = [...learningObjectives];
                            updated[index] = value;
                            setLearningObjectives(updated);
                        }}
                        suggestions={objectiveSuggestions}
                        isLoading={isExtracting}
                    />

                    {/* MoE Standard with AI Suggestions */}
                    <EditableSuggestionField
                        label="MoE Standard ID (Optional)"
                        value={moeStandardId}
                        onChange={setMoeStandardId}
                        suggestions={standardSuggestions}
                        onAcceptSuggestion={(suggestion) => setMoeStandardId(suggestion)}
                        placeholder="e.g., SS.9.1.2"
                        helpText="Enter the Ministry of Education curriculum standard ID"
                        isLoading={isExtracting}
                    />

                    {/* Configuration Panel */}
                    <RubricConfigPanel
                        moeStandardId={moeStandardId}
                        setMoeStandardId={setMoeStandardId}
                        numCriteria={numCriteria}
                        setNumCriteria={setNumCriteria}
                        weightingEnabled={weightingEnabled}
                        setWeightingEnabled={setWeightingEnabled}
                        multimodalAssessment={multimodalAssessment}
                        setMultimodalAssessment={setMultimodalAssessment}
                        tonePreference={tonePreference}
                        setTonePreference={setTonePreference}
                    />

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !topic || !gradeLevel}
                        className="w-full flex justify-center items-center space-x-2 px-4 py-3 text-white font-semibold bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <ScaleIcon />
                        <span>{isLoading ? 'Generating Rubric...' : 'Generate Rubric'}</span>
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            Creating your custom rubric with AI...
                        </p>
                    </div>
                )}

                {/* Rubric Display */}
                {rubric && !isLoading && (
                    <RubricDisplay
                        rubric={rubric}
                        onSave={handleSave}
                        onExport={handleExport}
                        onSaveToLibrary={handleSaveToLibrary}
                        isSaving={isSaving}
                        isExporting={isExporting}
                        isSavingToLibrary={isSavingToLibrary}
                    />
                )}
            </div>
        </Card>
    );
};

export default RubricGeneratorEnhanced;

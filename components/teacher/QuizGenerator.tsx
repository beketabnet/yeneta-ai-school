import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    ListItemText,
    OutlinedInput,
} from '@mui/material';
import {
    AutoAwesome as AutoAwesomeIcon,
    Save as SaveIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Book as BookIcon,
    School as SchoolIcon,
    LibraryAdd as LibraryAddIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';
import { useCurriculum } from '../../hooks/useCurriculum';
import QuizAnimation from './QuizAnimation';    // Import the new animation component

interface Question {
    text: string;
    type: string;
    points: number;
    options?: string[];
    correct_answer: string;
    explanation: string;
    hint: string;
}

interface GeneratedQuiz {
    title: string;
    description: string;
    questions: Question[];
}

const QuizGenerator: React.FC = () => {
    // Refs for height alignment
    const configPanelRef = React.useRef<HTMLDivElement>(null);
    const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        const updateHeight = () => {
            if (configPanelRef.current) {
                // The MUI Box doesn't expose offsetHeight directly on the ref if it's a component, 
                // but here it is likely a div. We'll check.
                setPanelHeight(configPanelRef.current.offsetHeight);
            }
        };
        updateHeight();
        const timer = setTimeout(updateHeight, 100);
        window.addEventListener('resize', updateHeight);
        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(timer);
        };
    }, []);
    // Configuration State
    const [region, setRegion] = useState('Addis Ababa');
    const [subject, setSubject] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [stream, setStream] = useState('');
    const [chapter, setChapter] = useState('');
    const [quizType, setQuizType] = useState('Quiz');
    const [difficulty, setDifficulty] = useState('Medium');
    const [numQuestions, setNumQuestions] = useState(5);
    const [totalPoints, setTotalPoints] = useState(10);
    const [useRAG, setUseRAG] = useState(false);
    const [useLocalLanguage, setUseLocalLanguage] = useState(false);
    const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice']);
    const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({ multiple_choice: 5 });

    const [timeLimits, setTimeLimits] = useState<Record<string, number>>({
        multiple_choice: 60,
        true_false: 30,
        short_answer: 120,
        essay: 300,
        work_out: 180
    });
    const [hintsEnabled, setHintsEnabled] = useState(true);

    // Helper function to get allowed question types based on subject
    const getAllowedQuestionTypes = (subjectName: string) => {
        const mathSubjects = ['Mathematics', 'Physics', 'Chemistry'];
        const isMathSubject = mathSubjects.some(s => subjectName.toLowerCase().includes(s.toLowerCase()));

        const allTypes = [
            { value: 'multiple_choice', label: 'Multiple Choice', allowedFor: 'all' },
            { value: 'true_false', label: 'True/False', allowedFor: 'all' },
            { value: 'short_answer', label: 'Short Answer', allowedFor: 'all' },
            { value: 'essay', label: 'Essay', allowedFor: 'non-math' },
            { value: 'work_out', label: 'Work Out', allowedFor: 'math' },
        ];

        return allTypes.filter(type => {
            if (type.allowedFor === 'all') return true;
            if (type.allowedFor === 'math') return isMathSubject;
            if (type.allowedFor === 'non-math') return !isMathSubject;
            return true;
        });
    };

    const QUESTION_TYPES = getAllowedQuestionTypes(subject);

    // Curriculum Hook
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();

    // Dynamic Options State
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [extractedChapters, setExtractedChapters] = useState<{ number: string | number; title: string; label?: string }[]>([]);
    const [isExtractingChapters, setIsExtractingChapters] = useState(false);

    // Preview/Edit State
    const [editMode, setEditMode] = useState(false);
    const [editedQuiz, setEditedQuiz] = useState<GeneratedQuiz | null>(null);
    const [savedQuizId, setSavedQuizId] = useState<number | null>(null);

    // --- Persistence Logic ---

    // Load cached data on mount
    useEffect(() => {
        const cachedQuiz = localStorage.getItem('cached_generated_quiz');
        if (cachedQuiz) {
            try {
                const parsed = JSON.parse(cachedQuiz);
                setGeneratedQuiz(parsed);
                setEditedQuiz(parsed);
            } catch (e) {
                console.error("Failed to parse cached quiz", e);
            }
        }

        const cachedConfig = localStorage.getItem('cached_quiz_config');
        if (cachedConfig) {
            try {
                const config = JSON.parse(cachedConfig);
                if (config.gradeLevel) setGradeLevel(config.gradeLevel);
                if (config.stream) setStream(config.stream);
                // Subject depends on availableSubjects which updates via effect, 
                // so we might need to wait or rely on the user re-selecting if it fails validation.
                // But setting it here should work if the options populate fast enough or if Select allows value not in options temporarily.
                if (config.subject) setSubject(config.subject);
                if (config.chapter) setChapter(config.chapter);
                if (config.quizType) setQuizType(config.quizType);
                if (config.difficulty) setDifficulty(config.difficulty);
                if (config.numQuestions) setNumQuestions(config.numQuestions);
                if (config.totalPoints) setTotalPoints(config.totalPoints);
                if (config.useRAG !== undefined) setUseRAG(config.useRAG);
                if (config.useLocalLanguage !== undefined) setUseLocalLanguage(config.useLocalLanguage);
                if (config.questionTypes) setQuestionTypes(config.questionTypes);
                if (config.questionCounts) setQuestionCounts(config.questionCounts);
                if (config.timeLimits) setTimeLimits(config.timeLimits);
                if (config.hintsEnabled !== undefined) setHintsEnabled(config.hintsEnabled);
            } catch (e) {
                console.error("Failed to parse cached config", e);
            }
        }
    }, []);

    // Save generated quiz to cache
    useEffect(() => {
        if (generatedQuiz) {
            localStorage.setItem('cached_generated_quiz', JSON.stringify(generatedQuiz));
        }
    }, [generatedQuiz]);

    // Save config to cache
    useEffect(() => {
        const config = {
            gradeLevel,
            stream,
            subject,
            chapter,
            quizType,
            difficulty,
            numQuestions,
            totalPoints,
            useRAG,
            useLocalLanguage,
            questionTypes,
            questionCounts,
            timeLimits,
            hintsEnabled
        };
        localStorage.setItem('cached_quiz_config', JSON.stringify(config));
    }, [gradeLevel, stream, subject, chapter, quizType, difficulty, numQuestions, totalPoints, useRAG, useLocalLanguage, questionTypes, questionCounts, timeLimits, hintsEnabled]);

    // --- End Persistence Logic ---

    // Update subjects when filters change
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
                    useRAG // Pass Use RAG toggle
                );
                setAvailableSubjects(subjects || []);

                // Reset subject if current selection is not in new list
                if (subject && subjects && !subjects.includes(subject)) {
                    setSubject('');
                }
            } catch (err) {
                console.error('Failed to fetch subjects:', err);
                setAvailableSubjects([]);
            }
        };
        fetchSubjects();
    }, [region, gradeLevel, stream, useRAG, getSubjectsFor]);

    // Filter question types when subject changes
    useEffect(() => {
        if (subject) {
            const allowedTypes = getAllowedQuestionTypes(subject).map(t => t.value);
            // Remove any selected types that are no longer allowed
            setQuestionTypes(prev => prev.filter(type => allowedTypes.includes(type)));
            // If no types selected, default to multiple_choice
            if (questionTypes.length === 0 || !questionTypes.some(type => allowedTypes.includes(type))) {
                setQuestionTypes(['multiple_choice']);
            }
        }
    }, [subject]);

    // Sync questionCounts when questionTypes changes
    useEffect(() => {
        setQuestionCounts(prev => {
            const newCounts = { ...prev };
            // Remove unselected
            Object.keys(newCounts).forEach(type => {
                if (!questionTypes.includes(type)) {
                    delete newCounts[type];
                }
            });
            // Add new with default 1 if missing
            questionTypes.forEach(type => {
                if (newCounts[type] === undefined) {
                    newCounts[type] = 1;
                }
            });
            return newCounts;
        });
    }, [questionTypes]);

    // Update numQuestions based on sum of questionCounts
    useEffect(() => {
        if (questionTypes.length > 0) {
            const countSum = Object.values(questionCounts).reduce((total, count) => total + count, 0);
            if (countSum > 0) {
                setNumQuestions(countSum);
            }
        }
    }, [questionCounts]);

    // Reset stream if grade is not 11 or 12
    useEffect(() => {
        if (gradeLevel !== 'Grade 11' && gradeLevel !== 'Grade 12') {
            setStream('');
        }
    }, [gradeLevel]);



    const handleExtractChapters = async () => {
        if (!gradeLevel || !subject) {
            setError('Please select grade and subject to extract chapters');
            return;
        }

        setIsExtractingChapters(true);
        setError(null);
        setExtractedChapters([]);

        try {
            const result = await apiService.extractChapters({
                subject,
                grade_level: gradeLevel,
                region,
                stream,
            });

            if (result.success) {
                if (result.chapters && result.chapters.length > 0) {
                    setExtractedChapters(result.chapters);
                    setSuccessMessage(`Found ${result.chapters.length} chapters.`);
                    // Clear success message after 3 seconds
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setError("No chapters found for this subject and grade. Please upload curriculum documents.");
                }
            } else {
                setError(result.error || "Failed to extract chapters");
            }
        } catch (err: any) {
            setError(err.message || "Failed to extract chapters");
        } finally {
            setIsExtractingChapters(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setSuccessMessage(null);
        setSavedQuizId(null);

        try {
            const params = {
                subject,
                grade_level: gradeLevel,
                stream,
                chapter, // Using chapter as the primary topic/context
                topic: chapter, // Backend expects 'topic', mapping chapter to it
                quiz_type: quizType,
                difficulty,
                num_questions: numQuestions,
                total_points: totalPoints,
                use_rag: useRAG,
                use_local_language: useLocalLanguage,
                question_types: questionTypes,
                question_counts: questionCounts,
                time_limits: timeLimits,
                hint_enabled: hintsEnabled,
            };

            const result = await apiService.generateQuiz(params);
            setGeneratedQuiz(result);
            setEditedQuiz(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveQuizToBackend = async () => {
        if (!editedQuiz) throw new Error("No quiz to save");

        const quizData = {
            ...editedQuiz,
            subject,
            grade_level: parseInt(gradeLevel.replace('Grade ', '')) || 0,
            stream,
            quiz_type: quizType,
            difficulty,
            use_rag: useRAG,
            duration_minutes: Math.ceil((numQuestions * Object.values(timeLimits).reduce((a, b) => a + b, 0) / questionTypes.length) / 60),
            questions: editedQuiz.questions.map(q => ({
                ...q,
                question_type: q.type,
                correct_answer: q.correct_answer || q.explanation || 'Refer to explanation'
            }))
        };

        const savedQuiz = await apiService.saveQuiz(quizData);
        setSavedQuizId(savedQuiz.id);
        return savedQuiz.id;
    };

    const handleSave = async () => {
        if (!editedQuiz) return;
        try {
            await saveQuizToBackend();
            setSuccessMessage('Quiz saved successfully! You can now share it.');
        } catch (err: any) {
            setError(err.message || 'Failed to save quiz');
        }
    };

    // Sharing State
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // ... existing export logic ...

    const handleOpenShareDialog = async () => {
        setIsLoadingStudents(true);
        setShareDialogOpen(true); // Open immediately for better UX

        try {
            let targetQuizId = savedQuizId;

            // Auto-save if not already saved
            if (!targetQuizId) {
                try {
                    targetQuizId = await saveQuizToBackend();
                } catch (saveError: any) {
                    setError("Could not auto-save quiz: " + saveError.message);
                    setShareDialogOpen(false);
                    setIsLoadingStudents(false);
                    return;
                }
            }

            const students = await apiService.getEligibleStudentsForQuiz(targetQuizId);
            setEligibleStudents(students);
            // Default to selecting all students
            setSelectedStudentIds(students.map(s => s.id));
        } catch (err: any) {
            console.error("Failed to fetch students", err);
            setError("Failed to load eligible students for sharing.");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleShareTargeted = async () => {
        if (!savedQuizId) return;

        try {
            await apiService.shareQuiz(savedQuizId, selectedStudentIds);
            setSuccessMessage(`Quiz published and shared with ${selectedStudentIds.length} students!`);
            setShareDialogOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to share quiz');
        }
    };

    const handleExport = async (format: 'pdf' | 'word' | 'txt') => {
        if (!savedQuizId) {
            setError('Please save the quiz first before exporting.');
            return;
        }

        if (format === 'pdf') {
            try {
                const blob = await apiService.exportQuizPDF(savedQuizId);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quiz_${generatedQuiz?.title.replace(/\s+/g, '_') || 'export'}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setSuccessMessage('Quiz exported successfully!');
            } catch (err: any) {
                console.error('Failed to export quiz:', err);
                setError(`Failed to export quiz: ${err.message}`);
            }
        } else {
            setSuccessMessage(`Export to ${format.toUpperCase()} coming soon.`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SchoolIcon fontSize="large" color="primary" />
                Online Quiz & Exam Generator
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Generate curriculum-aligned quizzes and exams using AI.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Configuration Panel */}
                <Box ref={configPanelRef} sx={{ width: { xs: '100%', md: '33.33%' }, minWidth: 300 }}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Configuration
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={useRAG}
                                            onChange={(e) => setUseRAG(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BookIcon fontSize="small" />
                                            <Typography>Use Ethiopian Curriculum (RAG)</Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={useLocalLanguage}
                                            onChange={(e) => setUseLocalLanguage(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>Use Local Language</Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: 1, minWidth: '150px' }}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Region</InputLabel>
                                        <Select
                                            value={region}
                                            label="Region"
                                            onChange={(e) => setRegion(e.target.value)}
                                        >
                                            {regions.map((r) => (
                                                <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: '150px' }}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Grade Level</InputLabel>
                                        <Select
                                            value={gradeLevel}
                                            label="Grade Level"
                                            onChange={(e) => {
                                                setGradeLevel(e.target.value);
                                                if (e.target.value !== 'Grade 11' && e.target.value !== 'Grade 12') {
                                                    setStream('');
                                                }
                                            }}
                                        >
                                            {gradeLevels.map((g) => (
                                                <MenuItem key={g.id} value={g.name}>{g.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {(gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && (
                                    <Box sx={{ flex: 1, minWidth: '150px' }}>
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel>Stream</InputLabel>
                                            <Select
                                                value={stream}
                                                label="Stream"
                                                onChange={(e) => setStream(e.target.value)}
                                            >
                                                {streams.map((s) => (
                                                    <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}
                            </Box>

                            <FormControl fullWidth margin="normal" disabled={!gradeLevel || ((gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12') && !stream)}>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={subject}
                                    label="Subject"
                                    onChange={(e) => setSubject(e.target.value)}
                                >
                                    {availableSubjects.map((s) => (
                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Divider sx={{ my: 2 }} />



                            <TextField
                                fullWidth
                                label="Chapter / Unit / Topic"
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                                margin="normal"
                                required={useRAG}
                                placeholder={useRAG ? "e.g., Unit 3, Chapter 5, or just '3'" : "e.g., Newton's Laws (Optional)"}
                                helperText={useRAG ? "Enter 'Unit 3' or 'Chapter 3' or just the number. The system will find the correct unit." : "Optional: Provide a topic to guide the AI generation."}
                            />

                            {/* Extract Chapters Button & Selection */}
                            {useRAG && (
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            Available Chapters
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={handleExtractChapters}
                                            disabled={isExtractingChapters || !gradeLevel || !subject}
                                            startIcon={isExtractingChapters ? <CircularProgress size={12} /> : <AutoAwesomeIcon fontSize="small" />}
                                            sx={{ fontSize: '0.7rem', py: 0.5 }}
                                        >
                                            {isExtractingChapters ? 'Scanning...' : 'Scan for Chapters'}
                                        </Button>
                                    </Box>

                                    {extractedChapters.length > 0 && (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Select Chapter</InputLabel>
                                            <Select
                                                label="Select Chapter"
                                                value=""
                                                onChange={(e) => {
                                                    const selected = extractedChapters.find(c => c.number.toString() === e.target.value);
                                                    if (selected) {
                                                        const label = selected.label || 'Chapter';
                                                        setChapter(`${label} ${selected.number}: ${selected.title}`);
                                                    }
                                                }}
                                            >
                                                {extractedChapters.map((c, idx) => (
                                                    <MenuItem key={idx} value={c.number.toString()}>
                                                        {c.label || 'Chapter'} {c.number}: {c.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Quiz Type</InputLabel>
                                <Select
                                    value={quizType}
                                    label="Quiz Type"
                                    onChange={(e) => setQuizType(e.target.value)}
                                >
                                    <MenuItem value="Quiz">Quiz</MenuItem>
                                    <MenuItem value="Mid Exam">Mid Exam</MenuItem>
                                    <MenuItem value="Final Exam">Final Exam</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    value={difficulty}
                                    label="Difficulty"
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <MenuItem value="Easy">Easy</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Difficult">Difficult</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Question Types</InputLabel>
                                <Select
                                    multiple
                                    value={questionTypes}
                                    onChange={(e) => setQuestionTypes(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                    input={<OutlinedInput label="Question Types" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={QUESTION_TYPES.find(t => t.value === value)?.label || value} />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {QUESTION_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Checkbox checked={questionTypes.indexOf(type.value) > -1} />
                                            <ListItemText primary={type.label} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Question Distribution */}
                            {questionTypes.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Question Distribution (Total: {Object.values(questionCounts).reduce((a, b) => a + b, 0)})
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2 }}>
                                        {questionTypes.map((qType) => {
                                            const typeLabel = QUESTION_TYPES.find(t => t.value === qType)?.label || qType;
                                            return (
                                                <TextField
                                                    key={qType}
                                                    type="number"
                                                    label={`${typeLabel} Count`}
                                                    value={questionCounts[qType] || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setQuestionCounts(prev => ({
                                                            ...prev,
                                                            [qType]: Math.max(0, val)
                                                        }));
                                                    }}
                                                    margin="dense"
                                                    size="small"
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {/* Time Limits per Question Type */}
                            {questionTypes.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Time Limits (seconds per question type)
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2 }}>
                                        {questionTypes.map((qType) => {
                                            const typeLabel = QUESTION_TYPES.find(t => t.value === qType)?.label || qType;
                                            return (
                                                <TextField
                                                    key={qType}
                                                    fullWidth
                                                    type="number"
                                                    label={`${typeLabel} Time`}
                                                    value={timeLimits[qType] || 60}
                                                    onChange={(e) => setTimeLimits({
                                                        ...timeLimits,
                                                        [qType]: Number(e.target.value)
                                                    })}
                                                    margin="dense"
                                                    size="small"
                                                    InputProps={{ inputProps: { min: 10, max: 600 } }}
                                                />
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={hintsEnabled}
                                        onChange={(e) => setHintsEnabled(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Enable Hints"
                                sx={{ mt: 2 }}
                            />

                            <TextField
                                fullWidth
                                type="number"
                                label="Total Questions"
                                value={numQuestions}
                                disabled
                                margin="normal"
                                helperText="Sum of question counts above"
                            />

                            <TextField
                                fullWidth
                                type="number"
                                label="Total Points"
                                value={totalPoints}
                                onChange={(e) => setTotalPoints(Number(e.target.value))}
                                margin="normal"
                                InputProps={{ inputProps: { min: 1, max: 100 } }}
                                helperText="Total points for the entire quiz"
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                onClick={handleGenerate}
                                disabled={isGenerating || !subject || (useRAG && !chapter)}
                                sx={{ mt: 3 }}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Quiz'}
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                {/* Result Panel */}
                <Box sx={{ flex: 1 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    {generatedQuiz ? (
                        <Card elevation={3} sx={{ height: panelHeight ? `${panelHeight}px` : 'auto', overflowY: 'auto' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h5">
                                        {generatedQuiz.title}
                                    </Typography>
                                    <Box>
                                        <Button startIcon={<LibraryAddIcon />} onClick={handleSave} disabled={!!savedQuizId}>
                                            {savedQuizId ? 'Added to Library' : 'Add to Library'}
                                        </Button>
                                        <Button startIcon={<ShareIcon />} onClick={handleOpenShareDialog}>
                                            Share
                                        </Button>
                                        <Button startIcon={<DownloadIcon />} onClick={() => handleExport('pdf')}>
                                            Export
                                        </Button>
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {generatedQuiz.description}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {generatedQuiz.questions.map((q, index) => (
                                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Q{index + 1}. {q.text}
                                            </Typography>
                                            <Chip label={`${q.points} pts`} size="small" color="primary" variant="outlined" />
                                        </Box>

                                        {q.type === 'multiple_choice' && q.options && (
                                            <Box sx={{ mt: 1, ml: 2 }}>
                                                {q.options.map((opt, i) => (
                                                    <Typography key={i} variant="body2" sx={{
                                                        color: opt === q.correct_answer ? 'success.main' : 'text.primary',
                                                        fontWeight: opt === q.correct_answer ? 'bold' : 'normal'
                                                    }}>
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}

                                        <Box sx={{ mt: 2, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                <strong>Correct Answer:</strong> {q.correct_answer}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{
                            height: panelHeight ? `${panelHeight}px` : '100%',
                            minHeight: 400,
                            borderRadius: '16px', // Rounded to match Card
                            overflow: 'hidden'
                        }}>
                            <QuizAnimation />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Share Quiz with Students</DialogTitle>
                <DialogContent>
                    {isLoadingStudents ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : eligibleStudents.length === 0 ? (
                        <Typography color="text.secondary">
                            No eligible students found in your approved classes for this subject and grade.
                        </Typography>
                    ) : (
                        <>
                            <Typography variant="body2" gutterBottom>
                                Select students to share this quiz with. Unselected students will not see it.
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedStudentIds.length === eligibleStudents.length}
                                        indeterminate={selectedStudentIds.length > 0 && selectedStudentIds.length < eligibleStudents.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudentIds(eligibleStudents.map(s => s.id));
                                            } else {
                                                setSelectedStudentIds([]);
                                            }
                                        }}
                                    />
                                }
                                label="Select All"
                            />
                            <Divider />
                            <Box sx={{ maxHeight: 300, overflow: 'auto', mt: 1 }}>
                                {eligibleStudents.map(student => (
                                    <MenuItem key={student.id} value={student.id} onClick={() => {
                                        const selectedIndex = selectedStudentIds.indexOf(student.id);
                                        let newSelected: number[] = [];
                                        if (selectedIndex === -1) {
                                            newSelected = newSelected.concat(selectedStudentIds, student.id);
                                        } else if (selectedIndex === 0) {
                                            newSelected = newSelected.concat(selectedStudentIds.slice(1));
                                        } else if (selectedIndex === selectedStudentIds.length - 1) {
                                            newSelected = newSelected.concat(selectedStudentIds.slice(0, -1));
                                        } else if (selectedIndex > 0) {
                                            newSelected = newSelected.concat(
                                                selectedStudentIds.slice(0, selectedIndex),
                                                selectedStudentIds.slice(selectedIndex + 1),
                                            );
                                        }
                                        setSelectedStudentIds(newSelected);
                                    }}>
                                        <Checkbox checked={selectedStudentIds.indexOf(student.id) > -1} />
                                        <ListItemText primary={student.username} secondary={student.email} />
                                    </MenuItem>
                                ))}
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleShareTargeted} variant="contained" disabled={selectedStudentIds.length === 0}>
                        Share
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default QuizGenerator;

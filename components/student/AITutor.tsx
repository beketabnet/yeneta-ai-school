import React, { useState, useRef, useEffect, useContext, useCallback, useMemo } from 'react';
import type { StudentDashboardChatMessage as ChatMessage, Expression } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import { PaperAirplaneIcon, VideoCameraIcon, VideoCameraSlashIcon, PaperclipIcon, MicrophoneIcon, XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '../icons/Icons';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { useEngagementMonitorHybrid } from '../../hooks/useEngagementMonitorHybrid';
import { AuthContext } from '../../contexts/AuthContext';
import { EngagementContext } from '../../contexts/EngagementContext';
import { ChevronDownIcon } from '../icons/Icons';
import TutorConfigPanel from './aiTutor/TutorConfigPanel';
import AITutorHero from './aiTutor/AITutorHero';
import TrustedBy from './aiTutor/TrustedBy';
import MobileConfigToggle from './aiTutor/MobileConfigToggle';
import { useCurriculum } from '../../hooks/useCurriculum';

interface EngagementLog {
    timestamp: string;
    message: string;
    color: string;
}

const DEFAULT_WELCOME_MESSAGE = "Hello! I'm YENETA, your AI Tutor. How can I help you with your studies today? You can ask me questions, upload a photo of your work, or even send a voice message.";

const formatList = (items: string[]): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const buildCurriculumWelcomeMessage = ({
    grade,
    stream,
    subject,
    chapter,
    chapterTopics,
    chapterSummary,
}: {
    grade: string;
    stream: string;
    subject: string;
    chapter: string;
    chapterTopics?: string[];
    chapterSummary?: string | null;
}): string => {
    const focusSegments = [
        grade && grade.trim(),
        stream && `${stream.trim()} stream`,
        subject && subject.trim(),
    ].filter(Boolean) as string[];

    const focusText = focusSegments.length > 0
        ? `for ${formatList(focusSegments)}`
        : 'aligned with the Ethiopian curriculum';

    let chapterText = '';
    if (chapter && chapter.trim().length > 0) {
        if (chapterTopics && chapterTopics.length > 0) {
            const formattedTopics = chapterTopics.slice(0, 4).map(t => {
                return t.charAt(0).toUpperCase() + t.slice(1);
            });
            if (formattedTopics.length <= 2) {
                chapterText = ` We'll focus on ${chapter.trim()}, covering ${formattedTopics.join(' and ')}.`;
            } else {
                const lastTopic = formattedTopics.pop();
                chapterText = ` We'll focus on ${chapter.trim()}, covering ${formattedTopics.join(', ')}, and ${lastTopic}.`;
            }
        } else if (chapterSummary) {
            const summaryPreview = chapterSummary.substring(0, 200).trim();
            let cleanSummary = summaryPreview;
            if (!cleanSummary.endsWith('.') && !cleanSummary.endsWith('!') && !cleanSummary.endsWith('?')) {
                const lastPeriod = cleanSummary.lastIndexOf('.');
                if (lastPeriod > cleanSummary.length * 0.7) {
                    cleanSummary = cleanSummary.substring(0, lastPeriod + 1);
                }
            }
            chapterText = ` We'll explore ${chapter.trim()}. ${cleanSummary}${chapterSummary.length > 200 ? '...' : ''}`;
        } else {
            chapterText = ` We'll dive into ${chapter.trim()} using your textbooks.`;
        }
    } else {
        chapterText = ' Set a chapter, unit, or lesson above to focus our session even more.';
    }

    return `Selam! I'm YENETA, your AI Tutor ${focusText}. I'm ready to use Ethiopian curriculum resources to guide you.${chapterText} When you're ready, ask me anything or upload your work, and we'll explore it together.`;
};

const AITutor: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: DEFAULT_WELCOME_MESSAGE }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMonitorEnabled, setIsMonitorEnabled] = useState(false);
    const [currentExpression, setCurrentExpression] = useState<Expression>('unknown');
    const [engagementLogs, setEngagementLogs] = useState<EngagementLog[]>([]);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [useRAG, setUseRAG] = useState(true);
    const [ragStatus, setRagStatus] = useState<'success' | 'fallback' | 'disabled'>('disabled');
    const [ragSources, setRagSources] = useState<string[]>([]);

    const [ragMessage, setRagMessage] = useState<string | null>(null);
    const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);


    // Curriculum Hook
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();
    const [selectedRegion, setSelectedRegion] = useState('Addis Ababa');

    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedStream, setSelectedStream] = useState<string>('');
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [streamRequired, setStreamRequired] = useState(false);
    const [curriculumConfig, setCurriculumConfig] = useState<any>(null);
    const [chapterInput, setChapterInput] = useState<string>('');
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);
    const [savedConfig, setSavedConfig] = useState<any>(null);
    const [chapterTopics, setChapterTopics] = useState<string[]>([]);
    const [chapterSummary, setChapterSummary] = useState<string | null>(null);
    const [hasConfigChanged, setHasConfigChanged] = useState(false);
    const [extractedChapters, setExtractedChapters] = useState<{ number: string | number; title: string; label?: string }[]>([]);
    const [isExtractingChapters, setIsExtractingChapters] = useState(false);

    // --- Speech Recognition & Synthesis Types ---
    useEffect(() => {
        // Stop speaking when component unmounts
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const [isAudioMode, setIsAudioMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null); // Use any to avoid strict type issues with window.SpeechRecognition

    const speakText = (text: string) => {
        if (!isAudioMode) return;

        window.speechSynthesis.cancel(); // Stop any current speech

        // Strip markdown symbols for better reading
        const cleanText = text.replace(/[*#_`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const handleMicPress = () => {
        if (isRecording) {
            // If already recording, stop it (toggle behavior)
            handleMicRelease();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false; // Stop after one sentence/phrase
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript;
                }
                setInput(prev => {
                    // basic logic to avoid duplicating interim results if we were doing continuous
                    return transcript;
                });
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Error starting speech recognition:", err);
            setIsRecording(false);
        }
    };

    const handleMicRelease = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const { user } = useContext(AuthContext);
    const { updateStudentEngagement } = useContext(EngagementContext);

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

    // Load saved tutor configuration on mount
    useEffect(() => {
        const loadSavedConfig = async () => {
            try {
                const config = await apiService.getTutorConfiguration();
                if (config && config.id) {
                    setSavedConfig(config);
                    setUseRAG(config.use_ethiopian_curriculum || true);
                    if (config.region) setSelectedRegion(config.region); // Assuming backend supports region
                    if (config.grade) setSelectedGrade(config.grade);
                    if (config.stream) setSelectedStream(config.stream);
                    if (config.subject) setSelectedSubject(config.subject);
                    if (config.chapter_input) setChapterInput(config.chapter_input);
                    if (config.chapter_topics) setChapterTopics(config.chapter_topics);
                    if (config.chapter_summary) setChapterSummary(config.chapter_summary);
                    setHasConfigChanged(false);

                    // Generate welcome message for loaded config only if it exists
                    if (config.use_ethiopian_curriculum && config.grade && config.id) {
                        setIsGeneratingWelcome(true);
                        try {
                            const response = await apiService.generateTutorWelcomeMessage({
                                grade: config.grade,
                                subject: config.subject || undefined,
                                stream: config.stream || undefined,
                                chapter: config.chapter_input || undefined,
                                chapter_title: config.chapter_title || undefined,
                                chapter_topics: config.chapter_topics || undefined,
                                chapter_summary: config.chapter_summary || undefined,
                                learning_objectives: config.learning_objectives || undefined,
                                use_ethiopian_curriculum: config.use_ethiopian_curriculum,
                            });
                            setGeneratedWelcomeMessage(response.welcome_message);
                        } catch (error) {
                            console.error('Failed to generate welcome message:', error);
                        } finally {
                            setIsGeneratingWelcome(false);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load saved configuration:', err);
            }
        };
        loadSavedConfig();
    }, []);

    // Track configuration changes
    useEffect(() => {
        if (!savedConfig) {
            setHasConfigChanged(false);
            setSaveConfigSuccess(false);
            return;
        }

        const hasChanged =
            savedConfig.use_ethiopian_curriculum !== useRAG ||
            savedConfig.grade !== selectedGrade ||
            savedConfig.stream !== selectedStream ||
            savedConfig.subject !== selectedSubject ||
            savedConfig.chapter_input !== chapterInput ||
            (savedConfig.region && savedConfig.region !== selectedRegion);

        setHasConfigChanged(hasChanged);
        // Reset success state when user makes new changes
        if (hasChanged) {
            setSaveConfigSuccess(false);
        }
    }, [useRAG, selectedGrade, selectedStream, selectedSubject, chapterInput, savedConfig, selectedRegion]);

    // Initialize grade from user profile (only if no saved config)
    useEffect(() => {
        if (user && user.gradeLevel && !selectedGrade) {
            setSelectedGrade(user.gradeLevel);
        }
    }, [user, savedConfig]);

    // Fetch subjects when grade or stream changes
    useEffect(() => {
        const updateSubjects = async () => {
            if (!selectedGrade || !useRAG) return;

            setIsSubjectsLoading(true);
            try {
                const subjects = await getSubjectsFor(
                    selectedRegion || undefined,
                    selectedGrade,
                    selectedStream || undefined,
                    true // useRAG is confirmed true by the check at start of function
                );
                setAvailableSubjects(subjects || []);

                // Determine if stream is required (simple logic: Grade 11/12)
                const isStreamReq = selectedGrade === 'Grade 11' || selectedGrade === 'Grade 12';
                setStreamRequired(isStreamReq);

                // Reset subject if it's not in the new list
                if (selectedSubject && subjects && !subjects.includes(selectedSubject)) {
                    setSelectedSubject('');
                }
            } catch (err) {
                console.error('Failed to fetch subjects:', err);
                setAvailableSubjects([]);
            } finally {
                setIsSubjectsLoading(false);
            }
        };

        updateSubjects();
    }, [selectedGrade, selectedStream, selectedRegion, useRAG, getSubjectsFor]);

    const [generatedWelcomeMessage, setGeneratedWelcomeMessage] = useState<string | null>(null);
    const [isGeneratingWelcome, setIsGeneratingWelcome] = useState(false);

    const welcomeMessage = useMemo(() => {
        // Use LLM-generated message if available, otherwise use default
        if (generatedWelcomeMessage) {
            return generatedWelcomeMessage;
        }
        return DEFAULT_WELCOME_MESSAGE;
    }, [generatedWelcomeMessage]);

    useEffect(() => {
        if (hasUserInteracted) {
            return;
        }
        setMessages(prev => {
            if (prev.length !== 1) return prev;
            const first = prev[0];
            if (!first || first.role !== 'model' || first.content === welcomeMessage) {
                return prev;
            }
            return [{ ...first, content: welcomeMessage }];
        });
    }, [welcomeMessage, hasUserInteracted]);

    const handleGradeChange = (newGrade: string) => {
        setSelectedGrade(newGrade);
        setSelectedStream('');
        setSelectedSubject('');
        setAvailableSubjects([]);
        setIsSubjectsLoading(false);
        if (newGrade !== 'Grade 11' && newGrade !== 'Grade 12') {
            setStreamRequired(false);
        }
    };

    const handleStreamChange = (newStream: string) => {
        setSelectedStream(newStream);
        setSelectedSubject('');
    };

    const handleToggleCurriculum = () => {
        setUseRAG(prev => {
            const next = !prev;
            if (!next) {
                setRagStatus('disabled');
                setRagSources([]);
                setRagMessage(null);
                setChapterInput('');
            }
            return next;
        });
    };

    const handleExtractChapters = async () => {
        if (!selectedGrade || !selectedSubject) {
            alert('Please select grade and subject to extract chapters');
            return;
        }

        setIsExtractingChapters(true);
        setExtractedChapters([]);

        try {
            const result = await apiService.extractChapters({
                subject: selectedSubject,
                grade_level: selectedGrade,
                region: selectedRegion,
                stream: selectedStream,
            });

            if (result.success) {
                setExtractedChapters(result.chapters);
            } else {
                console.error("Failed to extract chapters:", result.error);
                alert(result.error || "Failed to extract chapters");
            }
        } catch (err: any) {
            console.error("Failed to extract chapters:", err);
            alert(err.message || "Failed to extract chapters");
        } finally {
            setIsExtractingChapters(false);
        }
    };

    const handleChapterChange = async (value: string) => {
        if (value === 'custom_input') {
            setChapterInput('');
            return;
        }

        setChapterInput(value);

        // If a valid chapter is selected (not empty), try to extract context
        if (value && value.trim()) {
            // Find full chapter object if possible
            const selectedChapterObj = extractedChapters.find(c => c.title === value);
            const chapterTitle = selectedChapterObj ? `${selectedChapterObj.label || 'Chapter'} ${selectedChapterObj.number}: ${selectedChapterObj.title}` : value;

            try {
                // Extract context for the tutor (topics, summary)
                // We use a lighter extraction here just to get topics and summary
                const response = await apiService.extractCurriculumContent({
                    grade_level: selectedGrade,
                    subject: selectedSubject,
                    chapter_input: value,
                    suggest_topic: true,
                    region: selectedRegion,
                    document_type: 'tutor_context'
                });

                if (response.success) {
                    if (response.suggested_topics) setChapterTopics(response.suggested_topics);

                    // Update welcome message immediately with new context
                    setIsGeneratingWelcome(true);
                    const welcomeResponse = await apiService.generateTutorWelcomeMessage({
                        grade: selectedGrade,
                        subject: selectedSubject,
                        stream: selectedStream || undefined,
                        chapter: value,
                        chapter_title: chapterTitle,
                        chapter_topics: response.suggested_topics || undefined,
                        chapter_summary: (response.chapter_context as any)?.summary || undefined,
                        learning_objectives: response.learning_objectives || undefined,
                        use_ethiopian_curriculum: useRAG,
                    });
                    setGeneratedWelcomeMessage(welcomeResponse.welcome_message);
                    setIsGeneratingWelcome(false);
                }
            } catch (err) {
                console.error("Error extracting chapter context:", err);
            }
        }
    };

    // Auto-save configuration with debounce
    useEffect(() => {
        // Skip if no changes or critical data missing
        if (!hasConfigChanged || !selectedGrade || (streamRequired && !selectedStream)) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSavingConfig(true);
            setSaveConfigSuccess(false);

            try {
                const configData = {
                    use_ethiopian_curriculum: useRAG,
                    region: selectedRegion, // Try to save region
                    grade: selectedGrade,
                    stream: selectedStream || undefined,
                    subject: selectedSubject || undefined,
                    chapter_input: chapterInput || undefined,
                };

                const saved = await apiService.saveTutorConfiguration(configData);

                // Update chapter metadata if available
                if (saved.chapter_topics) setChapterTopics(saved.chapter_topics);
                if (saved.chapter_summary) setChapterSummary(saved.chapter_summary);

                setSavedConfig(saved);
                setSaveConfigSuccess(true);
                setHasConfigChanged(false);

                // Generate new welcome message if appropriate
                if (useRAG && selectedGrade) {
                    // Only generate if we have enough info to make it worthwhile
                    const shouldGenerate = saved.chapter_title || saved.subject || saved.chapter_input;

                    if (shouldGenerate) {
                        setIsGeneratingWelcome(true);
                        try {
                            const response = await apiService.generateTutorWelcomeMessage({
                                grade: selectedGrade,
                                subject: selectedSubject || undefined,
                                stream: selectedStream || undefined,
                                chapter: chapterInput || undefined,
                                chapter_title: saved.chapter_title || undefined,
                                chapter_topics: saved.chapter_topics || undefined,
                                chapter_summary: saved.chapter_summary || undefined,
                                learning_objectives: saved.learning_objectives || undefined,
                                use_ethiopian_curriculum: useRAG,
                            });
                            setGeneratedWelcomeMessage(response.welcome_message);
                        } catch (error) {
                            console.error('Failed to generate welcome message:', error);
                        } finally {
                            setIsGeneratingWelcome(false);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to save configuration:', error);
            } finally {
                setIsSavingConfig(false);
            }
        }, 1500); // 1.5s debounce to avoid too many saves while typing

        return () => clearTimeout(timer);
    }, [
        useRAG,
        selectedGrade,
        selectedStream,
        selectedSubject,
        chapterInput,
        hasConfigChanged,
        streamRequired,
        selectedRegion
    ]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const getExpressionStyle = (expression: Expression): Omit<EngagementLog, 'timestamp'> => {
        switch (expression) {
            case 'happy': return { message: 'Student appears engaged and happy.', color: 'text-green-400' };
            case 'surprised': return { message: 'Student appears surprised.', color: 'text-yellow-400' };
            case 'neutral': return { message: 'Student appears neutral.', color: 'text-gray-400' };
            case 'sad': return { message: 'Student may be sad or confused.', color: 'text-blue-400' };
            case 'angry': return { message: 'Student may be frustrated or angry.', color: 'text-red-400' };
            case 'fearful': return { message: 'Student may be fearful or anxious.', color: 'text-purple-400' };
            default: return { message: 'Engagement status is unknown.', color: 'text-gray-500' };
        }
    };

    // Track previous expression to avoid duplicate logs
    const prevExpressionRef = useRef<Expression | null>(null);

    // Memoize the expression change handler to prevent hook re-initialization
    const handleExpressionChange = useCallback((expression: Expression) => {
        setCurrentExpression(expression);
        if (user && isMonitorEnabled) {
            updateStudentEngagement(user.id.toString(), expression);
        }
        // Only log if expression changed
        if (isMonitorEnabled && expression !== prevExpressionRef.current) {
            prevExpressionRef.current = expression;
            const { message, color } = getExpressionStyle(expression);
            const timestamp = new Date().toLocaleTimeString();
            setEngagementLogs(prev => [{ timestamp, message, color }, ...prev.slice(0, 99)]);
        }
    }, [user, isMonitorEnabled, updateStudentEngagement]);

    useEngagementMonitorHybrid({
        videoRef,
        canvasRef,
        isMonitorEnabled,
        onExpressionChange: handleExpressionChange
    });

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages]);

    useEffect(() => {
        logContainerRef.current?.scrollTo(0, 0);
    }, [engagementLogs]);

    const handleToggleMonitor = () => {
        const newIsEnabled = !isMonitorEnabled;
        setIsMonitorEnabled(newIsEnabled);
        if (!newIsEnabled) {
            setEngagementLogs([]);
            setCurrentExpression('unknown');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: File upload with streaming to backend is not implemented yet.
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input, imageUrl: attachmentPreview || undefined };
        setMessages(prev => [...prev, userMessage]);
        setHasUserInteracted(true);

        const messageToSend = input;

        setInput('');
        setAttachment(null);
        setAttachmentPreview(null);
        setIsLoading(true);

        try {
            // Prepare RAG parameters
            const ragParams = useRAG ? {
                region: selectedRegion,
                grade: selectedGrade,
                subject: selectedSubject,
                stream: selectedStream || undefined,
                chapter: chapterInput.trim() ? chapterInput.trim() : undefined,
            } : undefined;

            const { stream, headers } = await apiService.getTutorResponseStream(messageToSend, useRAG, ragParams);

            // Extract RAG metadata from headers
            const status = headers?.['x-rag-status'] || 'disabled';
            const sources = headers?.['x-rag-sources']?.split(',').filter(Boolean) || [];
            const message = headers?.['x-rag-message'] || null;

            setRagStatus(status as 'success' | 'fallback' | 'disabled');
            setRagSources(sources);
            setRagMessage(message);

            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }

            // Speak the final response if audio mode is on
            if (isAudioMode) {
                speakText(modelResponse);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting to the AI Tutor service right now. Please try again later." }]);
            setRagStatus('disabled');
            setRagSources([]);
            setRagMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            setAttachment(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setAttachmentPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview('pdf'); // Special key for PDF icon
            }
        }
        if (e.target) { e.target.value = ''; } // Reset file input
    };








    const expressionEmojiMap: Record<Expression, string> = {
        happy: '😊', sad: '😟', angry: '😠', fearful: '😨', disgusted: '🤢',
        surprised: '😮', neutral: '😐', unknown: '🤔',
    };

    const handleClearChat = () => {
        setMessages([{ role: 'model', content: welcomeMessage }]);
        setRagStatus('disabled');
        setRagSources([]);
        setRagMessage(null);
        setHasUserInteracted(false);
        setInput('');
        setAttachment(null);
        setAttachmentPreview(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-3xl p-4 md:p-6 transition-colors duration-500">
            <AITutorHero
                userFirstName={user?.first_name}
                onStartChat={() => {
                    const inputEl = document.querySelector('textarea[placeholder="Ask me anything..."]') as HTMLTextAreaElement;
                    if (inputEl) inputEl.focus();
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {/* Mobile Toggle for Config */}
                <MobileConfigToggle isOpen={isMobileConfigOpen} onToggle={() => setIsMobileConfigOpen(!isMobileConfigOpen)} />

                <div className="lg:col-span-2 space-y-8">
                    <Card
                        title="Your Personal AI Tutor"
                        className="h-full flex flex-col shadow-xl hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20"
                        action={
                            <div className="flex items-center gap-2">
                                <span className="hidden md:flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Online
                                </span>
                                <button
                                    onClick={handleClearChat}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all flex items-center gap-2 border border-red-200 dark:border-red-800/50"
                                    title="Clear chat history and restart"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    Restart
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {/* Config Panel - Mobile Collapsible */}
                            <div className={`${isMobileConfigOpen ? 'block' : 'hidden'} lg:block transition-all duration-300 ease-in-out`}>
                                <TutorConfigPanel
                                    useRAG={useRAG}
                                    onToggleRAG={handleToggleCurriculum}
                                    ragStatus={ragStatus}
                                    ragMessage={ragMessage}
                                    regions={regions}
                                    selectedRegion={selectedRegion}
                                    onRegionChange={setSelectedRegion}
                                    gradeLevels={gradeLevels}
                                    selectedGrade={selectedGrade}
                                    onGradeChange={handleGradeChange}
                                    streams={streams}
                                    streamRequired={streamRequired}
                                    selectedStream={selectedStream}
                                    onStreamChange={handleStreamChange}
                                    selectedSubject={selectedSubject}
                                    onSubjectChange={(value) => setSelectedSubject(value)}
                                    availableSubjects={availableSubjects}
                                    isSubjectsLoading={isSubjectsLoading}
                                    chapterInput={chapterInput}
                                    onChapterChange={handleChapterChange}
                                    extractedChapters={extractedChapters}
                                    isExtractingChapters={isExtractingChapters}
                                    onExtractChapters={handleExtractChapters}
                                    isSaving={isSavingConfig}
                                    saveSuccess={saveConfigSuccess}
                                    hasConfigChanged={hasConfigChanged}
                                />
                            </div>

                            <div className="flex flex-col h-[60vh] bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-inner">
                                <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                    {messages.map((msg, index) => (
                                        <div key={index}>
                                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                                <div className={`max-w-[85%] lg:max-w-xl px-5 py-3.5 shadow-sm transition-all duration-200 ${msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-200 dark:shadow-none'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm shadow-sm'
                                                    }`}>
                                                    {msg.imageUrl && msg.imageUrl !== 'pdf' && <img src={msg.imageUrl} alt="attachment" className="rounded-lg mb-3 shadow-md max-w-full hover:scale-105 transition-transform" />}
                                                    {msg.imageUrl === 'pdf' && <div className="text-sm p-3 bg-white/20 backdrop-blur-sm rounded-lg mb-3 border border-white/30 flex items-center gap-2"><PaperclipIcon className="w-4 h-4" /> Attached PDF: {attachment?.name || 'document.pdf'}</div>}
                                                    {msg.content && msg.role === 'model' && <MarkdownRenderer content={msg.content} className="text-sm prose prose-sm dark:prose-invert max-w-none" />}
                                                    {msg.content && msg.role === 'user' && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                                                </div>
                                            </div>

                                            {/* RAG Status Badge - Only show after last AI response */}
                                            {msg.role === 'model' && index === messages.length - 1 && !isLoading && (
                                                <div className="flex justify-start mt-2 ml-1">
                                                    <div className="max-w-lg">
                                                        {/* Success Badge */}
                                                        {ragStatus === 'success' && ragSources.length > 0 && (
                                                            <div className="inline-flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full shadow-sm">
                                                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mr-2">✅ Verified Curriculum</span>
                                                                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 border-l border-emerald-200 pl-2">
                                                                    {ragSources.slice(0, 1).map(s => s.split('/').pop()).join(', ')}{ragSources.length > 1 ? ` +${ragSources.length - 1}` : ''}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Fallback Badge */}
                                                        {ragStatus === 'fallback' && ragMessage && (
                                                            <div className="inline-block px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-orange-600 dark:text-orange-400 text-xs font-semibold">⚠️ AI Model Only</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                                    {ragMessage}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Disabled Badge */}
                                                        {ragStatus === 'disabled' && useRAG === false && (
                                                            <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">ℹ️ Curriculum mode disabled</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && messages[messages.length - 1].role === 'user' && (
                                        <div className="flex justify-start">
                                            <div className="max-w-lg px-6 py-4 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-50">
                                                <div className="flex space-x-2 items-center">
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Action Buttons */}
                                {messages.length === 1 && (
                                    <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider pl-1">Quick Starters</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { text: "Explain a concept", icon: "📚", prompt: "Explain to me how photosynthesis works" },
                                                { text: "Solve a problem", icon: "🧮", prompt: "Help me solve this math problem step by step" },
                                                { text: "Practice questions", icon: "✍️", prompt: "Give me practice questions on" },
                                                { text: "Summarize topic", icon: "📝", prompt: "Summarize the key points about" },
                                            ].map((action, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(action.prompt)}
                                                    className="group px-4 py-2 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <span className="mr-1.5 grayscale group-hover:grayscale-0 transition-all">{action.icon}</span>
                                                    {action.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    {attachmentPreview && (
                                        <div className="p-3 mb-2 bg-indigo-50 dark:bg-gray-700/50 border border-indigo-100 dark:border-gray-600 rounded-xl flex justify-between items-center text-sm animate-fadeIn">
                                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                                <PaperclipIcon className="w-4 h-4" />
                                                <span className="font-medium truncate max-w-[200px]">{attachment?.name}</span>
                                            </div>
                                            <button onClick={() => { setAttachment(null); setAttachmentPreview(null); }} className="text-indigo-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-600 rounded-full p-1 shadow-sm">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />

                                        <div className="flex items-center gap-1 pb-1 pl-1">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50" title="Attach file">
                                                <PaperclipIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isAudioMode) {
                                                        stopSpeaking();
                                                        setIsAudioMode(false);
                                                    } else {
                                                        setIsAudioMode(true);
                                                    }
                                                }}
                                                className={`p-2.5 rounded-full transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 ${isAudioMode ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-200 dark:ring-indigo-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700'}`}
                                                title={isAudioMode ? "Disable Audio Response" : "Enable Audio Response"}
                                            >
                                                {isAudioMode ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onMouseDown={handleMicPress}
                                                onMouseUp={handleMicRelease}
                                                onTouchStart={handleMicPress}
                                                onTouchEnd={handleMicRelease}
                                                disabled={isLoading}
                                                className={`p-2.5 rounded-full transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 ${isRecording ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' : 'text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700'}`}
                                                title="Hold to record"
                                            >
                                                <MicrophoneIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder={isRecording ? "Recording audio..." : "Ask me anything..."}
                                            className="flex-1 max-h-32 min-h-[44px] py-3 px-3 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none text-sm leading-relaxed"
                                            disabled={isLoading || isRecording}
                                            rows={1}
                                        />

                                        <button
                                            type="submit"
                                            disabled={isLoading || (!input.trim() && !attachment)}
                                            className="p-3 mb-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                                        >
                                            <PaperAirplaneIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : '-ml-0.5'}`} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card
                        title="Engagement Monitor"
                        className="shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                        <div className="flex flex-col h-[65vh]">
                            {/* Video Feed - Fixed Height */}
                            <div className="relative w-full h-56 flex-shrink-0 bg-black rounded-2xl overflow-hidden mb-4 shadow-lg ring-1 ring-white/10">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover transform transition-transform ${isMonitorEnabled ? 'scale-x-[-1]' : 'scale-0'}`}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className={`absolute top-0 left-0 w-full h-full transform transition-transform ${isMonitorEnabled ? 'scale-x-[-1]' : 'scale-0'}`}
                                />
                                {!isMonitorEnabled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-900/50 backdrop-blur-sm">
                                        <div className="p-4 bg-gray-800 rounded-full mb-3">
                                            <VideoCameraSlashIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium">Monitor is off</p>
                                    </div>
                                )}
                                {isMonitorEnabled && (
                                    <div className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-xl text-2xl border border-white/10 shadow-lg">
                                        {expressionEmojiMap[currentExpression]}
                                    </div>
                                )}
                            </div>

                            {/* Current Status - Prominent Display */}
                            {isMonitorEnabled && currentExpression && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-4xl animate-pulse filter drop-shadow-lg transform hover:scale-110 transition-transform">{expressionEmojiMap[currentExpression]}</span>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Current Status</p>
                                                <p className={`text-sm font-bold ${getExpressionStyle(currentExpression).color} tracking-wide`}>
                                                    {getExpressionStyle(currentExpression).message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute opacity-75"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Logs - Constrained Height with Scroll */}
                            <div className="flex-1 min-h-0 flex flex-col mb-4">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Session History</p>
                                    {engagementLogs.length > 0 && (
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-medium text-gray-600 dark:text-gray-300">{engagementLogs.length} events</span>
                                    )}
                                </div>
                                <div ref={logContainerRef} className="flex-1 bg-gray-50 dark:bg-black/50 rounded-2xl p-4 font-mono text-xs overflow-y-auto border border-gray-100 dark:border-gray-800 shadow-inner custom-scrollbar">
                                    {engagementLogs.length === 0 && isMonitorEnabled && <p className="text-gray-500 animate-pulse text-center mt-4">Calibrating engagement sensors...</p>}
                                    {engagementLogs.length === 0 && !isMonitorEnabled && <p className="text-gray-400 text-center mt-4 italic">Enable monitor to see live analysis.</p>}
                                    {engagementLogs.map((log, index) => (
                                        <div key={index} className="mb-2 last:mb-0 transform animate-fadeIn">
                                            <span className="text-gray-400 text-[10px] mr-2 opacity-70">{log.timestamp}</span>
                                            <span className={`font-medium ${log.color}`}>{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Control Button - Fixed at Bottom */}
                            <div className="flex-shrink-0 pt-2">
                                <button
                                    onClick={handleToggleMonitor}
                                    className={`w-full group relative flex items-center justify-center space-x-2 px-4 py-3 font-bold rounded-xl text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${isMonitorEnabled
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200 dark:shadow-none'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200 dark:shadow-none'
                                        }`}
                                >
                                    {isMonitorEnabled ? <VideoCameraSlashIcon className="w-5 h-5" /> : <VideoCameraIcon className="w-5 h-5" />}
                                    <span>{isMonitorEnabled ? 'Disable Monitor' : 'Enable Monitor'}</span>
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Privacy Protected: Video processed locally
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <TrustedBy />
        </div>
    );
};

export default AITutor;
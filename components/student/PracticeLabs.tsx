import React, { useState, useEffect } from 'react';
import { BeakerIcon } from '../icons/Icons';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import { useCurriculum } from '../../hooks/useCurriculum';

// Import modular components
import ConfigPanel from './practiceLabs/ConfigPanel';
import PerformanceTracker from './practiceLabs/PerformanceTracker';
import QuestionDisplay from './practiceLabs/QuestionDisplay';
import FeedbackDisplay from './practiceLabs/FeedbackDisplay';
import SessionReflection from './practiceLabs/SessionReflection';

// Import new enhanced components
import PracticeModeSelector from './practiceLabs/PracticeModeSelector';
import TwoLayerHintSystem from './practiceLabs/TwoLayerHintSystem';
import ExamModeTimer from './practiceLabs/ExamModeTimer';
import ExamReviewReport from './practiceLabs/ExamReviewReport';
import BadgesDisplay from './practiceLabs/BadgesDisplay';
import MissionsPanel from './practiceLabs/MissionsPanel';
import StudentFeedbackForm from './practiceLabs/StudentFeedbackForm';
import DiagnosticTestDisplay from './practiceLabs/DiagnosticTestDisplay';
import DiagnosticTestResults from './practiceLabs/DiagnosticTestResults';
import PracticeArena from './practiceLabs/PracticeArena';

// Import types
import {
    PracticeConfig,
    PracticeQuestion,
    AdaptiveFeedback,
    StudentPerformance,
    SessionData,
    SessionReflection as SessionReflectionType,
    Difficulty,
    PracticeMode,
    Badge,
    Mission,
    ExamReviewReport as ExamReviewReportType,
    QuestionReview,
    StudentFeedback,
    DiagnosticTest
} from './practiceLabs/types';
import { isNonEnglishSubject } from '../../utils/curriculumData';

const PracticeLabs: React.FC = () => {
    // Curriculum Hook
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();

    // Configuration state
    const [config, setConfig] = useState<PracticeConfig>({
        practiceMode: 'standard',  // New: standard/exam/game
        questionMode: 'subject',   // Renamed from 'mode'
        subject: '',
        topic: '',
        region: 'Addis Ababa',     // Default region
        chapter: '',               // New: Chapter/Unit/Lesson input
        useChapterMode: false,     // New: Flag for chapter-based generation
        gradeLevel: 9,
        difficulty: 'medium',
        useExamRAG: false,
        useCurriculumRAG: false,
        stream: '',
        examYear: '',
        coachPersonality: 'patient',
        adaptiveDifficulty: true,
        enableHints: true,         // New: disabled in exam mode
        enableExplanations: true,  // New: disabled during exam
        timeLimit: undefined,      // New: for exam mode
        targetZPDScore: undefined  // New: for ZPD calibration
    });

    // Question and feedback state
    const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<AdaptiveFeedback | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Loading states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Performance tracking
    const [performance, setPerformance] = useState<StudentPerformance>({
        correctCount: 0,
        totalCount: 0,
        averageScore: 0,
        currentDifficulty: 'medium',
        currentZPDScore: 0.5,           // New: ZPD complexity score
        masteryProfile: {},             // New: topic mastery tracking
        streak: 0,
        totalXP: 0,
        level: 1,
        skillsProgress: {},
        badges: [],                     // New: earned badges
        activeMissions: [],             // New: active missions
        completedMissions: [],          // New: completed missions
        misconceptionPatterns: []       // New: detected patterns
    });

    // Session tracking
    const [sessionData, setSessionData] = useState<SessionData>({
        totalQuestions: 0,
        correctAnswers: 0,
        subjectsCovered: [],
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
        timeSpent: 0,
        startTime: Date.now()
    });

    const [sessionReflection, setSessionReflection] = useState<SessionReflectionType | null>(null);
    const [showReflection, setShowReflection] = useState(false);

    // Diagnostic test state
    const [diagnosticTest, setDiagnosticTest] = useState<DiagnosticTest | null>(null);
    const [showDiagnosticTest, setShowDiagnosticTest] = useState(false);
    const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
    const [diagnosticEvaluation, setDiagnosticEvaluation] = useState<any>(null);
    const [showDiagnosticResults, setShowDiagnosticResults] = useState(false);

    // New enhanced state
    const [examReviewReport, setExamReviewReport] = useState<ExamReviewReportType | null>(null);
    const [showExamReview, setShowExamReview] = useState(false);
    const [examQuestions, setExamQuestions] = useState<QuestionReview[]>([]);
    const [examTimeRemaining, setExamTimeRemaining] = useState<number | null>(null);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [showBadgesPanel, setShowBadgesPanel] = useState(false);
    const [showMissionsPanel, setShowMissionsPanel] = useState(false);

    // Load performance from localStorage
    useEffect(() => {
        const savedPerformance = localStorage.getItem('practiceLabsPerformance');
        if (savedPerformance) {
            setPerformance(JSON.parse(savedPerformance));
        }

        // Load badges and missions
        loadBadgesAndMissions();
    }, []);

    // Save performance to localStorage
    useEffect(() => {
        localStorage.setItem('practiceLabsPerformance', JSON.stringify(performance));
    }, [performance]);

    // Update config when practice mode changes
    useEffect(() => {
        if (config.practiceMode === 'exam') {
            setConfig(prev => ({
                ...prev,
                enableHints: false,
                enableExplanations: false,
                timeLimit: 1800  // 30 minutes default
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                enableHints: true,
                enableExplanations: true,
                timeLimit: undefined
            }));
        }
    }, [config.practiceMode]);

    // Load badges and missions from API
    const loadBadgesAndMissions = async () => {
        try {
            const [badgesData, missionsData] = await Promise.all([
                apiService.getBadges(),
                apiService.getMissions()
            ]);

            setPerformance(prev => ({
                ...prev,
                badges: badgesData.badges || [],
                activeMissions: missionsData.dailyMissions || [],
                completedMissions: []
            }));
        } catch (error) {
            console.error('Error loading badges and missions:', error);
        }
    };

    const handleConfigChange = (updates: Partial<PracticeConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const handleStartPractice = async () => {
        if (isNonEnglishSubject(config.subject)) {
            alert(`AI Practice is currently limited for ${config.subject}. Please select an English-medium subject.`);
            return;
        }

        if (config.questionMode === 'diagnostic') {
            // Generate diagnostic test
            await generateDiagnosticTest();
        } else if (config.practiceMode === 'exam') {
            // Start exam mode
            await startExamMode();
        } else {
            // Generate single question
            await generateQuestion();
        }
    };

    const handlePracticeModeChange = (mode: PracticeMode) => {
        setConfig(prev => ({ ...prev, practiceMode: mode }));
    };

    const handleStudentFeedback = async (feedback: StudentFeedback) => {
        setShowFeedbackForm(false);

        // Use feedback to generate better hints
        if (currentQuestion) {
            try {
                const hints = await apiService.generateTwoLayerHints({
                    question: currentQuestion.question,
                    correctAnswer: currentQuestion.correctAnswer,
                    difficulty: currentQuestion.difficulty
                });

                setCurrentQuestion(prev => prev ? {
                    ...prev,
                    minimalHint: hints.minimalHint,
                    detailedHint: hints.detailedHint
                } : null);
            } catch (error) {
                console.error('Error generating hints:', error);
            }
        }
    };

    const startExamMode = async () => {
        // Start exam timer
        if (config.timeLimit) {
            setExamTimeRemaining(config.timeLimit);
        }

        // Generate first question
        await generateQuestion();
    };

    const handleExamTimeUp = () => {
        // Auto-submit exam
        if (examQuestions.length > 0) {
            generateExamReview();
        }
    };

    const generateExamReview = async () => {
        // Create exam review report
        const performanceByTopic: Record<string, { correct: number, total: number }> = {};

        examQuestions.forEach(q => {
            const topic = q.question.topic;
            if (!performanceByTopic[topic]) {
                performanceByTopic[topic] = { correct: 0, total: 0 };
            }
            performanceByTopic[topic].total++;
            if (q.isCorrect) {
                performanceByTopic[topic].correct++;
            }
        });

        const report: ExamReviewReportType = {
            totalQuestions: examQuestions.length,
            correctAnswers: examQuestions.filter(q => q.isCorrect).length,
            score: examQuestions.length > 0
                ? Math.round((examQuestions.filter(q => q.isCorrect).length / examQuestions.length) * 100)
                : 0,
            timeSpent: config.timeLimit ? config.timeLimit - (examTimeRemaining || 0) : 0,
            questionReviews: examQuestions,
            performanceByTopic,
            misconceptions: performance.misconceptionPatterns,
            recommendations: [
                'Review topics where you scored below 70%',
                'Practice more questions in weak areas',
                'Focus on understanding concepts, not just memorizing'
            ]
        };

        setExamReviewReport(report);
        setShowExamReview(true);
    };

    const generateQuestion = async () => {
        setIsGenerating(true);
        setFeedback(null);
        setUserAnswer('');
        setShowHint(false);

        // For Matric mode, ensure proper configuration
        const questionParams = {
            mode: config.questionMode,
            subject: config.subject,
            topic: config.topic,
            chapter: config.chapter,
            useChapterMode: config.useChapterMode,
            gradeLevel: config.questionMode === 'matric' ? 12 : config.gradeLevel,
            difficulty: config.adaptiveDifficulty ? performance.currentDifficulty : config.difficulty,
            useExamRAG: config.questionMode === 'matric' ? true : config.useExamRAG,
            useCurriculumRAG: config.useCurriculumRAG,
            stream: config.stream,
            examYear: config.examYear,
            practiceMode: config.practiceMode,
            region: config.region // Add region to params
        };

        try {

            const question = await apiService.generatePracticeQuestion(questionParams);

            setCurrentQuestion(question);

            // Update session data
            setSessionData(prev => ({
                ...prev,
                totalQuestions: prev.totalQuestions + 1,
                subjectsCovered: prev.subjectsCovered.includes(question.subject)
                    ? prev.subjectsCovered
                    : [...prev.subjectsCovered, question.subject],
                difficultyBreakdown: {
                    ...prev.difficultyBreakdown,
                    [question.difficulty]: (prev.difficultyBreakdown[question.difficulty as Difficulty] || 0) + 1
                }
            }));

            // Clear any previous warning
            setWarningMessage(null);

        } catch (error: any) {
            console.error('Error generating question:', error);

            // Extract error message from response
            let errorMessage = 'Failed to generate question. Please try again.';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // RAG Fallback Logic
            const isRAGError = errorMessage.includes("Vector Store") || errorMessage.includes("not found");
            const wasUsingRAG = questionParams.useExamRAG || questionParams.useCurriculumRAG;

            if (isRAGError && wasUsingRAG) {
                setWarningMessage("RAG content unavailable. Retrying with Standard AI mode...");

                try {
                    // Retry without RAG
                    const fallbackParams = {
                        ...questionParams,
                        useExamRAG: false,
                        useCurriculumRAG: false
                    };

                    const fallbackQuestion = await apiService.generatePracticeQuestion(fallbackParams);
                    setCurrentQuestion(fallbackQuestion);

                    setSessionData(prev => ({
                        ...prev,
                        totalQuestions: prev.totalQuestions + 1,
                        subjectsCovered: prev.subjectsCovered.includes(fallbackQuestion.subject)
                            ? prev.subjectsCovered
                            : [...prev.subjectsCovered, fallbackQuestion.subject],
                        difficultyBreakdown: {
                            ...prev.difficultyBreakdown,
                            [fallbackQuestion.difficulty]: (prev.difficultyBreakdown[fallbackQuestion.difficulty as Difficulty] || 0) + 1
                        }
                    }));

                    return; // Exit successfully after fallback
                } catch (retryError) {
                    console.error("Fallback generation failed:", retryError);
                    // Fall through to alert
                }
            }

            alert(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateDiagnosticTest = async () => {
        if (!config.subject) {
            alert('Please select a subject for the diagnostic test');
            return;
        }

        setIsGenerating(true);
        try {
            const test = await apiService.getDiagnosticTest(config.subject, config.gradeLevel);
            setDiagnosticTest(test);
            setShowDiagnosticTest(true);
        } catch (error) {
            console.error('Error generating diagnostic test:', error);
            alert('Failed to generate diagnostic test. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDiagnosticTestComplete = async (answers: Record<string, string>) => {
        if (!diagnosticTest) return;

        setIsEvaluating(true);
        try {
            const evaluation = await apiService.evaluateDiagnosticTest(
                config.subject,
                config.gradeLevel,
                diagnosticTest.questions,
                answers
            );
            setDiagnosticEvaluation(evaluation);
            setDiagnosticAnswers(answers);
            setShowDiagnosticTest(false);
            setShowDiagnosticResults(true);
        } catch (error) {
            console.error('Error evaluating diagnostic test:', error);
            alert('Failed to evaluate diagnostic test. Please try again.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleDiagnosticTestCancel = () => {
        setShowDiagnosticTest(false);
        setDiagnosticTest(null);
    };

    const handleDiagnosticRetry = () => {
        setShowDiagnosticResults(false);
        setDiagnosticTest(null);
        setDiagnosticEvaluation(null);
        setDiagnosticAnswers({});
        generateDiagnosticTest();
    };

    const handleDiagnosticContinuePractice = () => {
        setShowDiagnosticResults(false);
        setDiagnosticTest(null);
        setDiagnosticEvaluation(null);
        setDiagnosticAnswers({});
        // Switch to subject mode with suggested topics
        setConfig(prev => ({ ...prev, questionMode: 'subject' }));
    };

    const handleSubmitAnswer = async () => {
        if (!currentQuestion || !userAnswer.trim()) {
            alert('Please provide an answer');
            return;
        }

        setIsEvaluating(true);

        try {
            const result = await apiService.evaluatePracticeAnswerAdaptive({
                question: currentQuestion.question,
                answer: userAnswer,
                correctAnswer: currentQuestion.correctAnswer,
                questionType: currentQuestion.questionType,
                difficulty: currentQuestion.difficulty,
                coachPersonality: config.coachPersonality,
                studentPerformance: performance
            });

            setFeedback(result);

            // Update performance
            const newCorrectCount = result.isCorrect ? performance.correctCount + 1 : performance.correctCount;
            const newTotalCount = performance.totalCount + 1;
            const newStreak = result.isCorrect ? performance.streak + 1 : 0;
            const newTotalXP = performance.totalXP + (result.xpEarned || 0);
            const newLevel = Math.floor(newTotalXP / 100) + 1;

            // Update skills progress
            const newSkillsProgress = { ...performance.skillsProgress };
            if (result.skillsImproved) {
                result.skillsImproved.forEach((skill: string) => {
                    newSkillsProgress[skill] = Math.min(100, (newSkillsProgress[skill] || 0) + 10);
                });
            }

            // Determine next difficulty
            let nextDifficulty: Difficulty = performance.currentDifficulty;
            if (config.adaptiveDifficulty && result.difficultyAdjustment) {
                if (result.difficultyAdjustment === 'harder') {
                    nextDifficulty = currentQuestion.difficulty === 'easy' ? 'medium' : 'hard';
                } else if (result.difficultyAdjustment === 'easier') {
                    nextDifficulty = currentQuestion.difficulty === 'hard' ? 'medium' : 'easy';
                }
            }

            setPerformance(prev => ({
                ...prev,
                correctCount: newCorrectCount,
                totalCount: newTotalCount,
                averageScore: newTotalCount > 0 ? Math.round((newCorrectCount / newTotalCount) * 100) : 0,
                currentDifficulty: nextDifficulty,
                streak: newStreak,
                totalXP: newTotalXP,
                level: newLevel,
                skillsProgress: newSkillsProgress
            }));

            // Update session data
            setSessionData(prev => ({
                ...prev,
                correctAnswers: result.isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
                timeSpent: Math.floor((Date.now() - prev.startTime) / 60000)
            }));
        } catch (error) {
            console.error('Error evaluating answer:', error);
            alert('Failed to evaluate answer. Please try again.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNextQuestion = () => {
        setCurrentQuestion(null);
        setUserAnswer('');
        setFeedback(null);
        setShowHint(false);
        generateQuestion();
    };

    const handleNewSession = () => {
        // Show session reflection if there were questions answered
        if (sessionData.totalQuestions > 0) {
            generateSessionReflection();
        } else {
            resetSession();
        }
    };

    const generateSessionReflection = async () => {
        try {
            const reflection = await apiService.getSessionReflection(sessionData);
            setSessionReflection(reflection);
            setShowReflection(true);
        } catch (error) {
            console.error('Error generating session reflection:', error);
            resetSession();
        }
    };

    const resetSession = () => {
        setCurrentQuestion(null);
        setUserAnswer('');
        setFeedback(null);
        setShowHint(false);
        setSessionData({
            totalQuestions: 0,
            correctAnswers: 0,
            subjectsCovered: [],
            difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
            timeSpent: 0,
            startTime: Date.now()
        });
        setShowReflection(false);
        setSessionReflection(null);
    };

    const handleCloseReflection = () => {
        setShowReflection(false);
        resetSession();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                        <BeakerIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            Practice Labs
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            AI-Powered Adaptive Coaching & Assessment
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowBadgesPanel(!showBadgesPanel)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <span>🏆</span> Badges
                    </button>
                    <button
                        onClick={() => setShowMissionsPanel(!showMissionsPanel)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <span>🎯</span> Missions
                    </button>
                </div>
            </div>

            {/* Practice Mode Selector */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-2 border border-white/20 dark:border-gray-700/50 shadow-sm">
                <PracticeModeSelector
                    selectedMode={config.practiceMode}
                    onModeChange={handlePracticeModeChange}
                />
            </div>

            {/* Performance Tracker */}
            <PerformanceTracker performance={performance} />

            {/* Exam Mode Timer */}
            {config.practiceMode === 'exam' && examTimeRemaining !== null && (
                <ExamModeTimer
                    timeLimit={config.timeLimit || 1800}
                    onTimeUp={handleExamTimeUp}
                    isPaused={false}
                />
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1">
                    <ConfigPanel
                        config={config}
                        onConfigChange={handleConfigChange}
                        onStartPractice={handleStartPractice}
                        isGenerating={isGenerating}
                        regions={regions}
                        gradeLevels={gradeLevels}
                        streams={streams}
                        getSubjectsFor={getSubjectsFor}
                    />
                </div>

                {/* Question/Feedback Display */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    {/* Diagnostic Test Display */}
                    {showDiagnosticTest && diagnosticTest && (
                        <DiagnosticTestDisplay
                            test={diagnosticTest}
                            onComplete={handleDiagnosticTestComplete}
                            onCancel={handleDiagnosticTestCancel}
                        />
                    )}

                    {/* Diagnostic Test Results */}
                    {showDiagnosticResults && diagnosticTest && diagnosticEvaluation && (
                        <DiagnosticTestResults
                            test={diagnosticTest}
                            answers={diagnosticAnswers}
                            evaluation={diagnosticEvaluation}
                            onRetry={handleDiagnosticRetry}
                            onContinuePractice={handleDiagnosticContinuePractice}
                        />
                    )}

                    {/* Regular Practice Display - Champion's Arena Masterpiece Double Layout */}
                    {!showDiagnosticTest && !showDiagnosticResults && !currentQuestion && !isGenerating && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <PracticeArena
                                config={config}
                                className="h-full"
                                variant="primary"
                            />
                            <PracticeArena
                                config={config}
                                className="h-full"
                                variant="secondary"
                            />
                        </div>
                    )}

                    {!showDiagnosticTest && !showDiagnosticResults && !currentQuestion && !isGenerating && isNonEnglishSubject(config.subject) && (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                            <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Experimental Support</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                AI practice generation for <strong>{config.subject}</strong> is currently limited.
                                Please select an English-medium subject for the best experience.
                            </p>
                        </div>
                    )}

                    {warningMessage && (
                        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Notice</h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    {warningMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => setWarningMessage(null)}
                                className="ml-auto text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
                            >×</button>
                        </div>
                    )}

                    {isGenerating && (
                        <Card title="">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Generating Your Question...
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {config.useExamRAG || config.useCurriculumRAG
                                        ? 'Searching through curriculum and exam archives...'
                                        : 'Creating a personalized question for you...'}
                                </p>
                            </div>
                        </Card>
                    )}

                    {currentQuestion && !feedback && (
                        <>
                            <QuestionDisplay
                                question={currentQuestion}
                                userAnswer={userAnswer}
                                onAnswerChange={setUserAnswer}
                                onSubmit={handleSubmitAnswer}
                                isLoading={isEvaluating}
                                showHint={showHint}
                                onToggleHint={() => setShowHint(!showHint)}
                            />

                            {/* Two-Layer Hint System */}
                            {config.enableHints && (
                                <div className="mt-4">
                                    <TwoLayerHintSystem
                                        minimalHint={currentQuestion.minimalHint}
                                        detailedHint={currentQuestion.detailedHint}
                                        hints={currentQuestion.hints}
                                        disabled={!config.enableHints}
                                    />
                                </div>
                            )}

                            {/* Student Feedback Button */}
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    🤔 Need Help? Tell us what you're struggling with
                                </button>
                            </div>
                        </>
                    )}

                    {feedback && (
                        <FeedbackDisplay
                            feedback={feedback}
                            onNextQuestion={handleNextQuestion}
                            onNewSession={handleNewSession}
                        />
                    )}
                </div>
            </div>

            {/* Session Reflection Modal */}
            {showReflection && sessionReflection && (
                <SessionReflection
                    reflection={sessionReflection}
                    onClose={handleCloseReflection}
                />
            )}

            {/* Exam Review Report Modal */}
            {showExamReview && examReviewReport && (
                <ExamReviewReport
                    report={examReviewReport}
                    onClose={() => {
                        setShowExamReview(false);
                        setExamReviewReport(null);
                        setExamQuestions([]);
                        resetSession();
                    }}
                />
            )}

            {/* Student Feedback Form Modal */}
            {showFeedbackForm && currentQuestion && (
                <StudentFeedbackForm
                    questionId={currentQuestion.id}
                    onSubmitFeedback={handleStudentFeedback}
                    onClose={() => setShowFeedbackForm(false)}
                />
            )}

            {/* Badges Panel Modal */}
            {showBadgesPanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Your Badges</h3>
                            <button
                                onClick={() => setShowBadgesPanel(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <BadgesDisplay badges={performance.badges} />
                    </div>
                </div>
            )}

            {/* Missions Panel Modal */}
            {showMissionsPanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Your Missions</h3>
                            <button
                                onClick={() => setShowMissionsPanel(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <MissionsPanel
                            activeMissions={performance.activeMissions}
                            completedMissions={performance.completedMissions}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PracticeLabs;

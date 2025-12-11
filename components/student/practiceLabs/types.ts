// Practice Labs Type Definitions

// Practice Modes based on research document
export type PracticeMode = 'standard' | 'exam' | 'game';  // Gym Floor, Assessment Booth, Level-Up Chamber
export type QuestionMode = 'subject' | 'random' | 'diagnostic' | 'matric' | 'model';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CoachPersonality = 'patient' | 'energetic' | 'analyst';
export type SessionPhase = 'warmup' | 'practice' | 'cooldown' | 'reflection';
export type HintLayer = 'minimal' | 'detailed';  // Two-layer hint system

export interface PracticeQuestion {
    id: string;
    question: string;
    passage?: string | null;  // Referenced text for comprehension questions
    questionType: QuestionType;
    options?: string[];
    correctAnswer: string;
    subject: string;
    topic: string;
    gradeLevel: number;
    difficulty: Difficulty;
    explanation?: string;
    hints?: string[];  // Two-layer: [minimal_hint, detailed_hint]
    minimalHint?: string;  // Layer 1: One-line hint
    detailedHint?: string;  // Layer 2: Step-by-step breakdown
    ragStatus?: 'success' | 'fallback' | 'disabled';
    ragMessage?: string;
    curriculumSources?: (string | { type: string; exam_type?: string;[key: string]: any })[];
    zpdComplexityScore?: number;  // 0.0-1.0 for ZPD calibration
    cognitiveLevel?: 'recall' | 'understanding' | 'application' | 'analysis' | 'synthesis' | 'evaluation';  // Bloom's taxonomy
    timeLimit?: number;  // For exam mode (in seconds)
}

export interface AdaptiveFeedback {
    isCorrect: boolean;
    score: number;
    feedback: string;
    explanation?: string;
    stepByStepSolution?: string[];  // Detailed breakdown for learning
    hints?: string[];
    nextSteps?: string;
    motivationalMessage?: string;
    difficultyAdjustment?: 'easier' | 'same' | 'harder';
    zpdRecommendation?: number;  // Recommended ZPD complexity for next question
    xpEarned?: number;
    skillsImproved?: string[];
    misconceptionsDetected?: string[];  // Pattern analysis from research doc
    scaffoldingSuggestions?: string[];  // Real-time personalized scaffolding
    partialCreditReason?: string;  // Explanation for partial credit
}

export interface StudentPerformance {
    correctCount: number;
    totalCount: number;
    averageScore: number;
    currentDifficulty: Difficulty;
    currentZPDScore: number;  // 0.0-1.0 complexity score
    masteryProfile: Record<string, number>;  // Topic -> mastery % (0-100)
    streak: number;
    totalXP: number;
    level: number;
    skillsProgress: Record<string, number>;
    badges: Badge[];
    activeMissions: Mission[];
    completedMissions: Mission[];
    misconceptionPatterns: MisconceptionPattern[];
}

export interface SessionData {
    totalQuestions: number;
    correctAnswers: number;
    subjectsCovered: string[];
    difficultyBreakdown: Record<Difficulty, number>;
    timeSpent: number;
    startTime: number;
}

export interface SessionReflection {
    overallPerformance: string;
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    patterns: string[];
    recommendations: string[];
    nextSessionFocus: string;
    motivationalMessage: string;
    xpEarned: number;
    achievementsUnlocked: string[];
    badgesEarned: Badge[];
    missionsCompleted: Mission[];
    studyTips: string[];
    misconceptionReport?: MisconceptionReport;  // Detailed analysis
    masteryGains: Record<string, number>;  // Topic -> % improvement
    zpdProgression: number;  // How ZPD score changed
}

export interface DiagnosticTest {
    testTitle: string;
    instructions: string;
    questions: PracticeQuestion[];
    estimatedTime: string;
}

export interface PracticeConfig {
    practiceMode: PracticeMode;
    questionMode: QuestionMode;
    subject: string;
    topic: string;
    region?: string; // New: Region for curriculum alignment
    chapter?: string;  // New: Chapter/Unit/Lesson input
    useChapterMode?: boolean;  // New: Flag for chapter-based generation
    gradeLevel: number;
    difficulty: Difficulty;
    useExamRAG: boolean;
    useCurriculumRAG: boolean;
    stream?: string;
    examYear?: string;
    coachPersonality: CoachPersonality;
    adaptiveDifficulty: boolean;
    enableHints?: boolean;
    enableExplanations?: boolean;
    timeLimit?: number;
    targetZPDScore?: number;
}

// Gamification: Badges System
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;  // Emoji or icon name
    category: 'achievement' | 'streak' | 'mastery' | 'resilience' | 'speed';
    requirement: string;
    earnedAt?: Date;
    progress?: number;  // 0-100 for progress towards badge
}

// Gamification: Missions System
export interface Mission {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'challenge' | 'special';
    target: number;  // e.g., "Complete 10 questions"
    current: number;  // Current progress
    reward: {
        xp: number;
        badge?: string;
    };
    expiresAt?: Date;
    completedAt?: Date;
}

// Misconception Pattern Detection
export interface MisconceptionPattern {
    topic: string;
    misconceptionType: string;  // e.g., "Algebraic manipulation", "Sign errors"
    frequency: number;  // How many times detected
    lastOccurrence: Date;
    examples: string[];  // Example questions where it occurred
    remediation: string;  // Suggested remediation strategy
}

// Detailed Misconception Report (for session reflection)
export interface MisconceptionReport {
    totalMisconceptions: number;
    patterns: MisconceptionPattern[];
    criticalAreas: string[];  // Topics needing immediate attention
    improvementSuggestions: string[];
}

// Exam Mode: Review Report
export interface ExamReviewReport {
    totalQuestions: number;
    correctAnswers: number;
    score: number;  // Percentage
    timeSpent: number;  // In seconds
    questionReviews: QuestionReview[];
    performanceByTopic: Record<string, { correct: number, total: number }>;
    misconceptions: MisconceptionPattern[];
    recommendations: string[];
}

export interface QuestionReview {
    question: PracticeQuestion;
    studentAnswer: string;
    isCorrect: boolean;
    score: number;
    explanation: string;
    misconceptionsDetected?: string[];
}

// Student Feedback for Scaffolding
export interface StudentFeedback {
    questionId: string;
    struggleReason: 'formula' | 'concept' | 'calculation' | 'reading' | 'time' | 'other';
    specificIssue: string;  // Free text explanation
    requestedHelp: 'hint' | 'explanation' | 'example' | 'simplification';
}

export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';

export interface AuthenticatedUser {
    id: number;
    name: string; // From backend 'username' field
    username: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    role: UserRole;
    gradeLevel?: string;
    avatarUrl?: string;
    region?: string;
    cv?: string;
    account_status?: 'Incomplete' | 'Pending Review' | 'Active' | 'Rejected' | 'Suspended';
    student_identification_number?: string;
    profile_completion_percentage?: number;
    date_joined?: string;
    mobile_number?: string;
    stream?: 'Natural' | 'Social';
    gender?: 'Male' | 'Female' | 'Other';
    age?: number;
    use_rag_ai?: boolean;
}

// --- Virtual Classroom Types ---

export enum LessonStepType {
    LECTURE = 'lecture',
    IMAGE = 'image',
    QUIZ = 'quiz',
    ACTIVITY = 'activity'
}

export type BehaviorEventType = 'positive' | 'neutral' | 'distracted';

export interface BehavioralEvent {
    type: BehaviorEventType;
    description: string;
    timestamp: number;
    icon: string;
}

export interface QuizOption {
    option: string;
    isCorrect: boolean;
}

export interface LessonStep {
    title: string;
    type: LessonStepType;
    content: string; // For LECTURE, prompt for IMAGE, question for QUIZ, instructions for ACTIVITY
    duration: number; // in minutes
    quizOptions?: QuizOption[];
}

// VC Chat Message
export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    imageUrl?: string;
    suggestion?: {
        label: string;
        action: 'regenerate';
    };
}

export interface LessonResult {
    id: string;
    topic: string;
    subject: string;
    grade: string;
    score: number;
    correctAnswers: number;
    totalQuizzes: number;
    completedAt: string;
    lessonPlan: LessonPlan;
    xpEarned: number;
}

export interface UserStats {
    xp: number;
    level: number;
    streak: number;
    lastLessonDate: string | null;
}

export enum ImageGenerationMode {
    GOOGLE_AI_BILLING = 'google-ai-billing',
    TEXT_ONLY = 'text-only',
    ALTERNATIVE_APIS = 'alternative-apis'
}

export interface ImageGenerationConfig {
    mode: ImageGenerationMode;
    enabled: boolean;
}

export const IMAGE_GENERATION_MODES = {
    [ImageGenerationMode.GOOGLE_AI_BILLING]: {
        label: 'Google AI',
        description: 'Use Google AI Imagen (requires billing)',
        shortLabel: 'Google AI'
    },
    [ImageGenerationMode.TEXT_ONLY]: {
        label: 'Text Only',
        description: 'Text-based lessons without image generation',
        shortLabel: 'Text Only'
    },
    [ImageGenerationMode.ALTERNATIVE_APIS]: {
        label: 'Free Images',
        description: 'Use placeholder images and free APIs',
        shortLabel: 'Free APIs'
    }
} as const;

// --- End Virtual Classroom Types ---

export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    grade_level?: string;
    is_active: boolean;
    last_login: string | null;
    parent: number | null; // ID of the parent user
    grade: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    region?: string;
    cv?: string;
    account_status?: 'Incomplete' | 'Pending Review' | 'Active' | 'Rejected' | 'Suspended';
    student_identification_number?: string;
    profile_completion_percentage?: number;
    date_joined?: string;
    mobile_number?: string;
    stream?: 'Natural' | 'Social';
    gender?: 'Male' | 'Female' | 'Other';
    age?: number;
}

export type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'Unknown';
export type AlertStatus = 'New' | 'In Progress' | 'Reviewed' | 'Resolved' | 'Dismissed';
export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertCategory = 'Engagement' | 'Academic' | 'Behavioral' | 'Emotional' | 'Attendance' | 'Other';

export interface SmartAlert {
    id: number;
    student: User;
    message_content: string;
    sentiment: Sentiment;
    status: AlertStatus;
    priority: AlertPriority;
    category: AlertCategory;

    // AI Analysis Results
    severity?: string;
    analysis?: string;
    recommended_actions?: string[];
    requires_immediate_attention: boolean;
    suggested_response?: string;

    // Action Tracking
    assigned_to?: User;
    assigned_to_id?: number;
    action_taken?: string;
    resolution_notes?: string;

    // Metadata
    source: string;
    context_data?: Record<string, any>;

    created_at: string;
    updated_at: string;
    resolved_at?: string;

    // UI-only state
    isAnalyzing?: boolean;
}


export interface RubricCriterion {
    criterion: string;
    score: number;
    feedback: string;
}

export interface GradedSubmission {
    overallScore: number;
    overallFeedback: string;

    criteriaFeedback: RubricCriterion[];
}

export interface LessonActivity {
    duration: number;
    description: string;
}

// 5E Instructional Model Phases
export interface FiveEPhase {
    phase: 'Engage' | 'Explore' | 'Explain' | 'Elaborate' | 'Evaluate';
    duration: number; // in minutes
    activities: string[];
    teacherActions: string[];
    studentActions: string[];
    materials?: string[];
}

// Differentiation Strategy
export interface DifferentiationStrategy {
    level: 'Below Grade Level' | 'At Grade Level' | 'Above Grade Level' | 'Special Needs';
    contentAdaptations?: string[];
    processAdaptations?: string[];
    productAdaptations?: string[];
    environmentAdaptations?: string[];
}

// Assessment Plan (UbD Stage 2)
export interface AssessmentPlan {
    formativeChecks: string[]; // 3+ formative assessment points
    summativeTask: string;
    successCriteria: string[];
    rubric?: string;
}

// Resource Constraint Profile
export interface ResourceConstraints {
    availableMaterials: string[]; // e.g., "chalk", "textbook", "local objects"
    internetAccess: boolean;
    electricityAccess: boolean;
    fieldTripAvailable: boolean;
    budgetLimit?: string;
    classSize?: number;
}

// Student Readiness Profile
export interface StudentReadiness {
    averagePriorKnowledge: 'High' | 'Medium' | 'Low';
    commonMisconceptions?: string[];
    specialNeedsGroups?: string[];
}

// Local Context
export interface LocalContext {
    region: 'Urban' | 'Rural' | 'Semi-Urban';
    dominantEconomy?: string; // e.g., "Agriculture", "Trade", "Pastoralism"
    culturalConsiderations?: string[];
}

// Saved Lesson Plan (from database)
export interface SavedLessonPlan extends LessonPlan {
    id: number;
    created_by: {
        id: number;
        username: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
    is_public: boolean;
    shared_with?: User[];
    times_used: number;
    rating: number;
    rating_count: number;
    tags?: string[];
}

// Enhanced Lesson Plan following UbD-5E-Differentiated Framework
export interface LessonPlan {
    // I. Administrative Context
    title: string;
    grade: string;
    stream?: string;
    subject: string;
    topic: string;
    duration: number; // in minutes
    date?: string;
    moeStandardId?: string; // Ethiopian MoE Curriculum Standard ID

    // II. Learning Outcomes & Goals (UbD Stage 1)
    objectives: string[]; // 2-3 measurable, high-order objectives
    essentialQuestions?: string[]; // Big ideas that drive understanding
    enduring_understandings?: string[]; // Transferable knowledge
    moeCompetencies?: string[]; // Aligned MoE competencies

    // III. Assessment Plan (UbD Stage 2)
    assessmentPlan?: AssessmentPlan;
    assessment?: string; // Legacy field for backward compatibility

    // IV. Teacher Preparation & Resources
    materials: string[]; // Low-cost/substituted materials list
    resourceConstraints?: ResourceConstraints;
    teacherPreparation?: string[];

    // V. Instructional Sequence (5E Model)
    fiveESequence?: FiveEPhase[]; // Structured 5E phases
    activities: LessonActivity[]; // Legacy field for backward compatibility

    // VI. Differentiation/Remediation
    differentiationStrategies?: DifferentiationStrategy[];

    // VII. Reflection & Feedback
    reflectionPrompts?: string[];
    teacherNotes?: string;

    // Additional fields
    homework?: string;
    extensions?: string[]; // For advanced learners

    // Context metadata
    studentReadiness?: StudentReadiness;
    localContext?: LocalContext;

    // Virtual Classroom support
    steps?: LessonStep[];

    // Fallback fields
    content?: string;  // Fallback field when JSON parsing fails
    metadata?: any;    // Fallback field when JSON parsing fails

    // RAG metadata
    rag_enabled?: boolean;  // Indicates if RAG was used
    curriculum_sources?: string[];  // List of curriculum document sources used
    rag_status?: 'success' | 'fallback' | 'disabled';  // RAG processing status
    rag_message?: string;  // Error or info message about RAG processing
}

export interface HighlightedSection {
    text: string;
    reason: string;
}

export interface AuthenticityResult {
    originality_score: number;
    ai_likelihood: string;
    flagged_sections: HighlightedSection[];
    confidence_score?: number;
    analysis_summary?: string;
}

// Types for Student Insights
export enum EngagementLevel {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
    AT_RISK = 'At Risk'
}
export type Expression = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'unknown';

export interface StudentProgress {
    id: number;
    name: string;
    // These will be calculated or fetched separately in a real app
    // For now, we'll mock them on the frontend after fetching the student list.
    overallProgress: number;
    recentScore: number;
    engagement: EngagementLevel;
    liveEngagement?: {
        expression: Expression;
    }
}

export interface AIInsight {
    summary: string;
    strengths?: (string | { strategy: string; details: string })[];
    areasForImprovement?: (string | { strategy: string; details: string })[];
    interventionSuggestions: (string | { strategy: string; details: string })[];
    recommendedResources?: (string | { title: string; description: string })[];
}


// Types for Rubric Generator (Enhanced based on research)
export type RubricType = 'analytic' | 'holistic' | 'single_point' | 'checklist';

export interface PerformanceLevel {
    level: string; // e.g., "Exemplary", "Proficient"
    points: number;
    description: string;
}

export interface RubricCriterionDetail {
    criterion: string;
    description?: string;
    weight?: number; // Percentage weight if weighting enabled
    performanceLevels: PerformanceLevel[];
}

export interface GeneratedRubric {
    title: string;
    rubric_type?: RubricType;
    grade_level?: string;
    subject?: string;
    criteria: RubricCriterionDetail[];
    total_points?: number;
    weighting_enabled?: boolean;
    multimodal_assessment?: boolean;
    performance_levels?: string[];
    alignment_validated?: boolean;
    alignment_score?: number;
    moe_standard_id?: string;
    learning_objectives?: string[];
}

export interface SavedRubric {
    id: number;
    created_by: {
        id: number;
        username: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
    title: string;
    topic: string;
    grade_level: string;
    subject?: string;
    rubric_type: RubricType;
    moe_standard_id?: string;
    learning_objectives?: string[];
    criteria: RubricCriterionDetail[];
    total_points: number;
    weighting_enabled: boolean;
    multimodal_assessment: boolean;
    alignment_validated: boolean;
    alignment_score: number;
    performance_levels: string[];
    tone_preference: string;
    is_public: boolean;
    times_used: number;
    tags?: string[];
    teacher_notes?: string;
}

export interface RubricGenerationParams {
    topic: string;
    grade_level: string;
    subject?: string;
    rubric_type?: RubricType;
    document_type?: string;
    learning_objectives?: string[];
    moe_standard_id?: string;
    performance_levels?: string[];
    weighting_enabled?: boolean;
    multimodal_assessment?: boolean;
    tone_preference?: string;
    num_criteria?: number;
    // RAG enhancement parameters
    use_vector_store?: boolean;
    chapter_input?: string;
    chapter_number?: number;
    chapter_range_start?: number;
    chapter_range_end?: number;
}

// Types for Student Dashboard
export interface StudentDashboardChatMessage {
    role: 'user' | 'model';
    content: string;
    imageUrl?: string;
}

export interface GradeItem {
    id: number;
    title: string;
    score: number | null;
    max_score: number;
    type: 'Assignment' | 'Quiz' | 'Exam';
}

export interface Unit {
    id: string; // Synthesized on frontend
    title: string;
    unit_grade: number;
    items: GradeItem[];
}

export interface Course {
    id: string; // Synthesized on frontend
    title: string;
    teacher_name: string;
    overall_grade: number;
    units: Unit[];
}

export interface PracticeQuestion {
    id: number;
    subject: string;
    topic: string;
    question: string;
    correctAnswer?: string;
}

export interface PracticeFeedback {
    isCorrect: boolean;
    score?: number;
    feedback: string;
    explanation?: string;
    hints?: string[];
    nextSteps?: string;
}

// Types for Parent Dashboard
export interface ChildSummary {
    id: number;
    name: string;
    grade: string;
    overall_progress: number;
    upcoming_assignments: Assignment[]; // Now holds real assignment data
    recent_alerts_count: number;
    progressTrend: ProgressTrend[]; // Added for real-time trend chart
}

export interface ProgressTrend {
    month: string;
    averageScore: number;
}


// FIX: Added Attachment type to be used in communication components.
export interface Attachment {
    url: string;
    type: string;
    name: string;
}

// Types for Communication
export interface Conversation {
    id: number;
    participants: User[];
    last_message: Message | null;
    created_at: string;
    updated_at?: string;
    // Frontend-only state for display purposes
    conversation_title?: string;
    unread_count?: number;
}

export interface Message {
    id: number;
    conversation: number;
    sender: User;
    content: string;
    attachment: string | null; // URL to the attachment
    created_at: string;
    // Frontend-only status
    status?: 'sent' | 'delivered' | 'read';
}


// Types for RAG Pipeline
export interface VectorStore {
    id: number;
    file_name: string;
    file?: string;
    grade: string;
    stream: 'Natural Science' | 'Social Science' | 'N/A';
    subject: string;
    region?: string;
    status: 'Active' | 'Processing' | 'Failed';
    vector_store_path?: string;
    chunk_count?: number;
    created_at: string;
    updated_at?: string;
    isDeleting?: boolean; // UI-only state
}

export interface ExamVectorStore {
    id: number;
    exam_type: 'Matric' | 'Model';
    file_name: string;
    file?: string;
    subject: string;
    exam_year?: string;
    stream: 'Natural Science' | 'Social Science' | 'N/A';
    chapter?: string;
    region?: string;
    status: 'Active' | 'Processing' | 'Failed';
    vector_store_path?: string;
    chunk_count?: number;
    created_at: string;
    updated_at?: string;
    isDeleting?: boolean; // UI-only state
}

// Types for Engagement Monitor
export type EngagementState = Record<string, { expression: Expression, lastSeen: number }>;

export interface EngagementContextType {
    engagementState: EngagementState;
    updateStudentEngagement: (studentId: string, expression: Expression) => void;
}

// Types for Academic Core
export interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    completed: boolean;
    course_id?: number;
    subject?: string; // Added subject field
    course?: string; // Optional field for Gradebook
    rubric?: string; // Grading rubric
}

export interface Submission {
    id: number;
    student: User;
    assignment: Assignment;
    submitted_text: string;
    submitted_at: string;
    grade: number | null;
    feedback: string;
    authenticity_score: number | null;
    ai_likelihood: string | null;
}

// Types for Analytics
export interface EngagementTrendPoint {
    date: string;
    active_users: number;
}

export interface LearningOutcomePoint {
    subject: string;
    average_score: number;
}

// Saved Lesson (Generated Script)
export interface SavedLesson {
    id: number;
    created_by: {
        id: number;
        username: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
    title: string;
    grade: string;
    subject: string;
    topic: string;
    content: string;
    rag_enabled: boolean;
    curriculum_sources?: string[];
    is_public: boolean;
    lesson_plan?: number;
}

export interface SavedQuiz {
    id: number;
    title: string;
    description: string;
    quiz_type: string;
    subject: string;
    grade_level: number;
    stream?: string;
    chapter?: string;
    topic?: string;
    duration_minutes: number;
    is_published: boolean;
    allow_retake: boolean;
    show_results_immediately: boolean;
    difficulty: string;
    use_rag: boolean;
    created_at: string;
    questions?: any[];
    teacher_name?: string;
}

// Shared File Notification Types
export interface SharedFileNotification {
    id: number;
    shared_file: {
        id: number;
        title: string;
        content_type: 'lesson_plan' | 'rubric' | 'lesson';
        lesson_plan?: SavedLessonPlan;
        rubric?: SavedRubric;
        lesson?: SavedLesson;
        shared_by: User;
        message?: string;
        created_at: string;
    };
    recipient: User;
    is_read: boolean;
    is_downloaded: boolean;
    created_at: string;
    read_at?: string;
}

// Student Assignment Types
export type DocumentType = 'essay' | 'research_paper' | 'lab_report' | 'presentation' | 'project' | 'homework' | 'quiz' | 'exam' | 'other';

export interface StudentAssignment {
    id: number;
    student: User;
    teacher: User;
    assignment_topic: string;
    document_type: DocumentType;
    file: string;
    description: string;
    grade_level: string;
    subject: string;
    is_graded: boolean;
    grade?: number;
    feedback: string;
    submitted_at: string;
    graded_at?: string;
}

export interface StudentAssignmentCreate {
    teacher_id: number;
    assignment_topic: string;
    document_type: DocumentType;
    file: File;
    description?: string;
    grade_level?: string;
    subject?: string;
}

// AI Classroom Types
export type LessonPhase = 'engage' | 'explore' | 'explain' | 'elaborate' | 'evaluate';

export interface AIClassroomChatMessage {
    id: string;
    role: 'student' | 'ai-teacher';
    content: string;
    timestamp: string;
    type?: 'text' | 'instruction' | 'question' | 'feedback';
}

export interface AIClassroomWhiteboardElement {
    id: string;
    type: 'text' | 'drawing' | 'shape' | 'image';
    content: string;
    position: { x: number; y: number };
    color?: string;
    size?: number;
}

export interface AIClassroomLesson {
    id?: string;
    title: string;
    subject: string;
    gradeLevel: string;
    objectives: string[];
    materials: string[];
    duration: number;
    content: string;
    activities: string[];
    assessmentPlan: string;
    fiveESequence?: LessonPhaseSequence[];
    differentiationStrategies?: any[];
    resourceConstraints?: any;
    studentReadiness?: any;
    localContext?: any;
    createdAt?: string;
    teacherNotes?: string;
}

export interface LessonPhaseSequence {
    phase: LessonPhase;
    duration: number;
    activities: string[];
    teacherActions: string[];
    studentActions: string[];
    materials?: string[];
}

export type ExpressionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'disgusted' | 'fearful' | 'unknown';

export interface StudentExpression {
    expression: ExpressionType;
    confidence: number;
    timestamp: number;
}

export interface MasterCourse {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    stream?: string;
    region?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserDocument {
    id: number;
    user: number;
    file: string;
    document_type: 'CV' | 'ID' | 'Transcript' | 'Certification' | 'Other';
    uploaded_at: string;
    description?: string;
}
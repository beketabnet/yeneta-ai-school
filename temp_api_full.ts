import axios from 'axios';
// FIX: Imported GeneratedRubric to resolve type error.
import { AIInsight, AuthenticatedUser, ChildSummary, LessonPlan, SavedLessonPlan, StudentProgress, User, UserRole, VectorStore, ExamVectorStore, Assignment, Submission, GradedSubmission, AuthenticityResult, Course, PracticeQuestion, PracticeFeedback, Conversation, Message, EngagementTrendPoint, LearningOutcomePoint, GeneratedRubric, SmartAlert, SavedRubric, RubricGenerationParams } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// A utility to extract a more user-friendly error message from Axios errors
const getErrorMessage = (error: any): string => {
    if (error.response && error.response.data) {
        // DRF validation errors can be complex objects. Let's try to flatten them.
        const data = error.response.data;
        if (typeof data === 'string') return data;
        if (typeof data.detail === 'string') return data.detail;
        if (typeof data === 'object') {
            return Object.entries(data)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join(' ');
        }
    }
    return error.message || 'An unexpected error occurred.';
};

interface TokenResponse {
    access: string;
    refresh: string;
}

interface LoginData {
    email: string;
    username: string;
}

const login = async (email: string, password: string): Promise<LoginData> => {
    try {
        const response = await api.post<TokenResponse>('/users/token/', { email, password });
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        const userResponse = await getCurrentUser();
        return { email: userResponse.email, username: userResponse.name };
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const signup = async (userData: { email: string, username: string, password: string, role: UserRole, gradeLevel?: string }): Promise<AuthenticatedUser> => {
     try {
        const response = await api.post('/users/register/', userData);
        // After successful registration, log the user in
        await login(userData.email, userData.password);
        return await getCurrentUser();
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

const getCurrentUser = async (): Promise<AuthenticatedUser> => {
    try {
        const { data } = await api.get('/users/me/');
        // Adapt backend response to frontend expectation
        return { ...data, name: data.username, gradeLevel: data.grade_level };
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateProfile = async (profileData: Partial<{ username: string }>): Promise<User> => {
    try {
        const { data } = await api.patch<User>('/users/me/', profileData);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// User Management
const getUsers = async (): Promise<User[]> => {
    try {
        const { data } = await api.get<User[]>('/users/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

// For Teacher Dashboard
const getStudents = async (): Promise<User[]> => {
    try {
        const { data } = await api.get<User[]>('/users/students/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// For Parent Dashboard
const getMyChildren = async (): Promise<ChildSummary[]> => {
    try {
        const { data } = await api.get<ChildSummary[]>('/users/my-children/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getUnlinkedStudents = async (): Promise<User[]> => {
    try {
        const { data } = await api.get<User[]>('/users/unlinked-students/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const linkChild = async (childId: number): Promise<void> => {
    try {
        await api.post('/users/link-child/', { child_id: childId });
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getStudentFamilies = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/users/student-families/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const searchFamilies = async (query: string): Promise<any[]> => {
    try {
        const { data } = await api.get('/users/search-families/', { params: { q: query } });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getParentLinkedStudents = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/academics/parent-linked-students/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getParentChildGrades = async (studentId: number): Promise<Course[]> => {
    try {
        const { data } = await api.get(`/academics/parent-child-grades/?student_id=${studentId}`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateUserRole = async (userId: number, role: UserRole): Promise<User> => {
    try {
        const { data } = await api.patch<User>(`/users/${userId}/`, { role });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

// RAG Pipeline
const getVectorStores = async (): Promise<VectorStore[]> => {
    try {
        const { data } = await api.get<VectorStore[]>('/rag/vector-stores/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const createVectorStore = async (formData: FormData): Promise<VectorStore> => {
    try {
        const { data } = await api.post<VectorStore>('/rag/vector-stores/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteVectorStore = async (id: number): Promise<void> => {
    try {
        await api.delete(`/rag/vector-stores/${id}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getCurriculumConfig = async (): Promise<any> => {
    try {
        const { data } = await api.get('/rag/curriculum-config/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSubjectsForGrade = async (params: { grade: string; stream?: string }): Promise<any> => {
    try {
        const { data } = await api.get('/rag/curriculum-config/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Exam Vector Stores
const getExamVectorStores = async (params?: { exam_type?: string; subject?: string; exam_year?: string; stream?: string }): Promise<ExamVectorStore[]> => {
    try {
        const { data } = await api.get<ExamVectorStore[]>('/rag/exam-vector-stores/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const createExamVectorStore = async (formData: FormData): Promise<ExamVectorStore> => {
    try {
        const { data } = await api.post<ExamVectorStore>('/rag/exam-vector-stores/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteExamVectorStore = async (id: number): Promise<void> => {
    try {
        await api.delete(`/rag/exam-vector-stores/${id}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Academic Core
const getAssignments = async (documentType?: string): Promise<Assignment[]> => {
    try {
        const params = documentType ? { document_type: documentType } : {};
        const { data } = await api.get('/academics/assignments/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSubmissions = async (assignmentId: number): Promise<Submission[]> => {
    try {
        const { data } = await api.get(`/academics/assignments/${assignmentId}/submissions/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const createSubmission = async (submissionData: { assignment: number, submitted_text: string }): Promise<Submission> => {
    try {
        const { data } = await api.post('/academics/submissions/', submissionData);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateSubmission = async (submissionId: number, submissionData: { submitted_text: string }): Promise<Submission> => {
    try {
        const { data } = await api.patch(`/academics/submissions/${submissionId}/`, submissionData);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getMyGrades = async (): Promise<Course[]> => {
    try {
        const { data } = await api.get<Course[]>('/academics/my-grades/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getChildSummary = async (childId: number): Promise<ChildSummary> => {
    try {
        const { data } = await api.get<ChildSummary>(`/academics/child-summary/${childId}/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getPracticeQuestions = async (subject: string): Promise<PracticeQuestion[]> => {
    try {
        const { data } = await api.get('/academics/practice-questions/', { params: { subject } });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const evaluatePracticeAnswer = async (question: string, answer: string, correctAnswer?: string): Promise<PracticeFeedback> => {
    try {
        const { data } = await api.post('/ai-tools/evaluate-practice-answer/', { 
            question, 
            answer,
            correct_answer: correctAnswer || ''
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Practice Labs - Adaptive AI Coaching
const generatePracticeQuestion = async (params: {
    mode: string;
    subject?: string;
    topic?: string;
    chapter?: string;
    useChapterMode?: boolean;
    gradeLevel?: number;
    difficulty?: string;
    useExamRAG?: boolean;
    useCurriculumRAG?: boolean;
    stream?: string;
    examYear?: string;
  }): Promise<any> => {
    try {
        const response = await api.post('/ai-tools/generate-practice-question/', params);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const evaluatePracticeAnswerAdaptive = async (params: {
    question: string;
    answer: string;
    correctAnswer: string;
    questionType?: string;
    difficulty?: string;
    coachPersonality?: string;
    studentPerformance?: any;
}): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/evaluate-practice-answer-adaptive/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getDiagnosticTest = async (subject: string, gradeLevel: number, numQuestions?: number): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/get-diagnostic-test/', {
            subject,
            gradeLevel,
            numQuestions: numQuestions || 5
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const evaluateDiagnosticTest = async (
    subject: string,
    gradeLevel: number,
    questions: any[],
    answers: Record<string, string>
): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/evaluate-diagnostic-test/', {
            subject,
            gradeLevel,
            questions,
            answers
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSessionReflection = async (sessionData: any): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/get-session-reflection/', { sessionData });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Practice Labs - Enhanced Features (Research Document)
const generateTwoLayerHints = async (params: {
    question: string;
    correctAnswer: string;
    difficulty: string;
}): Promise<{ minimalHint: string; detailedHint: string }> => {
    try {
        const { data } = await api.post('/ai-tools/generate-two-layer-hints/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const calculateZPDScore = async (masteryPercentage: number): Promise<{
    zpdScore: number;
    recommendedDifficulty: string;
    masteryPercentage: number;
}> => {
    try {
        const { data } = await api.post('/ai-tools/calculate-zpd-score/', { masteryPercentage });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const detectMisconceptions = async (params: {
    subject: string;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}): Promise<{ misconceptions: Array<{ type: string; remediation: string }>; count: number }> => {
    try {
        const { data } = await api.post('/ai-tools/detect-misconceptions/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getBadges = async (): Promise<{ badges: any[]; totalBadges: number }> => {
    try {
        const { data } = await api.get('/ai-tools/get-badges/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getMissions = async (): Promise<{ dailyMissions: any[]; weeklyMissions: any[] }> => {
    try {
        const { data } = await api.get('/ai-tools/get-missions/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// ============================================================================
// SAVED LESSON PLANS - CRUD, SHARE, EXPORT
// ============================================================================

const getSavedLessonPlans = async (params?: {
    grade?: string;
    subject?: string;
    search?: string;
    my_plans?: boolean;
    public_only?: boolean;
    page?: number;
}): Promise<{ results: SavedLessonPlan[]; count: number; next: string | null; previous: string | null }> => {
    try {
        const { data } = await api.get('/ai-tools/saved-lesson-plans/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSavedLessonPlan = async (id: number): Promise<SavedLessonPlan> => {
    try {
        const { data } = await api.get(`/ai-tools/saved-lesson-plans/${id}/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const saveLessonPlan = async (lessonPlan: Partial<LessonPlan> & { is_public?: boolean; tags?: string[] }): Promise<SavedLessonPlan> => {
    try {
        // Transform camelCase to snake_case for Django backend
        const transformedPlan = {
            ...lessonPlan,
            moe_standard_id: lessonPlan.moeStandardId,
            essential_questions: lessonPlan.essentialQuestions,
            moe_competencies: lessonPlan.moeCompetencies,
            assessment_plan: lessonPlan.assessmentPlan,
            teacher_preparation: lessonPlan.teacherPreparation,
            resource_constraints: lessonPlan.resourceConstraints,
            five_e_sequence: lessonPlan.fiveESequence,
            differentiation_strategies: lessonPlan.differentiationStrategies,
            reflection_prompts: lessonPlan.reflectionPrompts,
            teacher_notes: lessonPlan.teacherNotes,
            student_readiness: lessonPlan.studentReadiness,
            local_context: lessonPlan.localContext,
        };
        
        // Remove camelCase versions to avoid confusion
        delete (transformedPlan as any).moeStandardId;
        delete (transformedPlan as any).essentialQuestions;
        delete (transformedPlan as any).moeCompetencies;
        delete (transformedPlan as any).assessmentPlan;
        delete (transformedPlan as any).teacherPreparation;
        delete (transformedPlan as any).resourceConstraints;
        delete (transformedPlan as any).fiveESequence;
        delete (transformedPlan as any).differentiationStrategies;
        delete (transformedPlan as any).reflectionPrompts;
        delete (transformedPlan as any).teacherNotes;
        delete (transformedPlan as any).studentReadiness;
        delete (transformedPlan as any).localContext;
        
        const { data } = await api.post('/ai-tools/saved-lesson-plans/', transformedPlan);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateSavedLessonPlan = async (id: number, updates: Partial<SavedLessonPlan>): Promise<SavedLessonPlan> => {
    try {
        const { data } = await api.patch(`/ai-tools/saved-lesson-plans/${id}/`, updates);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteSavedLessonPlan = async (id: number): Promise<void> => {
    try {
        await api.delete(`/ai-tools/saved-lesson-plans/${id}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const duplicateLessonPlan = async (id: number): Promise<SavedLessonPlan> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-lesson-plans/${id}/duplicate/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const exportLessonPlanPDF = async (id: number): Promise<Blob> => {
    try {
        const response = await api.get(`/ai-tools/saved-lesson-plans/${id}/export_pdf/`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const useLessonPlan = async (id: number): Promise<{ times_used: number }> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-lesson-plans/${id}/use/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const rateLessonPlan = async (id: number, rating: number, comment?: string): Promise<any> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-lesson-plans/${id}/rate/`, { rating, comment });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const extractChapterContent = async (grade: string, subject: string, chapter: string): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/extract-chapter-content/', {
            grade,
            subject,
            chapter
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Communications
const getConversations = async (): Promise<Conversation[]> => {
    try {
        const { data } = await api.get('/communications/conversations/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getMessages = async (conversationId: number): Promise<Message[]> => {
    try {
        const { data } = await api.get(`/communications/conversations/${conversationId}/messages/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const sendMessage = async (conversationId: number, content: string, attachment?: File): Promise<Message> => {
    const formData = new FormData();
    formData.append('conversation', conversationId.toString());
    formData.append('content', content);
    if (attachment) {
        formData.append('attachment', attachment);
    }
    try {
        const { data } = await api.post('/communications/messages/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const createConversation = async (participantIds: number[]): Promise<Conversation> => {
    try {
        const { data } = await api.post('/communications/conversations/', {
            participants: participantIds
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteMessage = async (messageId: number): Promise<void> => {
    try {
        await api.delete(`/communications/messages/${messageId}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const clearConversationMessages = async (conversationId: number): Promise<void> => {
    try {
        // Get all messages in the conversation
        const messages = await getMessages(conversationId);
        // Delete each message
        await Promise.all(messages.map(msg => deleteMessage(msg.id)));
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteConversation = async (conversationId: number): Promise<void> => {
    try {
        await api.delete(`/communications/conversations/${conversationId}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Analytics
const getEngagementTrends = async (): Promise<EngagementTrendPoint[]> => {
    try {
        const { data } = await api.get('/analytics/engagement-trends/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getLearningOutcomes = async (): Promise<LearningOutcomePoint[]> => {
    try {
        const { data } = await api.get('/analytics/learning-outcomes/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Live Engagement Monitoring
const getLiveEngagement = async (): Promise<any> => {
    try {
        const { data } = await api.get('/analytics/live-engagement/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getEngagementTrendsEnhanced = async (days: number = 7): Promise<any[]> => {
    try {
        const { data } = await api.get(`/analytics/engagement-trends-enhanced/?days=${days}`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getStudentEngagementHistory = async (studentId?: number, days: number = 7): Promise<any[]> => {
    try {
        const params = new URLSearchParams({ days: days.toString() });
        if (studentId) {
            params.append('student_id', studentId.toString());
        }
        const { data } = await api.get(`/analytics/student-engagement-history/?${params.toString()}`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const startEngagementSession = async (subject?: string, activityType: string = 'AI Tutor'): Promise<any> => {
    try {
        const { data } = await api.post('/analytics/engagement-sessions/start_session/', {
            subject,
            activity_type: activityType
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const endEngagementSession = async (sessionId: number): Promise<any> => {
    try {
        const { data } = await api.post(`/analytics/engagement-sessions/${sessionId}/end_session/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const recordEngagementSnapshot = async (
    sessionId: number,
    expression: string,
    personDetected: boolean,
    confidence: number = 0.0,
    detectedObjects: string[] = []
): Promise<any> => {
    try {
        const { data } = await api.post(`/analytics/engagement-sessions/${sessionId}/record_snapshot/`, {
            expression,
            person_detected: personDetected,
            confidence,
            detected_objects: detectedObjects
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Smart Alerts
const getSmartAlerts = async (filters?: {
    status?: string;
    priority?: string;
    category?: string;
    sentiment?: string;
    assigned_to_me?: boolean;
    requires_attention?: boolean;
}): Promise<SmartAlert[]> => {
    try {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const { data } = await api.get(`/alerts/smart-alerts/?${params.toString()}`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const analyzeSmartAlert = async (alertId: number, forceReanalysis: boolean = false): Promise<SmartAlert> => {
    try {
        const { data } = await api.post(`/alerts/smart-alerts/${alertId}/analyze/`, { 
            force_reanalysis: forceReanalysis 
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const assignSmartAlert = async (alertId: number, assignedToId: number): Promise<SmartAlert> => {
    try {
        const { data } = await api.post(`/alerts/smart-alerts/${alertId}/assign/`, { 
            assigned_to_id: assignedToId 
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateSmartAlertStatus = async (
    alertId: number, 
    status: string, 
    notes?: { resolution_notes?: string; action_taken?: string }
): Promise<SmartAlert> => {
    try {
        const { data } = await api.post(`/alerts/smart-alerts/${alertId}/update_status/`, { 
            status,
            ...notes
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateSmartAlert = async (alertId: number, updates: Partial<SmartAlert>): Promise<SmartAlert> => {
    try {
        const { data } = await api.patch(`/alerts/smart-alerts/${alertId}/`, updates);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteSmartAlert = async (alertId: number): Promise<void> => {
    try {
        await api.delete(`/alerts/smart-alerts/${alertId}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSmartAlertStatistics = async (): Promise<any> => {
    try {
        const { data } = await api.get('/alerts/smart-alerts/statistics/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// Code Execution
const runCodeOnBackend = async (code: string, language: string): Promise<{ output: string }> => {
    try {
        const { data } = await api.post('/code/run/', { code, language });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};


// AI Tools
async function getTutorResponseStream(
    message: string, 
    useRAG: boolean, 
    ragParams?: { grade?: string; subject?: string; stream?: string; chapter?: string }
): Promise<{ stream: AsyncGenerator<string, void, undefined>, headers: Record<string, string> }> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}ai-tools/tutor/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            message, 
            useRAG,
            grade: ragParams?.grade,
            subject: ragParams?.subject,
            stream: ragParams?.stream,
            chapter: ragParams?.chapter
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error('Failed to get response from AI Tutor.');
    }

    // Extract RAG metadata from response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });

    // Create async generator for streaming
    async function* streamGenerator(): AsyncGenerator<string, void, undefined> {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield decoder.decode(value);
        }
    }

    return {
        stream: streamGenerator(),
        headers
    };
}

const generateLessonPlan = async (
    topic: string,
    gradeLevel: string,
    objectives: string,
    useRAG: boolean,
    subject?: string,
    duration?: number,
    moeStandardId?: string,
    resourceConstraints?: any,
    studentReadiness?: any,
    localContext?: any
): Promise<LessonPlan> => {
    try {
        const response = await api.post('/ai-tools/lesson-planner/', {
            topic,
            gradeLevel,
            objectives,
            useRAG,
            subject,
            duration: duration || 45,
            moeStandardId,
            resourceConstraints,
            studentReadiness,
            localContext,
        });
        if (typeof response.data === 'string') {
            try {
                return JSON.parse(response.data) as LessonPlan;
            } catch(e) {
                 console.error("Failed to parse lesson plan JSON:", e);
                 throw new Error("Received an invalid format from the server.");
            }
        }
        return response.data as LessonPlan;

    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

const getStudentAIInsights = async (student: StudentProgress): Promise<AIInsight> => {
    try {
        const { data } = await api.post<AIInsight>('/ai-tools/student-insights/', { student });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const generateRubric = async (params: RubricGenerationParams): Promise<GeneratedRubric> => {
    try {
        const { data } = await api.post<GeneratedRubric>('/ai-tools/generate-rubric/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const extractCurriculumContent = async (params: {
    subject: string;
    grade_level: string;
    topic?: string;
    chapter_input?: string;
    suggest_topic?: boolean;
    document_type?: string;  // NEW: Document type for topic suggestions
}): Promise<{
    success: boolean;
    learning_objectives: string[];
    standards: string[];
    key_concepts: string[];
    suggested_criteria_count: number;
    suggested_topics?: string[];
    chapter_context?: {
        chapter_number?: number;
        chapter_title?: string;
    };
    error?: string;
}> => {
    try {
        const { data } = await api.post('/ai-tools/extract-curriculum-content/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const generateAssignmentDescription = async (params: {
    topic: string;
    document_type: string;
    subject?: string;
    grade_level?: string;
    learning_objectives?: string[];
}): Promise<{
    success: boolean;
    description: string;
    topic: string;
    document_type: string;
    fallback_used?: boolean;
    error?: string;
}> => {
    try {
        const { data } = await api.post('/ai-tools/generate-assignment-description/', params);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// ============================================================================
// SAVED RUBRICS - CRUD, EXPORT, DUPLICATE
// ============================================================================

const getSavedRubrics = async (params?: {
    grade_level?: string;
    subject?: string;
    rubric_type?: string;
    search?: string;
    my_rubrics?: boolean;
}): Promise<{ results: SavedRubric[]; count: number; next: string | null; previous: string | null }> => {
    try {
        const { data } = await api.get('/ai-tools/saved-rubrics/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSavedRubric = async (id: number): Promise<SavedRubric> => {
    try {
        const { data } = await api.get(`/ai-tools/saved-rubrics/${id}/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const saveRubric = async (rubric: Partial<SavedRubric>): Promise<SavedRubric> => {
    try {
        const { data } = await api.post('/ai-tools/saved-rubrics/', rubric);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateSavedRubric = async (id: number, updates: Partial<SavedRubric>): Promise<SavedRubric> => {
    try {
        const { data } = await api.patch(`/ai-tools/saved-rubrics/${id}/`, updates);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const deleteSavedRubric = async (id: number): Promise<void> => {
    try {
        await api.delete(`/ai-tools/saved-rubrics/${id}/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const duplicateRubric = async (id: number): Promise<SavedRubric> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-rubrics/${id}/duplicate/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const exportRubricPDF = async (id: number): Promise<Blob> => {
    try {
        const response = await api.get(`/ai-tools/saved-rubrics/${id}/export_pdf/`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const exportRubric = async (rubricData: any, format: 'txt' | 'pdf' | 'docx'): Promise<Blob> => {
    try {
        if (format === 'pdf' || format === 'docx') {
            // Backend API call for PDF and DOCX
            const response = await api.post(`/ai-tools/export-rubric/`, 
                { ...rubricData, format },
                { responseType: 'blob' }
            );
            return response.data;
        } else {
            // For text format, return empty blob (handled client-side)
            return new Blob([''], { type: 'text/plain' });
        }
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const exportSavedRubric = async (id: number, format: 'txt' | 'pdf' | 'docx'): Promise<Blob> => {
    try {
        const response = await api.get(`/ai-tools/saved-rubrics/${id}/export/`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const useRubric = async (id: number): Promise<{ times_used: number }> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-rubrics/${id}/use/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// ============================================================================
// SHARED FILES - SHARING AND NOTIFICATIONS
// ============================================================================

const shareLessonPlan = async (id: number, userIds: number[], message?: string): Promise<{ message: string; shared_count: number }> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-lesson-plans/${id}/share/`, {
            user_ids: userIds,
            message: message || ''
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const shareRubric = async (id: number, userIds: number[], message?: string): Promise<{ message: string; shared_count: number }> => {
    try {
        const { data } = await api.post(`/ai-tools/saved-rubrics/${id}/share/`, {
            user_ids: userIds,
            message: message || ''
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getSharedFiles = async (params?: {
    filter?: 'sent' | 'received';
    content_type?: 'lesson_plan' | 'rubric';
    is_viewed?: boolean;
}): Promise<any[]> => {
    try {
        const { data } = await api.get('/ai-tools/shared-files/', { params });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const markSharedFileViewed = async (id: number): Promise<any> => {
    try {
        const { data } = await api.post(`/ai-tools/shared-files/${id}/mark_viewed/`);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getUnreadSharedFilesCount = async (): Promise<{ count: number }> => {
    try {
        const { data } = await api.get('/ai-tools/shared-files/unread_count/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getShareableUsers = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/users/');
        // Filter to only admins, teachers, and students
        return data.filter((user: any) => 
            ['Admin', 'Teacher', 'Student'].includes(user.role)
        );
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const gradeSubmission = async (gradeData: any): Promise<GradedSubmission> => {
    try {
        const { data } = await api.post(`/ai-tools/grade-submission/`, gradeData);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const checkSubmissionAuthenticity = async (submissionId: number): Promise<AuthenticityResult> => {
    try {
        const { data } = await api.post(`/ai-tools/check-authenticity/`, { submission_id: submissionId });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const summarizeConversation = async (conversationId: number): Promise<string> => {
    try {
        const { data } = await api.post<{ summary: string }>('/ai-tools/summarize-conversation/', { conversation_id: conversationId });
        return data.summary;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// ============================================================================
// FILE NOTIFICATIONS
// ============================================================================

const getFileNotifications = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/communications/file-notifications/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const markNotificationRead = async (id: number): Promise<void> => {
    try {
        await api.post(`/communications/file-notifications/${id}/mark_read/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const markNotificationDownloaded = async (id: number): Promise<void> => {
    try {
        await api.post(`/communications/file-notifications/${id}/mark_downloaded/`);
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getUnreadNotificationCount = async (): Promise<number> => {
    try {
        const { data } = await api.get('/communications/file-notifications/unread_count/');
        return data.count;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

// ============================================================================
// STUDENT ASSIGNMENTS
// ============================================================================

const getStudentAssignments = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/communications/student-assignments/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getActiveTeachers = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/communications/student-assignments/active_teachers/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const submitAssignment = async (formData: FormData): Promise<any> => {
    try {
        const { data } = await api.post('/communications/student-assignments/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getAssignmentTopics = async (teacherId?: number): Promise<string[]> => {
    try {
        const params = teacherId ? { teacher_id: teacherId } : {};
        const { data } = await api.get('/communications/student-assignments/assignment_topics/', { params });
        return data.topics;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const gradeAssignment = async (id: number, grade: number, feedback: string): Promise<any> => {
    try {
        const { data } = await api.post(`/communications/student-assignments/${id}/grade/`, {
            grade,
            feedback,
        });
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const extractFileText = async (file: File): Promise<{ text: string; filename: string; size: number }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/ai-tools/extract-file-text/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

// Tutor Configuration
const generateTutorWelcomeMessage = async (config: {
    grade?: string;
    subject?: string;
    stream?: string;
    chapter?: string;
    chapter_title?: string;
    chapter_topics?: string[];
    chapter_summary?: string;
    use_ethiopian_curriculum?: boolean;
}): Promise<{ welcome_message: string; model: string }> => {
    try {
        const { data } = await api.post('/ai-tools/generate-tutor-welcome/', config);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const getTutorConfiguration = async (): Promise<any> => {
    try {
        const { data } = await api.get('/ai-tools/tutor-configuration/');
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const saveTutorConfiguration = async (config: {
    use_ethiopian_curriculum: boolean;
    grade?: string;
    stream?: string;
    subject?: string;
    chapter_input?: string;
}): Promise<any> => {
    try {
        const { data } = await api.post('/ai-tools/tutor-configuration/', config);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const updateTutorConfiguration = async (config: Partial<{
    use_ethiopian_curriculum: boolean;
    grade?: string;
    stream?: string;
    subject?: string;
    chapter_input?: string;
}>): Promise<any> => {
    try {
        const { data } = await api.patch('/ai-tools/tutor-configuration/', config);
        return data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
};

const post = async (url: string, data?: any, config?: any): Promise<any> => {
    const response = await api.post(url, data, config);
    return response.data;
};

const get = async (url: string, config?: any): Promise<any> => {
    const response = await api.get(url, config);
    return response.data;
};

const patch = async (url: string, data?: any, config?: any): Promise<any> => {
    const response = await api.patch(url, data, config);
    return response.data;
};

const put = async (url: string, data?: any, config?: any): Promise<any> => {
    const response = await api.put(url, data, config);
    return response.data;
};

const del = async (url: string, config?: any): Promise<any> => {
    const response = await api.delete(url, config);
    return response.data;
};

const getApprovedTeacherCourses = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/academics/approved-teacher-courses/');
        return data;
    } catch (error) {
        console.error('Error fetching approved teacher courses:', error);
        throw error;
    }
};

const getMyEnrollmentRequests = async (): Promise<any[]> => {
    try {
        const { data } = await api.get('/academics/my-enrollment-requests/');
        return data;
    } catch (error) {
        console.error('Error fetching enrollment requests:', error);
        throw error;
    }
};

const submitEnrollmentRequest = async (courseId: number): Promise<any> => {
    try {
        const { data } = await api.post('/academics/student-enrollment-requests/', { course: courseId });
        return data;
    } catch (error) {
        console.error('Error submitting enrollment request:', error);
        throw error;
    }
};

const approveCourseRequest = async (requestId: number, notes?: string): Promise<any> => {
    try {
        const { data } = await api.post(`/academics/teacher-course-requests/${requestId}/approve/`, { review_notes: notes });
        return data;
    } catch (error) {
        console.error('Error approving course request:', error);
        throw error;
    }
};

const declineCourseRequest = async (requestId: number, notes?: string): Promise<any> => {
    try {
        const { data } = await api.post(`/academics/teacher-course-requests/${requestId}/decline/`, { review_notes: notes });
        return data;
    } catch (error) {
        console.error('Error declining course request:', error);
        throw error;
    }
};

const setUnderReviewCourseRequest = async (requestId: number, notes?: string): Promise<any> => {
    try {
        const { data } = await api.post(`/academics/teacher-course-requests/${requestId}/under_review/`, { review_notes: notes });
        return data;
    } catch (error) {
        console.error('Error setting request under review:', error);
        throw error;
    }
};

export const apiService = {
    post,
    get,
    patch,
    put,
    delete: del,
    login,
    signup,
    logout,
    getCurrentUser,
    updateProfile,
    getUsers,
    updateUserRole,
    getStudents,
    getMyChildren,
    getUnlinkedStudents,
    linkChild,
    getStudentFamilies,
    searchFamilies,
    getParentLinkedStudents,
    getParentChildGrades,
    getVectorStores,
    createVectorStore,
    deleteVectorStore,
    getExamVectorStores,
    createExamVectorStore,
    deleteExamVectorStore,
    getCurriculumConfig,
    getSubjectsForGrade,
    getTutorResponseStream,
    generateLessonPlan,
    getStudentAIInsights,
    getAssignments,
    getSubmissions,
    createSubmission,
    updateSubmission,
    gradeSubmission,
    checkSubmissionAuthenticity,
    getMyGrades,
    getChildSummary,
    getPracticeQuestions,
    evaluatePracticeAnswer,
    generateRubric,
    extractCurriculumContent,
    generateAssignmentDescription,
    getConversations,
    createConversation,
    deleteConversation,
    getMessages,
    sendMessage,
    deleteMessage,
    clearConversationMessages,
    getEngagementTrends,
    getLearningOutcomes,
    getLiveEngagement,
    getEngagementTrendsEnhanced,
    getStudentEngagementHistory,
    startEngagementSession,
    endEngagementSession,
    recordEngagementSnapshot,
    summarizeConversation,
    getSmartAlerts,
    analyzeSmartAlert,
    assignSmartAlert,
    updateSmartAlertStatus,
    updateSmartAlert,
    deleteSmartAlert,
    getSmartAlertStatistics,
    getApprovedTeacherCourses,
    getMyEnrollmentRequests,
    submitEnrollmentRequest,
    approveCourseRequest,
    declineCourseRequest,
    setUnderReviewCourseRequest,
    runCodeOnBackend,
    // Practice Labs - Adaptive AI Coaching
    generatePracticeQuestion,
    evaluatePracticeAnswerAdaptive,
    getDiagnosticTest,
    evaluateDiagnosticTest,
    getSessionReflection,
    // Practice Labs - Enhanced Features
    generateTwoLayerHints,
    calculateZPDScore,
    detectMisconceptions,
    getBadges,
    getMissions,
    // Saved Lesson Plans
    getSavedLessonPlans,
    getSavedLessonPlan,
    saveLessonPlan,
    updateSavedLessonPlan,
    deleteSavedLessonPlan,
    duplicateLessonPlan,
    exportLessonPlanPDF,
    useLessonPlan,
    rateLessonPlan,
    extractChapterContent,
    // Saved Rubrics
    getSavedRubrics,
    getSavedRubric,
    saveRubric,
    updateSavedRubric,
    deleteSavedRubric,
    duplicateRubric,
    exportRubricPDF,
    exportRubric,
    exportSavedRubric,
    useRubric,
    // Shared Files
    shareLessonPlan,
    shareRubric,
    getSharedFiles,
    markSharedFileViewed,
    getUnreadSharedFilesCount,
    getShareableUsers,
    // File Notifications
    getFileNotifications,
    markNotificationRead,
    markNotificationDownloaded,
    getUnreadNotificationCount,
    // Student Assignments
    getStudentAssignments,
    getActiveTeachers,
    submitAssignment,
    getAssignmentTopics,
    gradeAssignment,
    // File Text Extraction
    extractFileText,
    // Tutor Configuration
    getTutorConfiguration,
    saveTutorConfiguration,
    generateTutorWelcomeMessage,
    updateTutorConfiguration,
};
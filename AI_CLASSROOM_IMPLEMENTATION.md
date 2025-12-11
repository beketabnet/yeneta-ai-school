# AI Classroom Implementation Guide

## Overview

The AI Classroom is a comprehensive, modular implementation that integrates an AI-powered teaching environment into the YENETA platform. It enables students to:

1. **Create personalized AI-powered lessons** through the Lesson Creator
2. **Engage in interactive learning** with real-time AI Teacher responses
3. **Monitor engagement** through webcam-based emotion recognition
4. **Collaborate on whiteboards** - one for lesson content display and one for interactive problem-solving
5. **Receive personalized feedback** from the AI Teacher throughout the lesson

## Architecture

### Modular Component Structure

```
components/student/aiClassroom/
├── AIClassroomManager.tsx        # Main orchestrator component
├── LessonCreator.tsx             # Lesson creation interface (Subject, Grade, Topic, Objectives)
├── VirtualClassroom.tsx          # Main classroom layout with grid/focus modes
├── LessonWhiteboard.tsx          # Displays lesson content and 5E phases
├── InteractiveWhiteboard.tsx     # Canvas for student drawing and collaboration
├── ChatInterface.tsx             # AI Teacher chat with real-time messaging
├── EngagementMonitor.tsx         # Webcam feed + emotion recognition + engagement metrics
├── LessonNavigation.tsx          # Phase progress and navigation
└── index.ts                      # Component exports
```

### Context-Based State Management

#### 1. **LessonContext** (`contexts/LessonContext.tsx`)
Manages the current lesson state:
- `currentLesson`: Currently active lesson data
- `createLesson()`: Creates and stores a new lesson
- `updateLesson()`: Updates lesson content
- `clearLesson()`: Clears the active lesson

#### 2. **AIClassroomContext** (`contexts/AIClassroomContext.tsx`)
Manages real-time classroom state:
- **Chat History**: Student-AI interactions
- **Lesson Whiteboard**: Displays lesson content and phases
- **Interactive Whiteboard**: Student drawings and solutions
- **Classroom State**: Current phase (engage/explore/explain/elaborate/evaluate), engagement level, webcam status

### Service Layer

#### 1. **aiClassroomService** (`services/aiClassroomService.ts`)
Handles lesson generation and progression:
- `generateLessonContent()`: Generates complete 5E lesson structure
- `getAITeacherResponse()`: Gets conversational responses
- `generateFeedback()`: Provides personalized feedback
- `analyzeLessonProgress()`: Tracks student mastery
- `getNextLessonPhaseGuidance()`: Phase-specific guidance
- `generateEngagementActivities()`: Adapts activities to engagement level

#### 2. **aiTeacherService** (`services/aiTeacherService.ts`)
Handles AI Teacher interactions:
- `generateTeacherResponse()`: Main AI response generation
- `providePersonalizedFeedback()`: Feedback based on responses
- `assessStudentUnderstanding()`: Comprehensive assessment
- `generateAdaptiveQuestion()`: Adaptive questioning
- `getMotivationalMessage()`: Engagement-based motivation
- `generateHint()`: Adaptive hints
- `analyzeEngagement()`: Emotion + interaction analysis
- `generateSummary()`: Lesson summary with next steps

#### 3. **lessonService** (`services/lessonService.ts`)
Handles lesson persistence:
- `saveLessonPlan()`: Save lesson to backend
- `getLessonPlan()`: Retrieve lesson
- `getUserLessons()`: Fetch user's lessons
- `exportLessonPlan()`: Export to PDF/JSON/DOCX
- `shareLessonPlan()`: Share with other users
- `recordLessonSession()`: Record student interaction data

### Hooks

#### 1. **useLesson** (`hooks/useLesson.ts`)
```typescript
const { currentLesson, createLesson, updateLesson, clearLesson, isLoading, error } = useLesson();
```

#### 2. **useAIClassroom** (`hooks/useAIClassroom.ts`)
```typescript
const {
  chatHistory,
  addChatMessage,
  lessonWhiteboard,
  interactiveWhiteboard,
  classroomState,
  updateClassroomState
} = useAIClassroom();
```

## User Flow

### Step 1: Landing Page → AI Classroom Button
User clicks "AI Classroom" button on landing page
- If not authenticated: Redirects to Login
- If authenticated: Navigates to AI Classroom

### Step 2: Lesson Creator
User fills form:
1. **Subject**: Mathematics, Science, English, etc.
2. **Grade Level**: Grade 1-12
3. **Topic**: Specific lesson topic
4. **Duration**: Lesson length in minutes (15-180)
5. **Learning Objectives**: What students will learn

AI generates:
- Complete 5E phase structure (Engage, Explore, Explain, Elaborate, Evaluate)
- Differentiation strategies
- Assessment plan
- Resource-constrained materials list

### Step 3: Virtual Classroom
Main interactive environment with:

#### **Layout Modes**
1. **Grid Mode** (default):
   - Left: Lesson Whiteboard + Interactive Whiteboard (2/3 width)
   - Right: Chat Interface + Engagement Monitor (1/3 width)

2. **Focus Mode**:
   - Left: Full Chat Interface (3/4 width)
   - Right: Engagement Monitor + Navigation (1/4 width)

#### **Phase Progression**
- User navigates through 5E phases manually or via AI guidance
- Each phase has:
  - Activities and teacher actions
  - Duration estimate
  - Student-specific guidance
  - Real-time engagement feedback

#### **Real-Time Features**
1. **Chat Interface**:
   - Student asks questions
   - AI Teacher provides:
     - Instructions (Phase guidance)
     - Questions (Adaptive assessment)
     - Feedback (Personalized responses)
     - Encouragement (Motivation messages)

2. **Lesson Whiteboard**:
   - Displays current phase content
   - Shows learning objectives
   - Lists activities

3. **Interactive Whiteboard**:
   - Drawing canvas for problem-solving
   - Student can sketch answers
   - AI can analyze drawings (future enhancement)

4. **Engagement Monitor**:
   - Real-time webcam feed
   - Emotion recognition (happy, sad, confused, etc.)
   - Engagement meter (0-100%)
   - Recent expression history
   - Metrics: Most common expression, sample size

## Integration Points

### 1. Landing Page Integration
```typescript
// Landing Page
<button onClick={() => setView('aiClassroom')}>AI Classroom</button>
```

### 2. Routes Integration
```typescript
// Routes.tsx
if (view === 'aiClassroom' && isAuthenticated && user) {
  return <AIClassroomManager onExit={() => setView('landing')} />;
}
```

### 3. App.tsx Context Providers
```typescript
<LessonProvider>
  <AIClassroomProvider>
    <Routes />
  </AIClassroomProvider>
</LessonProvider>
```

## Data Models

### Lesson Content Structure
```typescript
interface LessonContent {
  id?: string;
  title: string;
  subject: string;
  gradeLevel: string;
  objectives: string[];           // Learning goals
  materials: string[];            // Required materials
  duration: number;               // Minutes
  content: string;                // Main lesson text
  activities: string[];           // Lesson activities
  assessmentPlan: string;         // Assessment strategy
  fiveESequence?: FiveEPhase[];   // 5E phase breakdown
  differentiationStrategies?: any[];
  resourceConstraints?: any;      // Material availability
  studentReadiness?: any;         // Prior knowledge level
  localContext?: any;             // Region-specific context
  createdAt?: string;
  teacherNotes?: string;
}
```

### Chat Message Structure
```typescript
interface ChatMessage {
  id: string;
  role: 'student' | 'ai-teacher';
  content: string;
  timestamp: string;
  type?: 'text' | 'instruction' | 'question' | 'feedback';
}
```

### Engagement Monitor Output
```typescript
interface EngagementMetrics {
  studentEngagement: number;      // 0-100%
  studentExpressions: string[];   // Recent emotions
  webcamActive: boolean;
  currentPhase: string;
}
```

## Backend API Endpoints Required

### Lesson Management
- `POST /api/lessons/save` - Save lesson
- `GET /api/lessons/{lessonId}` - Get lesson
- `GET /api/lessons/my-lessons` - User's lessons
- `DELETE /api/lessons/{lessonId}` - Delete lesson
- `GET /api/lessons/{lessonId}/export` - Export lesson
- `POST /api/lessons/{lessonId}/share` - Share lesson

### AI Teacher Responses
- `POST /api/ai-teacher/respond` - Generate response
- `POST /api/ai-teacher/feedback` - Provide feedback
- `POST /api/ai-teacher/assess` - Assess understanding
- `POST /api/ai-teacher/question` - Generate adaptive question
- `POST /api/ai-teacher/motivation` - Motivational message
- `POST /api/ai-teacher/hint` - Generate hint
- `POST /api/ai-teacher/engagement` - Analyze engagement
- `POST /api/ai-teacher/summary` - Generate summary

### AI Classroom Core
- `POST /api/ai-classroom/generate-lesson` - Generate lesson
- `POST /api/ai-classroom/teacher-response` - AI response
- `POST /api/ai-classroom/generate-feedback` - Feedback
- `POST /api/ai-classroom/analyze-progress` - Progress analysis
- `POST /api/ai-classroom/next-phase-guidance` - Phase guidance
- `POST /api/ai-classroom/engagement-activities` - Activities

## Professional Features

### 1. 5E Instructional Model
Each lesson follows the proven 5E framework:
- **Engage**: Hook student interest (5 min)
- **Explore**: Hands-on discovery (10 min)
- **Explain**: Teach core concepts (10 min)
- **Elaborate**: Apply learning (10 min)
- **Evaluate**: Assess understanding (10 min)

### 2. Differentiation Strategies
AI adapts to student needs:
- Below Grade Level
- At Grade Level
- Above Grade Level
- Special Needs

### 3. Ethiopian Curriculum Alignment
- Grade-level standards
- Regional considerations
- Resource constraints
- Local context integration

### 4. Real-Time Emotion Recognition
- Hybrid engagement monitoring (TFLite, YOLO, FaceAPI)
- 8 emotional states tracked
- Adaptation based on engagement
- Motivational interventions

### 5. Adaptive Learning Path
- Difficulty scales with performance
- Hints provided on second attempt
- Feedback personalized to response
- Phase progression based on mastery

## Styling & Theme

All components support:
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Eye-friendly for long sessions
- **Responsive Design**: Desktop, tablet, mobile
- **Tailwind CSS**: Utility-first styling
- **Accessibility**: WCAG compliant

## Error Handling

All services include:
- Try-catch error handling
- Fallback responses (graceful degradation)
- User-friendly error messages
- Logging for debugging
- Automatic retry mechanisms

## Performance Optimization

1. **Code Splitting**: Dynamic imports for components
2. **Memoization**: useCallback, useMemo for expensive operations
3. **Lazy Loading**: Canvas initialization on demand
4. **State Optimization**: Only necessary context re-renders
5. **Local Storage**: Lesson caching for offline access

## Future Enhancements

1. **Multi-Modal Learning**: Video, audio, interactive simulations
2. **Collaborative Classrooms**: Real-time student-teacher collaboration
3. **Advanced Analytics**: Deep learning for better engagement prediction
4. **Adaptive Content**: AI-generated content based on learning patterns
5. **Speech Recognition**: Voice-based interactions with AI Teacher
6. **Assessment Integration**: Real-time testing with immediate feedback
7. **Progress Tracking**: Comprehensive performance dashboards
8. **Parental Notifications**: Engagement and progress alerts

## Configuration

### Environment Variables
```
VITE_AI_CLASSROOM_API_BASE=http://localhost:8000/api
VITE_ENGAGEMENT_MODEL=hybrid  # yolo, tflite, hybrid
VITE_DEBUG_MODE=false
```

### Feature Flags
Control features via localStorage or config:
```typescript
const featureFlags = {
  enableWebcam: true,
  enableDrawing: true,
  enableAI: true,
  enableSharing: false
};
```

## Testing

### Unit Tests (Recommended)
- Service layer unit tests
- Context provider tests
- Hook tests

### E2E Tests (Recommended)
- Full lesson creation flow
- AI interaction scenarios
- Engagement monitoring
- Phase progression

### Manual Testing Checklist
- [ ] Lesson creation with all fields
- [ ] Chat interaction with AI Teacher
- [ ] Whiteboard drawing functionality
- [ ] Webcam activation and emotion detection
- [ ] Phase navigation
- [ ] Layout mode switching
- [ ] Dark mode support
- [ ] Responsive design on mobile
- [ ] Error recovery

## Deployment

1. **Build**: `npm run build`
2. **Backend**: Deploy Django backend with AI endpoints
3. **Frontend**: Deploy dist folder to hosting
4. **Environment**: Set VITE_AI_CLASSROOM_API_BASE
5. **Testing**: Run full test suite
6. **Monitoring**: Set up error tracking

## Support & Maintenance

- Monitor API response times
- Track error rates
- Analyze engagement metrics
- Collect user feedback
- Iterate on AI responses
- Update curriculum content
- Maintain engagement models

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Status**: Production Ready

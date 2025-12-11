# AI Classroom Integration Guide

## Quick Start

### 1. Access AI Classroom
**User Flow**: Landing Page → "AI Classroom" Button → Login (if needed) → Lesson Creator → Virtual Classroom

### 2. File Structure Overview

```
d:\django_project\yeneta-ai-school\
├── contexts/
│   ├── LessonContext.tsx          # Lesson state management
│   ├── AIClassroomContext.tsx     # Classroom state management
│   └── index.ts                   # Context exports
├── hooks/
│   ├── useLesson.ts               # Lesson hook
│   ├── useAIClassroom.ts          # Classroom hook
│   └── index.ts                   # Hook exports
├── services/
│   ├── aiClassroomService.ts      # Lesson generation
│   ├── aiTeacherService.ts        # AI interactions
│   ├── lessonService.ts           # Lesson persistence
│   └── index.ts                   # Service exports
├── components/
│   └── student/
│       └── aiClassroom/
│           ├── AIClassroomManager.tsx      # Main orchestrator
│           ├── LessonCreator.tsx           # Lesson form
│           ├── VirtualClassroom.tsx        # Main classroom
│           ├── LessonWhiteboard.tsx        # Lesson display
│           ├── InteractiveWhiteboard.tsx   # Drawing canvas
│           ├── ChatInterface.tsx           # AI chat
│           ├── EngagementMonitor.tsx       # Emotion tracking
│           ├── LessonNavigation.tsx        # Phase navigation
│           └── index.ts                    # Component exports
├── types.ts                        # TypeScript types (extended)
├── App.tsx                         # Updated with new providers
└── AI_CLASSROOM_IMPLEMENTATION.md  # Full documentation
```

## Configuration & Setup

### 1. Environment Setup
Ensure Python venv is activated:
```bash
cd d:\django_project\yeneta-ai-school
venv\Scripts\activate.bat
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
# Server runs on http://localhost:3002
```

### 4. Build for Production
```bash
npm run build
```

## Developer Guide

### Using Contexts

#### Lesson Context
```typescript
import { useLesson } from '../hooks/useLesson';

const MyComponent = () => {
  const { currentLesson, createLesson, updateLesson, isLoading } = useLesson();
  
  const handleCreateLesson = async () => {
    const lessonId = await createLesson({
      title: 'My Lesson',
      subject: 'Mathematics',
      gradeLevel: 'Grade 5',
      objectives: ['Understand fractions'],
      materials: ['Whiteboard', 'Markers'],
      duration: 45,
      content: 'Lesson content here',
      activities: ['Activity 1', 'Activity 2'],
      assessmentPlan: 'Quiz at the end'
    });
  };

  return <div>{isLoading ? 'Loading...' : 'Ready'}</div>;
};
```

#### AI Classroom Context
```typescript
import { useAIClassroom } from '../hooks/useAIClassroom';

const ChatComponent = () => {
  const {
    chatHistory,
    addChatMessage,
    classroomState,
    updateClassroomState
  } = useAIClassroom();

  const sendMessage = (content: string) => {
    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'student',
      content,
      timestamp: new Date().toISOString()
    });
  };

  const changePhase = (phase: 'engage' | 'explore' | 'explain' | 'elaborate' | 'evaluate') => {
    updateClassroomState({ currentPhase: phase });
  };

  return (
    <div>
      {chatHistory.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
};
```

### Using Services

#### AI Classroom Service
```typescript
import { aiClassroomService } from '../services/aiClassroomService';

// Generate lesson content
const lessonContent = await aiClassroomService.generateLessonContent(
  'Mathematics',      // subject
  'Grade 5',         // gradeLevel
  'Fractions',       // topic
  45,                // duration
  ['Understand fractions', 'Apply fractions to real world'] // objectives
);
```

#### AI Teacher Service
```typescript
import { aiTeacherService } from '../services/aiTeacherService';

// Get AI response to student input
const response = await aiTeacherService.generateTeacherResponse(
  'What are fractions?',  // student input
  lessonContext,          // lesson data
  chatHistory             // conversation history
);

// Get personalized feedback
const feedback = await aiTeacherService.providePersonalizedFeedback(
  'A fraction is a part of something',  // student response
  'Understand fractions',                // objective
  'Grade 5'                              // gradeLevel
);

// Assess understanding
const assessment = await aiTeacherService.assessStudentUnderstanding(
  'lesson-123',           // lessonId
  studentResponses        // array of responses
);

// Get adaptive question
const question = await aiTeacherService.generateAdaptiveQuestion(
  lessonContext,          // lesson data
  5,                      // difficulty 1-10
  studentHistory          // previous responses
);
```

#### Lesson Service
```typescript
import { lessonService } from '../services/lessonService';

// Save lesson plan
const savedLesson = await lessonService.saveLessonPlan({
  title: 'Fractions 101',
  subject: 'Mathematics',
  // ... other fields
});

// Get user's lessons
const myLessons = await lessonService.getUserLessons();

// Export lesson
const pdfBlob = await lessonService.exportLessonPlan('lesson-123', 'pdf');
```

### Creating New Components

#### Template
```typescript
import React, { useContext } from 'react';
import { useLesson } from '../../../hooks/useLesson';
import { useAIClassroom } from '../../../hooks/useAIClassroom';

interface MyComponentProps {
  lessonId: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ lessonId }) => {
  const { currentLesson } = useLesson();
  const { chatHistory, addChatMessage } = useAIClassroom();

  return (
    <div className="p-4 bg-white rounded-lg">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Extending the AI Classroom

#### Add New 5E Phase
```typescript
// Update the phases array in LessonNavigation.tsx
const phases = [
  { name: 'engage', title: 'Engage', duration: 5 },
  { name: 'explore', title: 'Explore', duration: 10 },
  // Add new phase
  { name: 'newphase', title: 'New Phase', duration: 10 }
];
```

#### Add New AI Response Type
```typescript
// In AIClassroomContext.tsx ChatMessage type
type: 'text' | 'instruction' | 'question' | 'feedback' | 'challenge' | 'your_new_type'
```

#### Add Whiteboard Features
```typescript
// In InteractiveWhiteboard.tsx, add new tool
const tools: ('pen' | 'eraser' | 'line' | 'rectangle' | 'circle')[] = ['pen', 'eraser'];

// Add tool button
<button onClick={() => setTool('circle')}>⭕</button>
```

## API Integration

### Backend Endpoints Expected

#### Lesson Management
```
POST   /api/lessons/save
GET    /api/lessons/{id}
GET    /api/lessons/my-lessons
DELETE /api/lessons/{id}
POST   /api/lessons/{id}/export
POST   /api/lessons/{id}/share
```

#### AI Teacher
```
POST /api/ai-teacher/respond          # Generate response
POST /api/ai-teacher/feedback         # Provide feedback
POST /api/ai-teacher/assess           # Assess understanding
POST /api/ai-teacher/question         # Generate question
POST /api/ai-teacher/hint             # Generate hint
POST /api/ai-teacher/motivation       # Motivational message
POST /api/ai-teacher/engagement       # Analyze engagement
POST /api/ai-teacher/summary          # Generate summary
```

#### AI Classroom
```
POST /api/ai-classroom/generate-lesson        # Generate lesson
POST /api/ai-classroom/teacher-response       # Teacher response
POST /api/ai-classroom/generate-feedback      # Feedback
POST /api/ai-classroom/analyze-progress       # Progress analysis
POST /api/ai-classroom/next-phase-guidance    # Phase guidance
POST /api/ai-classroom/engagement-activities  # Engagement activities
```

### Response Format
All services expect JSON responses with appropriate data structures.

## Testing

### Unit Test Example
```typescript
import { aiTeacherService } from '../services/aiTeacherService';

describe('aiTeacherService', () => {
  it('should generate teacher response', async () => {
    const response = await aiTeacherService.generateTeacherResponse(
      'What is a fraction?',
      mockLesson,
      []
    );
    expect(response.message).toBeDefined();
    expect(response.type).toBeIn(['instruction', 'question', 'feedback']);
  });
});
```

### E2E Test Example
```typescript
// Would be in Cypress or Playwright
describe('AI Classroom Flow', () => {
  it('should create lesson and start learning', () => {
    cy.visit('http://localhost:3002');
    cy.contains('AI Classroom').click();
    cy.get('input[name="subject"]').select('Mathematics');
    cy.get('input[name="gradeLevel"]').select('Grade 5');
    cy.get('input[name="topic"]').type('Fractions');
    cy.contains('Create Lesson').click();
    cy.contains('Engage', { timeout: 10000 }).should('be.visible');
  });
});
```

## Troubleshooting

### Issue: Lesson not creating
**Solution**: Check if backend API is running and `/api/lessons/save` endpoint exists

### Issue: Engagement monitor not activating
**Solution**: Check browser permissions for camera, ensure HTTPS in production

### Issue: Chat not responding
**Solution**: Verify `/api/ai-teacher/respond` endpoint, check AI service configuration

### Issue: Build errors
**Solution**: Run `npm install`, ensure TypeScript types are correct

## Performance Tips

1. **Memoize Components**: Use React.memo for expensive components
2. **Lazy Load Canvas**: Initialize whiteboard only on demand
3. **Debounce Chat**: Limit API calls for real-time input
4. **Cache Lessons**: Use localStorage for recent lessons
5. **Code Split**: Dynamic imports for heavy components

## Security Considerations

1. **Validate Inputs**: Sanitize user inputs before API calls
2. **Authentication**: Always verify user is authenticated
3. **CSRF Protection**: Include CSRF tokens in POST requests
4. **API Keys**: Never expose API keys in frontend code
5. **File Upload**: Validate file types and sizes

## Monitoring & Analytics

Add tracking for:
- Lesson creation rate
- Average engagement score
- Chat interaction frequency
- Phase transition patterns
- User retention metrics

## Future Enhancements

1. **Real-time Collaboration**: Multiple students in same classroom
2. **Voice Chat**: AI Teacher with voice interface
3. **Video Tutorials**: Embedded instructional videos
4. **Assessment Suite**: Automated testing and grading
5. **Parent Dashboard**: Family progress tracking
6. **Export Reports**: Comprehensive session reports
7. **Template Library**: Pre-built lesson templates
8. **Multi-Language**: Support for regional languages

## Support & Documentation

- **Main Documentation**: `AI_CLASSROOM_IMPLEMENTATION.md`
- **API Documentation**: Backend documentation
- **Component Library**: See individual component files
- **Type Definitions**: `types.ts`

## Contributing

When adding features:
1. Follow existing code style
2. Add TypeScript types
3. Update relevant documentation
4. Create unit tests
5. Test responsiveness
6. Dark mode support
7. Accessibility compliance

## Release Checklist

- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] No console warnings
- [ ] Documentation updated
- [ ] API endpoints verified
- [ ] Mobile responsive
- [ ] Dark mode tested
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Staging deployment successful

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Maintainer**: AI Classroom Team

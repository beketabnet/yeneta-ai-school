# Gradebook Manager - Comprehensive Implementation Plan

## Strategic Overview
Complete overhaul of Gradebook Manager with full CRUD operations, real-time synchronization across all dashboards, and professional UI/UX.

## Phase 1: Backend Enhancement
### 1.1 API Endpoints Enhancement
- Verify StudentGrade model supports both assignment_type and exam_type
- Ensure API returns full grade data with calculated overall grades
- Add endpoint for calculating overall grade per student per subject

### 1.2 Gradebook API Methods
- `getStudentGradesBySubject()` - with exam_type filter
- `createStudentGrade()` - create new grade entry
- `updateStudentGrade()` - update existing grade
- `deleteStudentGrade()` - delete grade entry
- `getStudentOverallGrade()` - calculate overall grade per student per subject

## Phase 2: Teacher Dashboard - Gradebook Manager
### 2.1 Grade Input Modal Enhancement
- Support both assignment_type and exam_type
- Add max_score input field
- Add validation for score ranges
- Add exam_type selector

### 2.2 Grade Filter Bar Enhancement
- Add exam_type dropdown filter
- Ensure all filters work seamlessly
- Add filter reset button

### 2.3 Grade Row Editor Enhancement
- Support inline editing for score, feedback, max_score
- Show both assignment_type and exam_type in display
- Add visual indicators for grade type

### 2.4 Vertical Scrollbar
- Implement ScrollableListContainer for gradebook table
- Set max-height to prevent page overflow
- Ensure responsive behavior

## Phase 3: Student Dashboard - Gradebook
### 3.1 Grade Display Enhancement
- Display all assignment types and exam types
- Calculate and display overall grade per subject
- Show grade breakdown by type
- Auto-update when teacher updates grades

### 3.2 Grade Statistics
- Overall GPA calculation
- Subject-wise grade statistics
- Performance trends

## Phase 4: Parent Dashboard - Courses & Grades
### 4.1 Course Grades Display
- Display student overall grades per subject
- Auto-update when grades change
- Show grade trends

### 4.2 Student Selector Enhancement
- Display as "Grade X - Student Name" format
- Make dropdown more informative
- Show family member relationships

## Phase 5: Parent Dashboard - At-a-Glance Status
### 5.1 Performance Overview
- Display "Performance Overview for [Student Name]"
- Get student name from "Viewing Dashboard For" selector
- Auto-update with real-time data

## Phase 6: Parent Dashboard - Enrolled Subjects
### 6.1 Enrolled Subjects Display
- Display enrolled subjects for selected student
- Show grades for enrolled subjects
- Auto-update when enrollment changes

### 6.2 Student Selector Enhancement
- Display as "Grade X - Student Name" format
- Make dropdown more informative

## Phase 7: Event-Driven Architecture
### 7.1 Grade Events
- GRADE_CREATED - emit when new grade added
- GRADE_UPDATED - emit when grade modified
- GRADE_DELETED - emit when grade removed

### 7.2 Event Listeners
- Student Gradebook listens for GRADE_UPDATED
- Parent Dashboard listens for GRADE_UPDATED
- All components auto-refresh on grade changes

## Implementation Order
1. Backend API verification and enhancement
2. GradeInputModal enhancement
3. GradeFilterBar enhancement  
4. TeacherGradebookManager vertical scrollbar
5. Student Gradebook enhancement
6. Parent Dashboard - Courses & Grades
7. Parent Dashboard - At-a-Glance Status
8. Parent Dashboard - Enrolled Subjects
9. Event-driven updates across all components
10. Testing and verification

## Key Principles
- Modular component architecture
- Reusable utility functions
- Event-driven real-time updates
- Professional UI/UX
- Comprehensive error handling
- Type-safe implementations
- Token-efficient code

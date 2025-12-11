import React, { useState, useEffect } from 'react';
import RubricManager from './rubrics/RubricManager';
import SectionManager from './sections/SectionManager';
import SectionDetail from './sections/SectionDetail';
import AddStudentModal from './sections/AddStudentModal';
import AssignmentCreator from './assignments/AssignmentCreator';
import QuickGrader from './grading/QuickGrader';
import Gradebook from './grading/Gradebook';
import AssignmentGradeView from './grading/AssignmentGradeView';
import type { Section } from './sections/SectionManager';
import type { Rubric } from './rubrics/RubricBuilder';
import type { Assignment } from './assignments/AssignmentCreator';

type ViewMode = 
    | 'rubrics'
    | 'sections'
    | 'section-detail'
    | 'assignments'
    | 'assignment-create'
    | 'grader'
    | 'gradebook'
    | 'assignment-grade';

interface Phase2HubProps {
    initialView?: ViewMode;
}

const Phase2Hub: React.FC<Phase2HubProps> = ({ initialView = 'sections' }) => {
    const [currentView, setCurrentView] = useState<ViewMode>(initialView);
    
    // Update currentView when initialView prop changes (sidebar navigation)
    useEffect(() => {
        setCurrentView(initialView);
    }, [initialView]);
    const [selectedSection, setSelectedSection] = useState<Section | undefined>();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | undefined>();
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>();
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);

    // Mock data - will be replaced with API calls
    const [rubrics] = useState<Rubric[]>([
        {
            id: '1',
            title: 'Essay Grading Rubric',
            description: 'Standard rubric for essays',
            totalPoints: 100,
            criteria: [
                {
                    id: '1',
                    name: 'Content Quality',
                    description: 'Depth and relevance',
                    weight: 40,
                    levels: [
                        { id: '1', name: 'Excellent', description: 'Outstanding', points: 4 },
                        { id: '2', name: 'Good', description: 'Strong', points: 3 },
                        { id: '3', name: 'Fair', description: 'Adequate', points: 2 },
                        { id: '4', name: 'Poor', description: 'Weak', points: 1 }
                    ]
                }
            ]
        }
    ]);

    const [sections] = useState<Section[]>([
        {
            id: '1',
            name: 'English 101 - Period 1',
            description: 'Introduction to English Literature',
            subject: 'English',
            gradeLevel: '9th Grade',
            schedule: 'Mon, Wed, Fri 8:00-9:00 AM',
            students: [],
            createdAt: '2025-01-10',
            updatedAt: '2025-01-20'
        }
    ]);

    const handleCreateSection = () => {
        console.log('Create section');
        // TODO: Show section creation form
    };

    const handleEditSection = (section: Section) => {
        console.log('Edit section:', section);
        // TODO: Show section edit form
    };

    const handleViewSection = (section: Section) => {
        setSelectedSection(section);
        setCurrentView('section-detail');
    };

    const handleAddStudents = (studentIds: string[]) => {
        console.log('Adding students:', studentIds);
        // TODO: API call to add students
        setShowAddStudentModal(false);
    };

    const handleCreateAssignment = () => {
        setSelectedAssignment(undefined);
        setCurrentView('assignment-create');
    };

    const handleSaveAssignment = (assignment: Assignment) => {
        console.log('Saving assignment:', assignment);
        // TODO: API call to save assignment
        alert(`Assignment "${assignment.title}" ${assignment.status === 'published' ? 'published' : 'saved as draft'}!`);
        setCurrentView('assignments');
    };

    const renderContent = () => {
        switch (currentView) {
            case 'rubrics':
                return <RubricManager />;

            case 'sections':
                return (
                    <SectionManager
                        onCreateSection={handleCreateSection}
                        onEditSection={handleEditSection}
                        onViewSection={handleViewSection}
                    />
                );

            case 'section-detail':
                if (!selectedSection) {
                    setCurrentView('sections');
                    return null;
                }
                return (
                    <>
                        <SectionDetail
                            section={selectedSection}
                            onBack={() => setCurrentView('sections')}
                            onEdit={() => handleEditSection(selectedSection)}
                            onAddStudent={() => setShowAddStudentModal(true)}
                        />
                        <AddStudentModal
                            isOpen={showAddStudentModal}
                            onClose={() => setShowAddStudentModal(false)}
                            onAddStudents={handleAddStudents}
                            sectionName={selectedSection.name}
                        />
                    </>
                );

            case 'assignments':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Assignments
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Create and manage assignments
                                </p>
                            </div>
                            <button
                                onClick={handleCreateAssignment}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Assignment
                            </button>
                        </div>
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-600 dark:text-gray-400">
                                No assignments yet. Create your first assignment to get started.
                            </p>
                        </div>
                    </div>
                );

            case 'assignment-create':
                return (
                    <AssignmentCreator
                        initialAssignment={selectedAssignment}
                        availableRubrics={rubrics}
                        availableSections={sections}
                        onSave={handleSaveAssignment}
                        onCancel={() => setCurrentView('assignments')}
                    />
                );

            case 'grader':
                return (
                    <QuickGrader
                        assignmentTitle="Essay on Climate Change"
                        rubric={rubrics[0]}
                        onBack={() => setCurrentView('assignments')}
                    />
                );

            case 'gradebook':
                return (
                    <Gradebook
                        sectionId="1"
                        sectionName="English 101 - Period 1"
                        onQuickGrade={(assignmentId) => {
                            setSelectedAssignmentId(assignmentId);
                            setCurrentView('grader');
                        }}
                        onViewStudent={(studentId) => console.log('View student:', studentId)}
                    />
                );

            case 'assignment-grade':
                return (
                    <AssignmentGradeView
                        assignmentId="1"
                        assignmentTitle="Essay on Climate Change"
                        totalPoints={100}
                        dueDate="January 20, 2025"
                        onBack={() => setCurrentView('gradebook')}
                        onQuickGrade={() => setCurrentView('grader')}
                        onGradeSubmission={(submissionId) => console.log('Grade:', submissionId)}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            {currentView !== 'section-detail' && currentView !== 'assignment-create' && currentView !== 'assignment-grade' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                    <div className="flex space-x-2 overflow-x-auto">
                        <button
                            onClick={() => setCurrentView('sections')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                currentView === 'sections'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Sections
                        </button>
                        <button
                            onClick={() => setCurrentView('assignments')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                currentView === 'assignments'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Assignments
                        </button>
                        <button
                            onClick={() => setCurrentView('gradebook')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                currentView === 'gradebook'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Gradebook
                        </button>
                        <button
                            onClick={() => setCurrentView('rubrics')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                currentView === 'rubrics'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Rubrics
                        </button>
                        <button
                            onClick={() => setCurrentView('grader')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                currentView === 'grader'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            QuickGrader
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {renderContent()}
        </div>
    );
};

export default Phase2Hub;

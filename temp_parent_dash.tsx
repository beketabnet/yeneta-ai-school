import React, { useState, useEffect } from 'react';
import { ChildSummary, User, Course } from '../../types';
import AtAGlance from '../parent/AtAGlance';
import CommunicationLog from '../parent/CommunicationLog';
import AIPolicy from '../parent/AIPolicy';
import { ChartBarIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, BookOpenIcon } from '../icons/Icons';
import { apiService } from '../../services/apiService';
import LinkChild from '../parent/LinkChild';

type Tab = 'glance' | 'grades' | 'communication' | 'policy';

const ParentDashboard: React.FC = () => {
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('glance');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [childGrades, setChildGrades] = useState<Course[]>([]);
    const [gradesLoading, setGradesLoading] = useState(false);

    const fetchChildren = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let fetchedChildren: ChildSummary[] = [];
            
            try {
                const linkedStudents = await apiService.getParentLinkedStudents();
                fetchedChildren = linkedStudents.map((student: any) => ({
                    id: student.id,
                    name: student.name,
                    grade: student.grade,
                    overall_progress: 0,
                    upcoming_assignments: [],
                    recent_alerts_count: 0
                }));
            } catch (err) {
                console.error('Could not fetch linked students, falling back to traditional parent-child relationship:', err);
                fetchedChildren = await apiService.getMyChildren();
            }
            
            setChildren(fetchedChildren);
            if (fetchedChildren.length > 0) {
                setSelectedChildId(fetchedChildren[0].id);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load your children's data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedChildId) {
            fetchChildGrades(selectedChildId);
        }
    }, [selectedChildId]);

    const fetchChildGrades = async (childId: number) => {
        setGradesLoading(true);
        try {
            const grades = await apiService.getParentChildGrades(childId);
            setChildGrades(grades);
        } catch (err) {
            console.error('Failed to fetch child grades:', err);
            setChildGrades([]);
        } finally {
            setGradesLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const selectedChild = children.find(c => c.id === selectedChildId);

    const tabs = [
        { id: 'glance', label: 'At-a-Glance Status', icon: <ChartBarIcon /> },
        { id: 'grades', label: 'Courses & Grades', icon: <BookOpenIcon /> },
        { id: 'communication', label: 'Communication Log', icon: <ChatBubbleLeftRightIcon /> },
        { id: 'policy', label: 'AI Use Policy', icon: <ShieldCheckIcon /> },
    ];

    const renderGradesTab = () => {
        if (gradesLoading) {
            return <p className="text-center text-gray-500">Loading grades...</p>;
        }

        if (childGrades.length === 0) {
            return <p className="text-center text-gray-500">No course grades available yet.</p>;
        }

        return (
            <div className="space-y-6">
                {childGrades.map((course) => (
                    <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {course.teacher_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-primary dark:text-secondary">{course.overall_grade.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">Overall Grade</p>
                            </div>
                        </div>

                        {course.units && course.units.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300">Units</h4>
                                {course.units.map((unit) => (
                                    <div key={unit.id} className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <h5 className="font-medium text-gray-800 dark:text-gray-200">{unit.title}</h5>
                                            <span className="text-sm font-semibold text-primary dark:text-secondary">{unit.unit_grade.toFixed(1)}%</span>
                                        </div>

                                        {unit.items && unit.items.length > 0 && (
                                            <div className="space-y-2">
                                                {unit.items.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">{item.title}</span>
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.score}/{item.max_score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };
    
    const renderContent = () => {
        if (!selectedChild) return null;
        switch (activeTab) {
            case 'glance':
                return <AtAGlance child={selectedChild} />;
            case 'grades':
                return renderGradesTab();
            case 'communication':
                return <CommunicationLog />;
            case 'policy':
                return <AIPolicy />;
            default:
                return <AtAGlance child={selectedChild} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading your dashboard...</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>;
    }

    if (children.length === 0) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Parent/Guardian Dashboard</h1>
                <LinkChild onChildLinked={fetchChildren} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Parent/Guardian Dashboard</h1>

            {/* Child Selector */}
            <div>
                <label htmlFor="child-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Viewing Dashboard For</label>
                <select 
                    id="child-selector"
                    value={selectedChildId || ''} 
                    onChange={(e) => setSelectedChildId(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {children.map(child => (
                        <option key={child.id} value={child.id}>{child.name} - {child.grade}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 -mb-px text-sm font-medium focus:outline-none transition-colors
                        ${activeTab === tab.id
                            ? 'border-b-2 border-primary text-primary dark:text-secondary dark:border-secondary'
                            : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ParentDashboard;
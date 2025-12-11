import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import ParentDashboardOverview from './ParentDashboardOverview';
import { ChildSummary, User, Course } from '../../types';
import AtAGlance from '../parent/AtAGlance';
import CommunicationLog from '../parent/CommunicationLog';
import AIPolicy from '../parent/AIPolicy';
import ParentEnrolledSubjectsEnhancedV2 from '../parent/ParentEnrolledSubjectsEnhancedV2';
import ChildSelectorDropdown from '../parent/ChildSelectorDropdown';
import EnhancedStudentSelector from '../common/EnhancedStudentSelector';
import ParentCoursesAndGradesEnhanced from '../parent/ParentCoursesAndGradesEnhanced';
import {
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    BookOpenIcon,
    AcademicCapIcon,
    HomeIcon,
    Bars3Icon,
    XMarkIcon,
    SparklesIcon
} from '../icons/Icons';
import { apiService } from '../../services/apiService';
import eventService, { EVENTS } from '../../services/eventService';
import LinkChild from '../parent/LinkChild';
import { useDashboard } from '../../contexts/DashboardContext';
import ProfileCompletionWidget from '../common/ProfileCompletionWidget';
import { View } from '../../App';

interface ParentDashboardProps {
    setView?: (view: View) => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ setView }) => {
    const { user } = useContext(AuthContext);
    const { activeTab, setActiveTab, setTabs } = useDashboard();
    const [children, setChildren] = useState<ChildSummary[]>([]);
    interface DashboardOption {
        id: number;
        name: string;
        studentId: number | null;
        subject: string | null;
        grade?: string;
        grade_level?: string;
    }

    const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([]);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [preSelectedSubject, setPreSelectedSubject] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (user?.account_status !== 'Active') {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Parent/Guardian Dashboard</h1>
                <ProfileCompletionWidget setView={setView} />
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                        Your account is currently <span className="font-bold">{user?.account_status}</span>. Please complete your profile or wait for administrator approval to access the dashboard features.
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        setTabs([
            { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
            { id: 'glance', label: 'At-a-Glance Status', icon: <ChartBarIcon /> },
            { id: 'grades', label: 'Courses & Grades', icon: <BookOpenIcon /> },
            { id: 'enrolled-subjects', label: 'Enrolled Subjects', icon: <AcademicCapIcon /> },
            { id: 'communication', label: 'Communication Log', icon: <ChatBubbleLeftRightIcon /> },
            { id: 'policy', label: 'AI Use Policy', icon: <ShieldCheckIcon /> },
        ]);
    }, [setTabs]);

    // Local tabs for immediate rendering
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
        { id: 'glance', label: 'At-a-Glance Status', icon: <ChartBarIcon /> },
        { id: 'grades', label: 'Courses & Grades', icon: <BookOpenIcon /> },
        { id: 'enrolled-subjects', label: 'Enrolled Subjects', icon: <AcademicCapIcon /> },
        { id: 'communication', label: 'Communication Log', icon: <ChatBubbleLeftRightIcon /> },
        { id: 'policy', label: 'AI Use Policy', icon: <ShieldCheckIcon /> },
    ];

    // Set default tab to 'overview' if current tab is invalid
    useEffect(() => {
        if (!tabs.find(t => t.id === activeTab)) {
            setActiveTab('overview');
        }
    }, [activeTab, setActiveTab, tabs]);

    const fetchChildren = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch both linked students and enrolled subjects
            const [linkedStudents, enrolledSubjectsData] = await Promise.all([
                apiService.getParentLinkedStudents(),
                apiService.getParentEnrolledSubjects()
            ]);

            // Process children for general use
            const fetchedChildren = linkedStudents.map((student: any) => ({
                id: student.id,
                name: student.first_name && student.last_name
                    ? `${student.first_name} ${student.last_name}`
                    : student.username || 'Unknown Student',
                grade: student.grade_level || student.grade || 'N/A',
                overall_progress: 0,
                upcoming_assignments: [],
                recent_alerts_count: 0,
                progressTrend: []
            }));

            setChildren(fetchedChildren);

            // Process enrolled subjects to identify unique students
            const uniqueStudentsMap = new Map<number, { name: string, grade: string }>();

            // Iterate through families in the response
            const families = Array.isArray(enrolledSubjectsData) ? enrolledSubjectsData : Object.values(enrolledSubjectsData);

            families.forEach((family: any) => {
                if (family.students) {
                    const studentsList = Array.isArray(family.students) ? family.students : Object.values(family.students);

                    studentsList.forEach((student: any) => {
                        if (!uniqueStudentsMap.has(student.student_id)) {
                            // Use Linked Student data for name if available for better formatting, else data from enrollment
                            const linkedStudent = fetchedChildren.find(c => c.id === student.student_id);
                            uniqueStudentsMap.set(student.student_id, {
                                name: linkedStudent ? linkedStudent.name : student.student_name,
                                grade: student.grade_level || (linkedStudent ? linkedStudent.grade : 'N/A')
                            });
                        }
                    });
                }
            });

            // If we have linked students that don't have enrollments yet, we should still show them
            fetchedChildren.forEach(child => {
                if (!uniqueStudentsMap.has(child.id)) {
                    uniqueStudentsMap.set(child.id, {
                        name: child.name,
                        grade: child.grade
                    });
                }
            });

            const options: DashboardOption[] = [];

            // Add "All Students" option
            options.push({
                id: -1,
                name: "All Students",
                studentId: null,
                subject: null,
                grade: undefined
            });

            uniqueStudentsMap.forEach((data, id) => {
                const label = data.grade && data.grade !== 'N/A'
                    ? `${data.name} - ${data.grade}`
                    : data.name;

                options.push({
                    id: id,
                    name: label,
                    studentId: id,
                    subject: null,
                    grade: data.grade
                });
            });

            setDashboardOptions(options);

            if (options.length > 0) {
                // Select "All Students" by default
                setSelectedOptionId(-1);
                setSelectedChildId(null);
                setPreSelectedSubject(null);
            } else if (fetchedChildren.length > 0) {
                // Fallback if no enrollments found but children exist
                setSelectedChildId(fetchedChildren[0].id);
            }
        } catch (err) {
            console.error(err);
            // Fallback to just children if enrolled subjects fails
            try {
                const fetchedChildren = await apiService.getMyChildren();
                setChildren(fetchedChildren);
                if (fetchedChildren.length > 0) {
                    setSelectedChildId(fetchedChildren[0].id);
                }
            } catch (e) {
                setError("Failed to load your children's data. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const selectedChild = children.find(c => c.id === selectedChildId);

    const handleOptionSelect = (optionId: number) => {
        if (optionId === -1) {
            setSelectedOptionId(optionId);
            setSelectedChildId(null);
            setPreSelectedSubject(null);
            return;
        }

        const option = dashboardOptions.find(o => o.id === optionId);
        if (option) {
            setSelectedOptionId(optionId);
            setSelectedChildId(option.studentId);
            setPreSelectedSubject(null); // Reset subject when switching students
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <ParentDashboardOverview setActiveTab={setActiveTab} currentUser={user} selectedChild={selectedChild} />;
            case 'glance':
                if (!selectedChild && selectedOptionId !== -1) return null;
                if (!selectedChild) {
                    if (children.length > 0) return <AtAGlance child={children[0]} />;
                    return null;
                }
                return <AtAGlance child={selectedChild} />;
            case 'grades':
                return <ParentCoursesAndGradesEnhanced selectedChildId={selectedChildId} preSelectedSubject={preSelectedSubject} />;
            case 'enrolled-subjects':
                return <ParentEnrolledSubjectsEnhancedV2 selectedChildId={selectedChildId} />;
            case 'communication':
                return <CommunicationLog />;
            case 'policy':
                return <AIPolicy />;
            default:
                return null;
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
                <ProfileCompletionWidget setView={setView} />
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">No Students Linked</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't linked any students to your account yet.</p>
                    {setView && (
                        <button
                            onClick={() => setView('linkStudent')}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                        >
                            Link Student
                        </button>
                    )}
                    {/* Fallback if setView is not provided */}
                    {!setView && <LinkChild onChildLinked={fetchChildren} />}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10" />
            <div className="fixed bottom-0 right-0 w-full h-96 bg-gradient-to-tl from-blue-500/10 via-teal-500/10 to-green-500/10 blur-3xl -z-10" />

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200">
                        Family Portal
                    </h1>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
                            <button
                                type="button"
                                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10">
                                <div className="space-y-2 py-6">
                                    {/* Mobile Child Selector Placeholder - Could be enhanced later */}
                                    <div className="px-3 mb-4">
                                        <EnhancedStudentSelector
                                            students={dashboardOptions.length > 0 ? dashboardOptions : children.map(child => ({
                                                id: child.id,
                                                name: child.name,
                                                grade: child.grade,
                                                grade_level: child.grade
                                            }))}
                                            selectedStudentId={dashboardOptions.length > 0 ? selectedOptionId : selectedChildId}
                                            onSelect={(id) => {
                                                if (dashboardOptions.length > 0) handleOptionSelect(id);
                                                else setSelectedChildId(id);
                                                setMobileMenuOpen(false);
                                            }}
                                            label="Viewing For"
                                            placeholder="Select student..."
                                        />
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                                ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-900 dark:text-white'}
                                            `}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                                        <ProfileCompletionWidget setView={setView} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Desktop Header & Nav */}
                <div className="hidden lg:block mb-8">
                    <div className="flex justify-between items-start mb-8 gap-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2 relative inline-block">
                                Parent Guardian Portal
                                <span className="absolute -bottom-2 left-0 w-1/3 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                                Monitor progress, manage learning, and stay connected.
                            </p>
                        </div>

                        <div className="flex-1 max-w-md">
                            {/* Child Selector - In header for quick access */}
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-sm relative z-50">
                                <EnhancedStudentSelector
                                    students={dashboardOptions.length > 0 ? dashboardOptions : children.map(child => ({
                                        id: child.id,
                                        name: child.name,
                                        grade: child.grade,
                                        grade_level: child.grade
                                    }))}
                                    selectedStudentId={dashboardOptions.length > 0 ? selectedOptionId : selectedChildId}
                                    onSelect={dashboardOptions.length > 0 ? handleOptionSelect : setSelectedChildId}
                                    label=""
                                    placeholder="Select a student..."
                                />
                            </div>
                        </div>

                        <div className="w-auto flex justify-end">
                            <ProfileCompletionWidget setView={setView} />
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 overflow-x-auto">
                        <nav className="flex space-x-1" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center px-5 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-300 ease-out
                                            ${isActive
                                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-md transform scale-[1.02] ring-1 ring-black/5 dark:ring-white/10'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <span className={`mr-2.5 transition-colors duration-300 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {selectedChild && activeTab !== 'overview' && (
                    <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fadeIn">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            Viewing <span className="font-semibold">{selectedChild.name}'s</span> dashboard
                            {preSelectedSubject && <span className="font-semibold"> - {preSelectedSubject}</span>}
                        </p>
                    </div>
                )}

                <main className="transition-all duration-500 ease-in-out">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default ParentDashboard;
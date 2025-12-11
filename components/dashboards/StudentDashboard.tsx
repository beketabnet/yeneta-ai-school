import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import StudentDashboardOverview from './StudentDashboardOverview';
import AITutor from '../student/AITutor';
import GradebookView from '../student/GradebookView';
import PracticeLabs from '../student/PracticeLabs';
import CodeEditor from '../student/CodeEditor';
import AvailableCourses from '../student/AvailableCourses';
import StudentEnrollmentManager from '../student/StudentEnrollmentManager';
import StudentCoursesAndGrades from '../student/StudentCoursesAndGrades';
import StudentEnrolledSubjects from '../student/StudentEnrolledSubjects';
import FeedbackDelivery from '../student/FeedbackDelivery';
import StudentQuizList from '../student/StudentQuizList';
import StudentCommunicationLog from '../student/CommunicationLog';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
    ChatBubbleLeftRightIcon,
    AcademicCapIcon,
    BeakerIcon,
    CodeBracketIcon,
    UserGroupIcon,
    SparklesIcon,
    ChartBarIcon,
    BookOpenIcon,
    PaperAirplaneIcon,
    PencilIcon,
    ChatBubbleLeftEllipsisIcon,
    Bars3Icon,
    XMarkIcon,
    HomeIcon
} from '../icons/Icons';
import { useDashboard } from '../../contexts/DashboardContext';

import ProfileCompletionWidget from '../common/ProfileCompletionWidget';

import { View } from '../../App';

interface StudentDashboardProps {
    setView?: (view: View) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ setView }) => {
    const { user } = useContext(AuthContext);
    const { activeTab, setActiveTab, setTabs } = useDashboard();
    const currentUser = useCurrentUser();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Local tabs for immediate rendering
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
        { id: 'tutor', label: '24/7 AI Tutor', icon: <ChatBubbleLeftRightIcon /> },
        { id: 'quizzes', label: 'Online Quizzes', icon: <PencilIcon /> },
        { id: 'grades', label: 'Gradebook', icon: <AcademicCapIcon /> },
        { id: 'courses-grades', label: 'Courses & Grades', icon: <ChartBarIcon /> },
        { id: 'enrolled-subjects', label: 'Enrolled Subjects', icon: <BookOpenIcon /> },
        { id: 'labs', label: 'Practice Labs', icon: <BeakerIcon /> },
        { id: 'code', label: 'Code Editor', icon: <CodeBracketIcon /> },
        { id: 'available-courses', label: 'Available Courses', icon: <SparklesIcon /> },
        { id: 'my-enrollments', label: 'My Enrollments', icon: <UserGroupIcon /> },
        { id: 'communication', label: 'Communication Log', icon: <ChatBubbleLeftEllipsisIcon /> },
        { id: 'feedback', label: 'Send Feedback', icon: <PaperAirplaneIcon /> },
    ];

    useEffect(() => {
        setTabs(tabs);
    }, [setTabs]);

    if (user?.account_status !== 'Active') {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Personalized Learning Hub</h1>
                    <p className="mt-1 sm:mt-0 text-md text-gray-600 dark:text-gray-300">
                        Welcome back, {currentUser?.full_name || 'Student'}!
                    </p>
                </div>
                <ProfileCompletionWidget setView={setView} />
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                        Your account is currently <span className="font-bold">{user?.account_status}</span>. Please complete your profile or wait for administrator approval to access the dashboard features.
                    </p>
                </div>
            </div>
        );
    }


    // Set default tab to 'overview' if current tab is invalid
    useEffect(() => {
        if (!tabs.find(t => t.id === activeTab)) {
            setActiveTab('overview');
        }
    }, [activeTab, setActiveTab, tabs]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <StudentDashboardOverview setActiveTab={setActiveTab} currentUser={currentUser} />;
            case 'tutor':
                return <AITutor />;
            case 'quizzes':
                return <StudentQuizList />;
            case 'grades':
                return <GradebookView />;
            case 'courses-grades':
                return <StudentCoursesAndGrades />;
            case 'enrolled-subjects':
                return <StudentEnrolledSubjects />;
            case 'labs':
                return <PracticeLabs />;
            case 'code':
                return <CodeEditor />;
            case 'available-courses':
                return <AvailableCourses />;
            case 'my-enrollments':
                return <StudentEnrollmentManager />;
            case 'communication':
                return <StudentCommunicationLog />;
            case 'feedback':
                return <FeedbackDelivery />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">My Learning Hub</h1>
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                                ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-900 dark:text-white'}
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
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-violet-600 dark:from-emerald-400 dark:to-violet-400">
                                Personalized Learning Hub
                            </h1>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Master your subjects with AI-powered tools</p>
                        </div>
                        <div className="w-1/3">
                            <ProfileCompletionWidget setView={setView} />
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <nav className="flex space-x-1" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200
                                            ${isActive
                                                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <span className={`mr-2 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <main className="transition-all duration-500 ease-in-out">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;
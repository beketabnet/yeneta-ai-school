import React, { useState } from 'react';
import type { UserInfo } from '../services/apiService';
import type { LessonPlan, LessonResult, UserStats } from '../types';

// Import role-specific dashboards
import StudentDashboard from './dashboards/StudentDashboard';
import EnhancedTeacherDashboard from './dashboards/EnhancedTeacherDashboard';
import EnhancedAdminDashboard from './dashboards/EnhancedAdminDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import StaffDashboard from './dashboards/StaffDashboard';

// Import AI Teacher components
import LessonPlanner from './LessonPlanner';

// Import new KIRA-inspired components
import EnhancedSidebar from './EnhancedSidebar';
import QuickReferenceDashboard from './QuickReferenceDashboard';
import ContentLibrary from './ContentLibrary';
import Phase2Hub from './Phase2Hub';
import ManagementHub from './manage/ManagementHub';
import AIToolsHub from './ai-tools/AIToolsHub';
import LiveSummary from './LiveSummary';
import UserProfile from './profile/UserProfile';
import type { Resource } from './ContentLibrary';

// Import course management components
import CourseApprovalQueue from './courses/CourseApprovalQueue';
import MyCourses from './courses/MyCourses';
import BrowseCourses from './courses/BrowseCourses';
import CourseForm from './courses/CourseForm';

// Import classroom components
import ClassroomList from './classrooms/ClassroomList';
import JoinClassroomModal from './classrooms/JoinClassroomModal';
import CollaborativeClassroom from './classrooms/CollaborativeClassroom';
import EnhancedClassroomView from './classrooms/EnhancedClassroomView';

interface DashboardRouterProps {
    userInfo: UserInfo;
    userStats: UserStats;
    onLessonPlanGenerated: (plan: LessonPlan) => void;
    lessonHistory: LessonResult[];
    onViewReport: (result: LessonResult) => void;
    onClearHistory: () => void;
}

// Helper function to get initial path based on role
const getInitialPathForRole = (role: string, userId: number): string => {
    // Guest users go directly to lesson creation
    if (userId === 0 || role === 'guest') {
        return '/create/lesson';
    }

    // All registered users start at their dashboard
    return '/dashboard';
};

const DashboardRouter: React.FC<DashboardRouterProps> = ({
    userInfo,
    userStats,
    onLessonPlanGenerated,
    lessonHistory,
    onViewReport,
    onClearHistory
}) => {
    const [currentPath, setCurrentPath] = useState<string>(() => getInitialPathForRole(userInfo.role, userInfo.id));
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showJoinClassroomModal, setShowJoinClassroomModal] = useState(false);

    const handleNavigate = (path: string) => {
        console.log('DashboardRouter handleNavigate called with path:', path);
        console.log('Current path before:', currentPath);
        setCurrentPath(path);
        console.log('Current path after setCurrentPath:', path);
    };

    const handleCreateResource = (type: string) => {
        // Navigate to appropriate creation page based on type
        if (type === 'lesson') {
            // Redirect to Teacher Dashboard AI Teaching Assistant
            setCurrentPath('/dashboard');
            // Note: The teacher dashboard will need to be told to open AI Assistant tab
            // This is handled by the EnhancedTeacherDashboard component
        } else if (type === 'assignment') {
            setCurrentPath('/create/assignment');
        }
    };

    const handleResourceSelect = (resource: Resource) => {
        console.log('Selected resource:', resource);
        // Handle resource selection - could open in modal or navigate to detail page
    };

    // Render content based on current path
    const renderContent = () => {
        console.log('=== DashboardRouter renderContent ===');
        console.log('Current path:', currentPath);
        console.log('User role:', userInfo.role);

        // Home/Quick Reference Dashboard (Teachers/Guides ONLY)
        if (currentPath === '/home') {
            // Only teachers/guides see AI tools, everyone else sees their dashboard
            if (userInfo.role !== 'guide') {
                return renderRoleBasedDashboard();
            }
            return <QuickReferenceDashboard userInfo={userInfo} onNavigate={handleNavigate} />;
        }

        // Content Library
        if (currentPath === '/library') {
            return (
                <ContentLibrary
                    userRole={userInfo.role}
                    onCreateNew={handleCreateResource}
                    onResourceSelect={handleResourceSelect}
                />
            );
        }

        // Dashboard - Route to role-specific dashboard
        if (currentPath === '/dashboard') {
            return renderRoleBasedDashboard();
        }

        // Course Approval Queue (Admin only)
        if (currentPath === '/course-approvals') {
            if (userInfo.role !== 'administrator') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only administrators can access course approvals.</p>
                        </div>
                    </div>
                );
            }
            return <CourseApprovalQueue />;
        }

        // My Courses (Guide only)
        if (currentPath === '/my-courses') {
            if (userInfo.role !== 'guide') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only guides can manage courses.</p>
                        </div>
                    </div>
                );
            }
            return <MyCourses
                onCreateClassroom={(classroomId) => {
                    // Navigate to the newly created classroom
                    setCurrentPath(`/classroom/${classroomId}`);
                }}
                onNavigate={(path) => setCurrentPath(path)}
            />;
        }

        // Create/Edit Course
        if (currentPath === '/create-course' || currentPath === '/create/course' || currentPath.startsWith('/edit-course/')) {
            if (userInfo.role !== 'guide') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only guides can create courses.</p>
                        </div>
                    </div>
                );
            }
            const courseId = currentPath.startsWith('/edit-course/') ? currentPath.split('/')[2] : undefined;
            return (
                <div className="max-w-4xl mx-auto p-6">
                    <CourseForm
                        course={courseId ? { id: courseId } as any : undefined}
                        onSuccess={() => setCurrentPath('/my-courses')}
                        onCancel={() => setCurrentPath('/my-courses')}
                    />
                </div>
            );
        }

        // Browse Courses (Student only)
        if (currentPath === '/browse-courses') {
            if (userInfo.role !== 'student') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only students can browse courses.</p>
                        </div>
                    </div>
                );
            }
            return <BrowseCourses onJoinClassroom={(courseId) => {
                console.log('Join classroom for course:', courseId);
                // Navigate to classroom joining in the future
                setCurrentPath('/my-classrooms');
            }} />;
        }

        // Classrooms List
        if (currentPath === '/classrooms') {
            const userRole = userInfo.role === 'guide' ? 'guide' : 'student';
            return (
                <>
                    <ClassroomList
                        userRole={userRole}
                        onClassroomClick={(classroomId) => setCurrentPath(`/classroom/${classroomId}`)}
                        onJoinClick={userRole === 'student' ? () => setShowJoinClassroomModal(true) : undefined}
                        onNavigate={handleNavigate}
                    />
                    {showJoinClassroomModal && (
                        <JoinClassroomModal
                            onClose={() => setShowJoinClassroomModal(false)}
                            onSuccess={() => {
                                setShowJoinClassroomModal(false);
                                setCurrentPath('/classrooms');
                            }}
                        />
                    )}
                </>
            );
        }

        // Individual Classroom
        if (currentPath.startsWith('/classroom/')) {
            const classroomId = currentPath.split('/')[2];
            return (
                <EnhancedClassroomView
                    classroomId={classroomId}
                    onBack={() => setCurrentPath('/classrooms')}
                />
            );
        }

        // Create Assignment - Show Phase2Hub with assignments view
        if (currentPath === '/create-assignment') {
            return <Phase2Hub initialView="assignments" />;
        }

        // Create routes (Students and Teachers/Guides can access AI Teacher)
        if (currentPath === '/create/lesson') {
            // Both students and guides can access AI Teacher
            // Students get RAG-enhanced learning (use_rag_ai=true), guests get standard AI
            if (userInfo.role !== 'guide' && userInfo.role !== 'student') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only students and teachers can access the AI Teacher.</p>
                        </div>
                    </div>
                );
            }
            // Render AI Teacher lesson planner
            // Students will have RAG enabled (access to curriculum documents)
            // This is handled in LessonPlanner and VirtualClassroom components
            return (
                <LessonPlanner
                    userStats={userStats}
                    userInfo={userInfo}
                    isGuest={false} // Authenticated users - will use RAG for students
                    onLessonPlanGenerated={onLessonPlanGenerated}
                    lessonHistory={lessonHistory}
                    onViewReport={onViewReport}
                    onClearHistory={onClearHistory}
                />
            );
        }

        if (currentPath === '/create/ai-tools') {
            if (userInfo.role !== 'guide') {
                return renderRoleBasedDashboard();
            }
            return <AIToolsHub />;
        }

        // AI Tools routes (Teachers/Guides ONLY)
        if (currentPath.startsWith('/ai-tools/')) {
            if (userInfo.role !== 'guide') {
                return renderRoleBasedDashboard();
            }
        }

        if (currentPath === '/ai-tools/chatpods') {
            return <AIToolsHub initialView="chatpods" />;
        }

        if (currentPath === '/ai-tools/lesson-planner') {
            return <AIToolsHub initialView="lesson-planner" />;
        }

        if (currentPath === '/ai-tools/content-generator') {
            return <AIToolsHub initialView="content-generator" />;
        }

        if (currentPath === '/ai-tools/quiz-builder') {
            return <AIToolsHub initialView="quiz-builder" />;
        }

        if (currentPath === '/ai-tools/study-guide') {
            return <AIToolsHub initialView="study-guide" />;
        }

        if (currentPath === '/ai-tools/plagiarism-checker') {
            return <AIToolsHub initialView="plagiarism-checker" />;
        }

        // Phase 2 Features - Manage routes
        if (currentPath === '/manage/sections') {
            return <ManagementHub initialView="sections" userRole={userInfo.role} />;
        }

        if (currentPath === '/manage/students') {
            return <ManagementHub initialView="students" userRole={userInfo.role} />;
        }

        if (currentPath === '/manage/assignments') {
            return <ManagementHub initialView="assignments" userRole={userInfo.role} />;
        }

        // Phase 2 Features - Create routes
        if (currentPath === '/create/assignment') {
            return <Phase2Hub initialView="assignments" />;
        }

        if (currentPath === '/create/rubric') {
            return <Phase2Hub initialView="rubrics" />;
        }

        // Phase 2 Features - Evaluate routes
        if (currentPath === '/evaluate/grade') {
            return <Phase2Hub initialView="grader" />;
        }

        if (currentPath === '/evaluate/quickgrader') {
            return <Phase2Hub initialView="grader" />;
        }

        if (currentPath === '/evaluate/gradebook') {
            return <Phase2Hub initialView="gradebook" />;
        }

        if (currentPath === '/evaluate/rubrics') {
            return <Phase2Hub initialView="rubrics" />;
        }

        // Live Summary route
        if (currentPath === '/analytics/live-summary') {
            return <LiveSummary />;
        }

        // System Analytics route (Admin only)
        if (currentPath === '/analytics/system') {
            if (userInfo.role !== 'administrator') {
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
                            <p className="text-red-600 dark:text-red-300">Only administrators can access system analytics.</p>
                        </div>
                    </div>
                );
            }
            return <EnhancedAdminDashboard />;
        }

        // Profile route
        if (currentPath === '/profile') {
            return (
                <UserProfile
                    userName={userInfo.name || userInfo.first_name && userInfo.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : userInfo.username}
                    userEmail={userInfo.email}
                    userRole={userInfo.role}
                    onBack={() => setCurrentPath('/home')}
                />
            );
        }

        // Settings route
        if (currentPath === '/settings') {
            return (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
                        </div>
                        <button onClick={() => setCurrentPath('/home')} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            ← Back
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h3>
                        <p className="text-gray-600 dark:text-gray-400">Settings page coming soon...</p>
                    </div>
                </div>
            );
        }

        // Notifications route
        if (currentPath === '/notifications') {
            return (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage your notifications</p>
                        </div>
                        <button onClick={() => setCurrentPath('/home')} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            ← Back
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Notifications</h3>
                        <p className="text-gray-600 dark:text-gray-400">No new notifications</p>
                    </div>
                </div>
            );
        }

        // Privacy route
        if (currentPath === '/privacy') {
            return (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Security</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your privacy and security settings</p>
                        </div>
                        <button onClick={() => setCurrentPath('/home')} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            ← Back
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
                        <p className="text-gray-600 dark:text-gray-400">Privacy settings coming soon...</p>
                    </div>
                </div>
            );
        }

        // Placeholder for other future routes (MUST be after specific routes)
        if (currentPath.startsWith('/evaluate/') ||
            currentPath.startsWith('/manage/')) {
            return (
                <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                            Coming Soon
                        </h2>
                        <p className="text-blue-700 dark:text-blue-300 mb-4">
                            This feature is currently under development and will be available in the next update.
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Current path: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{currentPath}</code>
                        </p>
                        <button
                            onClick={() => setCurrentPath('/home')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            );
        }

        // Settings
        if (currentPath === '/settings') {
            return (
                <div className="max-w-4xl mx-auto p-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Settings</h1>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <p className="text-gray-600 dark:text-gray-400">Settings panel coming soon...</p>
                    </div>
                </div>
            );
        }

        // Help
        if (currentPath === '/help') {
            return (
                <div className="max-w-4xl mx-auto p-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Help & Support</h1>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <p className="text-gray-600 dark:text-gray-400">Help documentation coming soon...</p>
                    </div>
                </div>
            );
        }

        // Default to home
        return <QuickReferenceDashboard userInfo={userInfo} onNavigate={handleNavigate} />;
    };

    // Handler for Start AI Learning button
    const handleStartAILearning = () => {
        // Navigate to lesson creation page (same as guest user flow)
        setCurrentPath('/create/lesson');
    };

    // Render role-based dashboard (existing functionality)
    const renderRoleBasedDashboard = () => {
        switch (userInfo.role) {
            case 'student':
                // Use enhanced dashboard for students with AI Teacher access
                return <StudentDashboard userInfo={userInfo} userStats={userStats} onNavigate={handleNavigate} />;

            case 'administrator':
                // Use enhanced dashboard for administrators
                return <EnhancedAdminDashboard />;

            case 'guide':
                // Use enhanced dashboard for teachers/guides
                return <EnhancedTeacherDashboard onNavigate={handleNavigate} />;

            case 'parent':
                // Parents focus on child monitoring, no AI tools
                return (
                    <ParentDashboard
                        userInfo={userInfo}
                        userStats={userStats}
                    />
                );

            case 'staff':
                // Staff focus on administrative tasks, no AI tools
                return (
                    <StaffDashboard
                        userInfo={userInfo}
                        userStats={userStats}
                    />
                );

            default:
                return (
                    <div className="max-w-2xl mx-auto p-8 text-center">
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                                Unknown User Role
                            </h2>
                            <p className="text-red-600 dark:text-red-300">
                                Your account has an unrecognized role: "{userInfo.role}".
                                Please contact an administrator for assistance.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Enhanced Sidebar */}
            <EnhancedSidebar
                currentPath={currentPath}
                onNavigate={handleNavigate}
                userRole={userInfo.role}
                userName={userInfo.name || userInfo.first_name && userInfo.last_name ? `${userInfo.first_name} ${userInfo.last_name}` : userInfo.username}
                userEmail={userInfo.email}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onLogout={() => {
                    // Clear any stored data
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        sessionStorage.clear();
                    }
                    // Reload the page to trigger App.tsx to show landing page
                    window.location.reload();
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DashboardRouter;
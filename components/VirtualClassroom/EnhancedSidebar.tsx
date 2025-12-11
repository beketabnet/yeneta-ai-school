import React, { useState } from 'react';
import {
    Home,
    LayoutDashboard,
    Library,
    Wand2,
    ClipboardCheck,
    Settings as SettingsIcon,
    Users,
    ChevronDown,
    ChevronRight,
    HelpCircle,
    User,
    Code,
    BookOpen,
    FileText,
    GraduationCap,
    UserCheck,
    ClipboardList,
    Sparkles,
    MessageSquare,
    FileCheck,
    PenTool,
    BarChart3,
    Radio,
    LogOut,
    UserCircle,
    Bell,
    Shield
} from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path?: string;
    children?: MenuItem[];
    roles?: string[];
}

interface EnhancedSidebarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    userRole: string;
    userName?: string;
    userEmail?: string;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onLogout?: () => void;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
    currentPath,
    onNavigate,
    userRole,
    userName = 'John Doe',
    userEmail = 'john.doe@school.edu',
    isCollapsed = false,
    onToggleCollapse,
    onLogout
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['create']));
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems: MenuItem[] = [
        {
            id: 'home',
            label: 'Home',
            icon: <Home size={20} />,
            path: '/home',
            roles: ['guide'] // Only guides see Home with AI tools
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            path: '/dashboard',
        },
        {
            id: 'classrooms',
            label: 'My Classrooms',
            icon: <Users size={20} />,
            path: '/classrooms',
            roles: ['guide', 'student']
        },
        {
            id: 'library',
            label: 'Library',
            icon: <Library size={20} />,
            path: '/library',
            roles: ['guide', 'staff', 'administrator']
        },
        {
            id: 'create',
            label: 'Create',
            icon: <Wand2 size={20} />,
            roles: ['guide'], // Only teachers/guides can create (AI tools)
            children: [
                {
                    id: 'ai-tools',
                    label: 'AI Tools',
                    icon: <Sparkles size={18} />,
                    path: '/create/ai-tools',
                    roles: ['guide']
                },
                {
                    id: 'course',
                    label: 'Course',
                    icon: <BookOpen size={18} />,
                    path: '/create/course',
                    roles: ['guide']
                },
                {
                    id: 'quiz',
                    label: 'Quiz',
                    icon: <ClipboardList size={18} />,
                    path: '/create/quiz',
                    roles: ['guide']
                },
                {
                    id: 'assignment',
                    label: 'Assignment',
                    icon: <FileText size={18} />,
                    path: '/create/assignment',
                    roles: ['guide']
                },
            ],
        },
        {
            id: 'evaluate',
            label: 'Evaluate',
            icon: <ClipboardCheck size={20} />,
            children: [
                {
                    id: 'gradebook',
                    label: 'Gradebook',
                    icon: <GraduationCap size={18} />,
                    path: '/evaluate/gradebook',
                    roles: ['guide', 'staff']
                },
                {
                    id: 'quickgrader',
                    label: 'Essay QuickGrader',
                    icon: <PenTool size={18} />,
                    path: '/evaluate/quickgrader',
                    roles: ['guide', 'staff']
                },
                {
                    id: 'rubrics',
                    label: 'Rubrics',
                    icon: <FileCheck size={18} />,
                    path: '/evaluate/rubrics',
                    roles: ['guide', 'staff']
                },
            ],
            roles: ['guide', 'staff']
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 size={20} />,
            children: [
                {
                    id: 'system-analytics',
                    label: 'System Analytics',
                    icon: <BarChart3 size={18} />,
                    path: '/analytics/system',
                    roles: ['administrator']
                },
                {
                    id: 'live-summary',
                    label: 'Live Summary',
                    icon: <Radio size={18} />,
                    path: '/analytics/live-summary',
                    roles: ['guide', 'staff']
                },
            ],
            roles: ['guide', 'staff', 'administrator']
        },
        {
            id: 'manage',
            label: 'Manage',
            icon: <Users size={20} />,
            children: [
                {
                    id: 'sections',
                    label: 'Sections',
                    icon: <UserCheck size={18} />,
                    path: '/manage/sections',
                    roles: ['guide', 'staff', 'administrator']
                },
                {
                    id: 'students',
                    label: 'Students',
                    icon: <Users size={18} />,
                    path: '/manage/students',
                    roles: ['guide', 'staff', 'administrator', 'parent']
                },
                {
                    id: 'assignments',
                    label: 'Assignments',
                    icon: <ClipboardList size={18} />,
                    path: '/manage/assignments',
                    roles: ['guide', 'staff']  // Removed 'administrator' - not their responsibility
                },
            ],
            roles: ['guide', 'staff', 'administrator', 'parent']
        },
    ];

    const bottomMenuItems: MenuItem[] = [
        {
            id: 'help',
            label: 'Help',
            icon: <HelpCircle size={20} />,
            path: '/help',
        },
    ];

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const hasAccess = (item: MenuItem): boolean => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.includes(userRole);
    };

    const renderMenuItem = (item: MenuItem, depth: number = 0) => {
        if (!hasAccess(item)) return null;

        const isActive = currentPath === item.path;
        const isExpanded = expandedSections.has(item.id);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={item.id}>
                <button
                    onClick={() => {
                        if (hasChildren) {
                            toggleSection(item.id);
                        } else if (item.path) {
                            onNavigate(item.path);
                        }
                    }}
                    className={`
                        w-full flex items-center justify-between px-4 py-3 text-left
                        transition-all duration-200 group
                        ${depth > 0 ? 'pl-12' : ''}
                        ${isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                    `}
                >
                    <div className="flex items-center space-x-3">
                        <span className={`
                            ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                        `}>
                            {item.icon}
                        </span>
                        {!isCollapsed && (
                            <span className="font-medium text-sm">{item.label}</span>
                        )}
                    </div>
                    {!isCollapsed && hasChildren && (
                        <span className="text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    )}
                </button>
                {!isCollapsed && hasChildren && isExpanded && (
                    <div className="bg-gray-800">
                        {item.children?.map(child => renderMenuItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`
            bg-gray-900 text-white h-screen flex flex-col
            transition-all duration-300
            ${isCollapsed ? 'w-20' : 'w-64'}
            sticky top-0
        `}>
            {/* Logo/Brand */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen size={24} className="text-white" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-lg font-bold">AI Classroom</h1>
                            <p className="text-xs text-gray-400">Virtual Learning</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {menuItems.map(item => renderMenuItem(item))}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-800">
                {bottomMenuItems.map(item => renderMenuItem(item))}
            </div>

            {/* User Profile Section */}
            <div className="border-t border-gray-800 p-3 relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-500/30">
                        <span className="text-white font-semibold text-sm">
                            {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                    </div>

                    {/* User Info */}
                    {!isCollapsed && (
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{userName}</p>
                            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                        </div>
                    )}

                    {/* Dropdown Icon */}
                    {!isCollapsed && (
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        />
                    )}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && !isCollapsed && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                        <button
                            onClick={() => {
                                onNavigate('/profile');
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                        >
                            <UserCircle size={18} className="text-gray-400" />
                            <span className="text-sm text-white">My Profile</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate('/settings');
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                        >
                            <SettingsIcon size={18} className="text-gray-400" />
                            <span className="text-sm text-white">Settings</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate('/notifications');
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                        >
                            <Bell size={18} className="text-gray-400" />
                            <span className="text-sm text-white">Notifications</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate('/privacy');
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                        >
                            <Shield size={18} className="text-gray-400" />
                            <span className="text-sm text-white">Privacy & Security</span>
                        </button>

                        <div className="border-t border-gray-700"></div>

                        <button
                            onClick={() => {
                                if (onLogout) {
                                    onLogout();
                                } else {
                                    alert('Logout functionality will be implemented');
                                }
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-900/20 transition-colors text-left"
                        >
                            <LogOut size={18} className="text-red-400" />
                            <span className="text-sm text-red-400 font-medium">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default EnhancedSidebar;

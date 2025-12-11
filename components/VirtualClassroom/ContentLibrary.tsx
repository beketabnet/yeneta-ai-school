import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    BookOpen,
    FileText,
    ClipboardList,
    File,
    Activity,
    MoreVertical,
    Copy,
    Share2,
    Trash2,
    Edit,
    Calendar
} from 'lucide-react';

export interface Resource {
    id: string;
    title: string;
    type: 'course' | 'lesson' | 'rubric' | 'document' | 'activity';
    creator: string;
    createdAt: string;
    updatedAt: string;
    isShared: boolean;
    metadata?: {
        subject?: string;
        grade?: string;
        tags?: string[];
    };
}

interface ContentLibraryProps {
    userRole?: string;
    onCreateNew?: (type: string) => void;
    onResourceSelect: (resource: Resource) => void;
    onApprove?: (resourceId: string) => void;
    onReject?: (resourceId: string) => void;
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({ 
    userRole = 'guide',
    onCreateNew, 
    onResourceSelect,
    onApprove,
    onReject
}) => {
    const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'lessons' | 'rubrics' | 'documents' | 'activities' | 'pending'>('all');
    
    // Role-based permissions
    const canCreate = userRole === 'guide' || userRole === 'staff';
    const canApprove = userRole === 'administrator';
    const isAdministrator = userRole === 'administrator';
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type'>('recent');
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const tabs = [
        { id: 'all', label: 'All', icon: null },
        ...(canApprove ? [{ id: 'pending', label: 'Pending Approval', icon: null }] : []),
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'lessons', label: 'Lessons', icon: FileText },
        { id: 'rubrics', label: 'Rubrics', icon: ClipboardList },
        { id: 'documents', label: 'Documents', icon: File },
        { id: 'activities', label: 'Activities', icon: Activity },
    ];

    // Mock data - replace with actual API call
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setResources([
                {
                    id: '1',
                    title: 'Teachers: Get Started with AI Classroom',
                    type: 'course',
                    creator: 'AI Classroom',
                    createdAt: '2025-10-15',
                    updatedAt: '2025-10-20',
                    isShared: true,
                    metadata: { subject: 'General', tags: ['introduction', 'tutorial'] }
                },
                {
                    id: '2',
                    title: 'General Writing Assignment Rubric',
                    type: 'rubric',
                    creator: 'AI Classroom',
                    createdAt: '2025-09-10',
                    updatedAt: '2025-10-18',
                    isShared: true,
                    metadata: { subject: 'English', grade: 'All' }
                },
                {
                    id: '3',
                    title: 'Introduction to Python Programming',
                    type: 'lesson',
                    creator: 'Current User',
                    createdAt: '2025-10-01',
                    updatedAt: '2025-10-19',
                    isShared: false,
                    metadata: { subject: 'Computer Science', grade: '9-12' }
                },
            ]);
            setIsLoading(false);
        }, 500);
    }, []);

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'course': return <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />;
            case 'lesson': return <FileText size={20} className="text-green-600 dark:text-green-400" />;
            case 'rubric': return <ClipboardList size={20} className="text-purple-600 dark:text-purple-400" />;
            case 'document': return <File size={20} className="text-orange-600 dark:text-orange-400" />;
            case 'activity': return <Activity size={20} className="text-pink-600 dark:text-pink-400" />;
            default: return <File size={20} className="text-gray-600 dark:text-gray-400" />;
        }
    };

    const getResourceTypeBadge = (type: string) => {
        const colors = {
            course: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            lesson: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            rubric: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
            document: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
            activity: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    };

    const filteredResources = resources.filter(resource => {
        const matchesTab = activeTab === 'all' || resource.type === activeTab.slice(0, -1);
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            resource.creator.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                            {isAdministrator ? 'Content Oversight Center' : 'Library'}
                        </h1>
                        {isAdministrator && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Review and manage platform content
                            </p>
                        )}
                    </div>
                    {canCreate && onCreateNew && (
                        <button
                            onClick={() => onCreateNew('lesson')}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                                     hover:bg-indigo-700 transition-colors duration-200 font-medium"
                        >
                            <Plus size={20} />
                            <span>Create</span>
                        </button>
                    )}
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 
                                                    text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for a resource"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                                     rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 
                                     dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 
                                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                                     dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                            <Filter size={20} />
                            <span>Last Modified</span>
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg 
                                          shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                    onClick={() => { setSortBy('recent'); setShowFilterMenu(false); }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                                             text-gray-700 dark:text-gray-300"
                                >
                                    Last Modified
                                </button>
                                <button
                                    onClick={() => { setSortBy('name'); setShowFilterMenu(false); }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                                             text-gray-700 dark:text-gray-300"
                                >
                                    Name
                                </button>
                                <button
                                    onClick={() => { setSortBy('type'); setShowFilterMenu(false); }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                                             text-gray-700 dark:text-gray-300"
                                >
                                    Type
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm
                                    transition-colors duration-200 whitespace-nowrap
                                    ${isActive
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }
                                `}
                            >
                                {Icon && <Icon size={18} />}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Resources Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-12">
                    <File size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        No resources found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Try adjusting your search or create a new resource
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredResources.map(resource => (
                        <div
                            key={resource.id}
                            className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                                     dark:border-gray-700 hover:shadow-lg transition-all duration-200 
                                     cursor-pointer overflow-hidden"
                            onClick={() => onResourceSelect(resource)}
                        >
                            {/* Resource Type Badge */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase 
                                                   ${getResourceTypeBadge(resource.type)}`}>
                                        {resource.type}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle menu
                                        }}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                                                 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 
                                                  rounded-lg flex items-center justify-center">
                                        {getResourceIcon(resource.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 
                                                     line-clamp-2 group-hover:text-indigo-600 
                                                     dark:group-hover:text-indigo-400 transition-colors">
                                            {resource.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Resource Info */}
                            <div className="p-4 space-y-2">
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar size={14} className="mr-1" />
                                    <span>Last modified {formatDate(resource.updatedAt)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        By {resource.creator}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle copy
                                            }}
                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                                                     opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy to my resources"
                                        >
                                            <Copy size={14} className="text-gray-600 dark:text-gray-400" />
                                        </button>
                                        {resource.isShared && (
                                            <Share2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContentLibrary;

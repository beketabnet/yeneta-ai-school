import React from 'react';
import {
    SparklesIcon,
    ChatBubbleLeftEllipsisIcon,
    ScaleIcon,
    ClipboardDocumentCheckIcon,
    BookOpenIcon,
    PencilIcon,
    FolderIcon,
    DocumentTextIcon,
    UserGroupIcon,
    CheckCircleIcon
} from '../icons/Icons';

interface DashboardOverviewProps {
    setActiveTab: (tabId: string) => void;
    user: any;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab, user }) => {
    const features = [
        {
            id: 'insights',
            title: 'Student Insights',
            description: 'AI-driven analytics on student performance and engagement.',
            icon: <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
            color: 'bg-purple-100 dark:bg-purple-900/20'
        },
        {
            id: 'planner',
            title: 'Lesson Planner',
            description: 'Generate comprehensive lesson plans aligned with curriculum.',
            icon: <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
            color: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            id: 'grader',
            title: 'Quick Grader',
            description: 'Grade assignments instantly with AI assistance.',
            icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />,
            color: 'bg-green-100 dark:bg-green-900/20'
        },
        {
            id: 'quiz_generator',
            title: 'Quiz Generator',
            description: 'Create quizzes from prepared materials in seconds.',
            icon: <PencilIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
            color: 'bg-orange-100 dark:bg-orange-900/20'
        },
        {
            id: 'rubric',
            title: 'Rubric Generator',
            description: 'Design custom rubrics for fair and consistent grading.',
            icon: <ScaleIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />,
            color: 'bg-teal-100 dark:bg-teal-900/20'
        },
        {
            id: 'communication',
            title: 'Communication Log',
            description: 'Track interactions with students and parents.',
            icon: <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-pink-600 dark:text-pink-400" />,
            color: 'bg-pink-100 dark:bg-pink-900/20'
        },
        {
            id: 'library',
            title: 'Resource Library',
            description: 'Manage and organize your educational materials.',
            icon: <FolderIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
            color: 'bg-indigo-100 dark:bg-indigo-900/20'
        },
        {
            id: 'gradebook',
            title: 'Gradebook Manager',
            description: 'Record and track student grades efficiently.',
            icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
            color: 'bg-yellow-100 dark:bg-yellow-900/20'
        },
    ];

    return (
        <div className="space-y-12 animate-fadeIn">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-400 to-violet-600 p-10 text-white shadow-2xl">
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Welcome back, <span className="text-yellow-300">{user?.first_name || 'Teacher'}</span>!
                    </h1>
                    <p className="text-lg md:text-xl text-violet-100 mb-8 max-w-2xl">
                        Your AI-powered teaching assistant is ready. What would you like to achieve with your students today?
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setActiveTab('planner')}
                            className="bg-white text-violet-700 hover:bg-violet-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                        >
                            Plan a Lesson
                        </button>
                        <button
                            onClick={() => setActiveTab('grader')}
                            className="bg-blue-500 bg-opacity-30 hover:bg-opacity-40 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            Grade Assignments
                        </button>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>
            </section>

            {/* Stats / Social Proof */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">1,200+</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Lessons Planned</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">850+</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hours Saved</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">98%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Student Engagement</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">4.9/5</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Teacher Rating</div>
                </div>
            </section>

            {/* Feature Grid */}
            <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Powerful Tools at Your Fingertips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => setActiveTab(feature.id)}
                            className="group relative flex flex-col items-start p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 text-left w-full overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-700 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform`}></div>

                            <div className={`${feature.color} p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                {feature.icon}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                {feature.description}
                            </p>

                            <div className="mt-auto flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                Launch Tool <span className="ml-1">&rarr;</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default DashboardOverview;

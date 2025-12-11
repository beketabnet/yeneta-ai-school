import React from 'react';
import {
    ChartBarIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    SparklesIcon,
    ArrowRightIcon
} from '../icons/Icons';
import { ChildSummary } from '../../types';

interface ParentDashboardOverviewProps {
    setActiveTab: (tabId: string) => void;
    currentUser: any;
    selectedChild: any | null;
}

const ParentDashboardOverview: React.FC<ParentDashboardOverviewProps> = ({ setActiveTab, currentUser, selectedChild }) => {

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const features = [
        {
            id: 'glance',
            title: 'At-a-Glance',
            description: 'View real-time performance summaries and alerts.',
            icon: <ChartBarIcon className="w-6 h-6 text-white" />,
            bgGradient: 'from-indigo-500 to-purple-600',
            shadowColor: 'shadow-indigo-500/20'
        },
        {
            id: 'grades',
            title: 'Courses & Grades',
            description: 'Monitor academic progress and detailed grades.',
            icon: <BookOpenIcon className="w-6 h-6 text-white" />,
            bgGradient: 'from-blue-500 to-cyan-500',
            shadowColor: 'shadow-blue-500/20'
        },
        {
            id: 'enrolled-subjects',
            title: 'Enrolled Subjects',
            description: 'Review curriculum and subject-specific details.',
            icon: <AcademicCapIcon className="w-6 h-6 text-white" />,
            bgGradient: 'from-emerald-500 to-teal-500',
            shadowColor: 'shadow-emerald-500/20'
        },
        {
            id: 'communication',
            title: 'Communication Log',
            description: 'Stay connected with teachers and school staff.',
            icon: <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />,
            bgGradient: 'from-pink-500 to-rose-500',
            shadowColor: 'shadow-pink-500/20'
        },
        {
            id: 'policy',
            title: 'AI Use Policy',
            description: 'Understand how AI supports your childs learning.',
            icon: <ShieldCheckIcon className="w-6 h-6 text-white" />,
            bgGradient: 'from-violet-500 to-fuchsia-500',
            shadowColor: 'shadow-violet-500/20'
        },
    ];

    return (
        <div className="space-y-10 animate-fadeIn pb-10">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-gradient-to-tr from-blue-500/20 to-teal-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{currentUser?.first_name || 'Parent'}</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl leading-relaxed">
                        Stay informed and engaged with your child's educational journey. Monitor progress, review grades, and connect with educators all in one place.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {selectedChild ? (
                            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-700/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-indigo-100 dark:border-indigo-500/30 shadow-sm">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-gray-700 dark:text-gray-200 font-medium tracking-wide text-sm">
                                    Viewing Dashboard for: <strong className="text-indigo-600 dark:text-indigo-400">{selectedChild.name}</strong>
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-700/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                                <UserGroupIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                                <span className="text-gray-700 dark:text-gray-200 font-medium tracking-wide text-sm">Viewing All Students</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Quick Stats / Highlights */}
            <section>
                {selectedChild ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div
                            onClick={() => setActiveTab('glance')}
                            className="group cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-700/50 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider">Current Grade</h3>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                    <ChartBarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {selectedChild.grade_level || 'N/A'}
                            </div>
                            <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    On Track
                                </span>
                            </div>
                        </div>

                        <div
                            onClick={() => setActiveTab('grades')}
                            className="group cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider">Academic Performance</h3>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                    <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                View Courses <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Check detailed subject breakdown</p>
                        </div>

                        <div
                            onClick={() => setActiveTab('communication')}
                            className="group cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-pink-200 dark:hover:border-pink-700/50 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider">Recent Activity</h3>
                                <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors flex items-center gap-2">
                                Communication Log <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Messages from teachers & admin</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-8 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Child to View Details</h3>
                            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                                Use the selector at the top of the page to choose a specific child and view their detailed performance metrics and alerts.
                            </p>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-0"></div>
                    </div>
                )}
            </section>

            {/* Feature Navigation Grid */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                        Parent Tools
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => setActiveTab(feature.id)}
                            className="group relative flex flex-col items-start p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-left w-full overflow-hidden hover:-translate-y-1"
                        >
                            {/* Colorful glow on hover */}
                            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full blur-2xl`}></div>

                            <div className={`bg-gradient-to-br ${feature.bgGradient} ${feature.shadowColor} shadow-lg p-3 rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300 z-10 relative`}>
                                {feature.icon}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors z-10 relative">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed z-10 relative">
                                {feature.description}
                            </p>

                            <div className="mt-auto flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0 transition-all z-10 relative gap-1">
                                Access Feature <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Trusted By / Social Proof Section */}
            <section className="border-t border-gray-100 dark:border-gray-800 pt-10 mt-4">
                <div className="text-center mb-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Trusted Education Platform</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">98%</div>
                        <div className="text-sm text-gray-500 font-medium">Parent Satisfaction</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">24/7</div>
                        <div className="text-sm text-gray-500 font-medium">AI Support Access</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">15+</div>
                        <div className="text-sm text-gray-500 font-medium">Countries Reached</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">50k+</div>
                        <div className="text-sm text-gray-500 font-medium">Students empowered</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ParentDashboardOverview;

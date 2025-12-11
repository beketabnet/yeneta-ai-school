import React from 'react';
import AnalyticsDashboard from './../admin/AnalyticsDashboard';
import LiveEngagementMonitorEnhanced from './../admin/LiveEngagementMonitorEnhanced';
import {
    UsersIcon,
    ChartBarIcon,
    BellAlertIcon,
    EyeIcon,
    PresentationChartLineIcon,
    SparklesIcon,
    KeyIcon,
    BookOpenIcon,
    ArrowRightIcon,
    ClockIcon
} from '../icons/Icons';

interface AdminDashboardOverviewProps {
    stats: {
        totalUsers: number;
        avgEngagement: number;
        activeAlerts: number;
        needsAttention: number;
    };
    isLoading: boolean;
    setActiveTab: (tab: string) => void;
}

const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ stats, isLoading, setActiveTab }) => {

    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section - Command Center Style */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl relative group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] group-hover:bg-blue-600/40 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800/80"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                                Admin Console v2.0
                            </span>
                            <div className="flex items-center gap-1 text-slate-400 text-sm font-mono">
                                <ClockIcon className="w-4 h-4" />
                                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                            {getGreeting()}, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-600">Administrator.</span>
                        </h1>
                        <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                            System integrity is optimal. You have <strong className="text-white">{stats.activeAlerts} active alerts</strong> requiring attention today.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setActiveTab('smart_alerts')}
                            className="flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/50 text-violet-400 px-6 py-3 rounded-xl backdrop-blur-sm transition-all active:scale-95 group"
                        >
                            <BellAlertIcon className="w-5 h-5 group-hover:animate-swing" />
                            <span>View Alerts</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('system_settings')}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-3 rounded-xl backdrop-blur-sm transition-all active:scale-95"
                        >
                            <KeyIcon className="w-5 h-5" />
                            <span>System Settings</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Stats Grid - Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: 'Total Users',
                        value: stats.totalUsers.toLocaleString(),
                        sub: 'Students, Teachers, Admin',
                        icon: <UsersIcon className="w-6 h-6 text-blue-400" />,
                        color: 'from-blue-500/20 to-indigo-500/20',
                        border: 'border-blue-200/50 dark:border-blue-700/50',
                        tab: 'users'
                    },
                    {
                        title: 'Avg. Engagement',
                        value: `${stats.avgEngagement}%`,
                        sub: 'Platform-wide activity',
                        icon: <ChartBarIcon className="w-6 h-6 text-emerald-400" />,
                        color: 'from-emerald-500/20 to-teal-500/20',
                        border: 'border-emerald-200/50 dark:border-emerald-700/50',
                        tab: 'grade_analytics'
                    },
                    {
                        title: 'Active Alerts',
                        value: stats.activeAlerts,
                        sub: 'Require investigation',
                        icon: <BellAlertIcon className="w-6 h-6 text-red-400" />,
                        color: 'from-red-500/20 to-orange-500/20',
                        border: 'border-red-200/50 dark:border-red-700/50',
                        tab: 'smart_alerts'
                    },
                    {
                        title: 'Needs Attention',
                        value: stats.needsAttention,
                        sub: 'High priority items',
                        icon: <EyeIcon className="w-6 h-6 text-amber-400" />,
                        color: 'from-amber-500/20 to-yellow-500/20',
                        border: 'border-amber-200/50 dark:border-amber-700/50',
                        tab: 'smart_alerts'
                    },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => setActiveTab(stat.tab)}
                        className={`
                            relative overflow-hidden cursor-pointer group rounded-2xl p-6
                            bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl
                            border ${stat.border} shadow-lg hover:shadow-xl
                            transition-all duration-300 hover:-translate-y-1
                        `}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} blur-2xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity`}></div>

                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                {stat.icon}
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {isLoading ? '...' : stat.value}
                            </h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {stat.title}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {stat.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Deep Analytics & Monitoring */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* System Analytics Card */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                    <PresentationChartLineIcon className="w-5 h-5 text-blue-500" />
                                    System Performance
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time system metrics and usage trends</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <AnalyticsDashboard />
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8">
                    {/* Live Engagement Monitor */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                                    Live Pulse
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time user activity stream</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <LiveEngagementMonitorEnhanced />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;

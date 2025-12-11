import React from 'react';
import { EnrollmentStats } from '../../hooks/useAdminEnrollmentRequests';
import { CheckCircleIcon, ClockIcon, XMarkIcon, BellAlertIcon, ClipboardDocumentListIcon } from '../icons/Icons';

interface AdminEnrollmentRequestsStatsProps {
    stats: EnrollmentStats | null;
    isLoading: boolean;
}

const AdminEnrollmentRequestsStats: React.FC<AdminEnrollmentRequestsStatsProps> = ({ stats, isLoading }) => {
    if (!stats) return null;

    const statItems = [
        {
            label: 'Total Requests',
            value: stats.total,
            icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
            borderColor: 'border-blue-200 dark:border-blue-800',
            bgGradient: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800',
            textColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40'
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: <BellAlertIcon className="h-6 w-6" />,
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            bgGradient: 'from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800',
            textColor: 'text-yellow-600 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
        },
        {
            label: 'Approved',
            value: stats.approved,
            icon: <CheckCircleIcon className="h-6 w-6" />,
            borderColor: 'border-green-200 dark:border-green-800',
            bgGradient: 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-800',
            textColor: 'text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-900/40'
        },
        {
            label: 'Declined',
            value: stats.declined,
            icon: <XMarkIcon className="h-6 w-6" />,
            borderColor: 'border-red-200 dark:border-red-800',
            bgGradient: 'from-red-50 to-white dark:from-red-900/20 dark:to-gray-800',
            textColor: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-900/40'
        },
        {
            label: 'Under Review',
            value: stats.under_review,
            icon: <ClockIcon className="h-6 w-6" />,
            borderColor: 'border-purple-200 dark:border-purple-800',
            bgGradient: 'from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800',
            textColor: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {statItems.map((item) => (
                <div
                    key={item.label}
                    className={`relative overflow-hidden p-4 rounded-2xl border ${item.borderColor} bg-gradient-to-br ${item.bgGradient} shadow-sm transition-all hover:scale-[1.02] hover:shadow-md`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {isLoading ? (
                                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                                ) : (
                                    item.value
                                )}
                            </h3>
                        </div>
                        <div className={`p-2.5 rounded-xl ${item.iconBg} ${item.textColor}`}>
                            {item.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminEnrollmentRequestsStats;

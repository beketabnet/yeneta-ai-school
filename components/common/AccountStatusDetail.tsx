import React, { useEffect, useState } from 'react';
import { User, AuthenticatedUser } from '../../types';
import { apiService } from '../../services/apiService';

interface AccountStatusDetailProps {
    user: User | AuthenticatedUser;
    onClose: () => void;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    created_at: string;
    notification_type: string;
}

const AccountStatusDetail: React.FC<AccountStatusDetailProps> = ({ user, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // @ts-ignore
                const data = await apiService.getNotifications();
                // Filter for system alerts or relevant status updates
                const statusNotifications = data.filter((n: Notification) =>
                    n.notification_type === 'system_alert' ||
                    n.title.toLowerCase().includes('status') ||
                    n.title.toLowerCase().includes('account')
                );
                setNotifications(statusNotifications);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-200';
            case 'Pending Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'Incomplete': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">Account Status Details</h2>
                            <p className="text-blue-100 mt-1">Detailed information about your registration and current standing.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Current Status Banner */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border mb-8 ${getStatusColor(user.account_status)}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-white/50`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Current Status</p>
                                <p className="text-xl font-bold">{user.account_status}</p>
                            </div>
                        </div>
                        {user.date_joined && (
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Member Since</p>
                                <p className="font-semibold">{new Date(user.date_joined).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* User Information */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Registration Info
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Full Name</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Role</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.role}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Region</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.region || 'N/A'}</span>
                                </div>
                                {user.student_identification_number && (
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                        <span className="text-gray-500 dark:text-gray-400">Student ID</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{user.student_identification_number}</span>
                                    </div>
                                )}
                                {user.mobile_number && (
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                                        <span className="text-gray-500 dark:text-gray-400">Mobile Number</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{user.mobile_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status History / Notifications */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Status History
                            </h3>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {isLoading ? (
                                    <p className="text-gray-500 text-center py-4">Loading history...</p>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                        <p className="text-gray-500 dark:text-gray-400">No status updates yet.</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-gray-600 last:border-0 last:pb-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800"></div>
                                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                                <p className="text-xs text-gray-400 mb-1">{new Date(notification.created_at).toLocaleString()}</p>
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{notification.title}</h4>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 whitespace-pre-wrap">{notification.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AccountStatusDetail;

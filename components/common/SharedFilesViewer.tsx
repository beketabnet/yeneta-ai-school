import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { SharedFileNotification } from '../../types';
import { XMarkIcon, BellIcon, DocumentTextIcon, DownloadIcon, EyeIcon } from '../icons/Icons';
import LessonPlanViewer from '../teacher/library/LessonPlanViewer';
import RubricViewer from '../teacher/library/RubricViewer';

interface SharedFilesViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SharedFilesViewer: React.FC<SharedFilesViewerProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<SharedFileNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<SharedFileNotification | null>(null);
    const [showLessonPlanViewer, setShowLessonPlanViewer] = useState(false);
    const [showRubricViewer, setShowRubricViewer] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await apiService.getFileNotifications();
            setNotifications(data);
        } catch (error: any) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewFile = async (notification: SharedFileNotification) => {
        setSelectedNotification(notification);
        
        // Mark as read
        if (!notification.is_read) {
            try {
                await apiService.markNotificationRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Open appropriate viewer
        if (notification.shared_file.content_type === 'lesson_plan') {
            setShowLessonPlanViewer(true);
        } else {
            setShowRubricViewer(true);
        }
    };

    const handleDownload = async (notification: SharedFileNotification) => {
        try {
            const fileId = notification.shared_file.content_type === 'lesson_plan'
                ? notification.shared_file.lesson_plan?.id
                : notification.shared_file.rubric?.id;

            if (!fileId) return;

            // Export as PDF
            if (notification.shared_file.content_type === 'lesson_plan') {
                const blob = await apiService.exportLessonPlanPDF(fileId);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${notification.shared_file.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                const blob = await apiService.exportRubricPDF(fileId);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${notification.shared_file.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }

            // Mark as downloaded
            await apiService.markNotificationDownloaded(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_downloaded: true } : n)
            );
        } catch (error: any) {
            alert(`Failed to download: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <BellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Shared Files
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            aria-label="Close"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <BellIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No shared files yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border rounded-lg p-4 transition ${
                                            notification.is_read
                                                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {notification.shared_file.title}
                                                    </h3>
                                                    {!notification.is_read && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    Shared by <span className="font-medium">{notification.shared_file.shared_by.username}</span>
                                                </p>
                                                {notification.shared_file.message && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 italic">
                                                        "{notification.shared_file.message}"
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleViewFile(notification)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                                    title="View"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(notification)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                                                    title="Download"
                                                >
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lesson Plan Viewer */}
            {selectedNotification?.shared_file.lesson_plan && (
                <LessonPlanViewer
                    isOpen={showLessonPlanViewer}
                    onClose={() => {
                        setShowLessonPlanViewer(false);
                        setSelectedNotification(null);
                    }}
                    lessonPlan={selectedNotification.shared_file.lesson_plan}
                />
            )}

            {/* Rubric Viewer */}
            {selectedNotification?.shared_file.rubric && (
                <RubricViewer
                    isOpen={showRubricViewer}
                    onClose={() => {
                        setShowRubricViewer(false);
                        setSelectedNotification(null);
                    }}
                    rubric={selectedNotification.shared_file.rubric}
                />
            )}
        </>
    );
};

export default SharedFilesViewer;

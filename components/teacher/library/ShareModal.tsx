import React, { useState, useEffect } from 'react';
import { XMarkIcon, UsersIcon } from '../../icons/Icons';
import { apiService } from '../../../services/apiService';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentType: 'lesson_plan' | 'rubric' | 'lesson' | 'quiz';
    contentId: number;
    contentTitle: string;
    onSuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    contentType,
    contentId,
    contentTitle,
    onSuccess
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (contentType === 'quiz') {
                data = await apiService.getEligibleStudentsForQuiz(contentId);
            } else {
                data = await apiService.getShareableUsers();
            }
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) {
            setError('Please select at least one user');
            return;
        }

        setSharing(true);
        setError('');
        try {
            if (contentType === 'lesson_plan') {
                await apiService.shareLessonPlan(contentId, selectedUsers, message);
            } else if (contentType === 'rubric') {
                await apiService.shareRubric(contentId, selectedUsers, message);
            } else if (contentType === 'lesson') {
                await apiService.shareLesson(contentId, selectedUsers, message);
            } else {
                // Assuming shareQuiz exists or using generic share
                await apiService.shareQuiz(contentId, selectedUsers, message);
            }
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to share');
        } finally {
            setSharing(false);
        }
    };

    const handleClose = () => {
        setSelectedUsers([]);
        setMessage('');
        setSearchQuery('');
        setError('');
        onClose();
    };

    const toggleUser = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'Teacher': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Student': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Share {contentType === 'lesson_plan' ? 'Lesson Plan' : contentType === 'rubric' ? 'Rubric' : 'Lesson'}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {contentTitle}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* User List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No users found</div>
                    ) : (
                        <div className="space-y-2 mb-4">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => { }}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        aria-label={`Select ${user.username}`}
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                            <UsersIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {user.username}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {user.email}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Optional Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a message for the recipients..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={sharing}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={sharing || selectedUsers.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sharing ? 'Sharing...' : 'Share'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

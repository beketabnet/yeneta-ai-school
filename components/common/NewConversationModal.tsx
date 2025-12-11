/**
 * NewConversationModal Component
 * Professional modal for selecting users and starting new conversations
 * Features: User search, role filtering, user selection, conversation creation
 */

import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import { User, UserRole } from '../../types';
import { XMarkIcon, UsersIcon } from '../icons/Icons';
import { apiService } from '../../services/apiService';
import { AuthContext } from '../../contexts/AuthContext';

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (conversationId: number) => void;
    allowedRoles?: UserRole[]; // Roles that can be messaged
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
    isOpen,
    onClose,
    onConversationCreated,
    allowedRoles
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const { user: currentUser } = useContext(AuthContext);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        } else {
            // Reset state when modal closes
            setSearchQuery('');
            setSelectedUser(null);
            setError(null);
            setRoleFilter('all');
        }
    }, [isOpen]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, roleFilter]);

    const fetchUsers = async (query: string = '') => {
        setIsLoading(true);
        setError(null);
        try {
            if ((currentUser?.role === 'Parent' || currentUser?.role === 'Student' || currentUser?.role === 'Teacher') && !query) {
                const contacts = await apiService.getCommunicationContacts();

                // Flatten and tag
                let allContacts: User[] = [
                    ...contacts.students,
                    ...contacts.teachers,
                    ...contacts.admins,
                    ...contacts.parents
                ];

                // Remove duplicates if any
                const uniqueContacts = new Map();
                allContacts.forEach(u => uniqueContacts.set(u.id, u));
                allContacts = Array.from(uniqueContacts.values());

                if (allowedRoles && allowedRoles.length > 0) {
                    allContacts = allContacts.filter(u => allowedRoles.includes(u.role));
                }

                if (roleFilter !== 'all') {
                    allContacts = allContacts.filter(u => u.role === roleFilter);
                }

                setFilteredUsers(allContacts);
                setUsers(allContacts);

            } else {
                // Fallback to original logic for search or other roles
                let fetchedUsers: User[] = [];
                if (query) {
                    fetchedUsers = await apiService.searchUsers(query);
                } else {
                    // For Admin/Teacher, or fallback
                    fetchedUsers = await apiService.getUsers();
                }

                // Filter out current user
                let availableUsers = fetchedUsers.filter(u => u.id !== currentUser?.id);

                // Apply allowedRoles restriction (from props)
                if (allowedRoles && allowedRoles.length > 0) {
                    availableUsers = availableUsers.filter(u => allowedRoles.includes(u.role));
                }

                // Apply selected role filter (from UI)
                if (roleFilter !== 'all') {
                    availableUsers = availableUsers.filter(u => u.role === roleFilter);
                }

                setUsers(availableUsers);
                setFilteredUsers(availableUsers);
            }

        } catch (err) {
            setError('Failed to load users. Please try again.');
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Removed client-side filterUsers function as we now fetch on change


    const handleStartConversation = async () => {
        if (!selectedUser || !currentUser) return;

        setIsCreating(true);
        setError(null);
        try {
            console.log('Creating conversation with:', {
                currentUser: currentUser.username,
                currentUserId: currentUser.id,
                selectedUser: selectedUser.username,
                selectedUserId: selectedUser.id,
                participantIds: [currentUser.id, selectedUser.id]
            });
            const conversation = await apiService.createConversation([currentUser.id, selectedUser.id]);
            console.log('Conversation created/returned:', {
                conversationId: conversation.id,
                participants: conversation.participants.map(p => ({ id: p.id, username: p.username }))
            });
            onConversationCreated(conversation.id);
            onClose();
        } catch (err) {
            setError('Failed to create conversation. Please try again.');
            console.error('Error creating conversation:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const getRoleColor = (role: UserRole): string => {
        switch (role) {
            case 'Admin':
                return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
            case 'Teacher':
                return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
            case 'Parent':
                return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
            case 'Student':
                return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    const getAvailableRoles = (): UserRole[] => {
        if (allowedRoles && allowedRoles.length > 0) {
            return allowedRoles;
        }
        return ['Admin', 'Teacher', 'Parent', 'Student'];
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Start New Conversation
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Select a user to start messaging
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Search users"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setRoleFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            All Users
                        </button>
                        {getAvailableRoles().map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === role
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {role}s
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-md">
                        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <UsersIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-center">
                                {searchQuery || roleFilter !== 'all'
                                    ? 'No users found matching your criteria'
                                    : 'No users available'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedUser?.id === user.id
                                        ? 'border-primary bg-primary-light dark:bg-primary-dark/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {user.first_name && user.last_name
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user.username}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedUser
                            ? `Selected: ${selectedUser.username}`
                            : 'Select a user to continue'}
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStartConversation}
                            disabled={!selectedUser || isCreating}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {isCreating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <UsersIcon className="w-5 h-5" />
                                    <span>Start Conversation</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default NewConversationModal;

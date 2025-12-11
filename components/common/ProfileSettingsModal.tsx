import React, { useState, useRef, useContext } from 'react';
import { AuthenticatedUser } from '../../types';
import { PhotoIcon, UserCircleIcon } from '../icons/Icons';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

interface ProfileSettingsModalProps {
  user: AuthenticatedUser;
  onClose: () => void;
  onUpdate: (updatedUser: Partial<AuthenticatedUser>) => void; // This can be removed if we only rely on context
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ user, onClose }) => {
    const [name, setName] = useState(user.name);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { updateUser } = useContext(AuthContext);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedData: Partial<{ username: string, avatarUrl: string }> = {};
            if (name !== user.name) {
                updatedData.username = name;
            }
            // In a real app, you would upload avatarFile to a backend service (e.g., S3)
            // and get back a URL to save in the user profile.
            // For this demo, we'll just use the local preview URL.
            if (avatarPreview && avatarPreview !== user.avatarUrl) {
                // This part is for frontend demonstration only.
                // updatedData.avatarUrl = avatarPreview;
                 console.warn("Avatar upload to backend is not implemented. Using local preview.");
            }

            if (Object.keys(updatedData).length > 0) {
                const updatedUserFromApi = await apiService.updateProfile(updatedData);
                 // Update global context
                updateUser({
                    ...user,
                    name: updatedUserFromApi.username,
                    // avatarUrl: updatedUserFromApi.avatar_url, // if backend returns it
                });
            }
            onClose();

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
                </div>
                <div className="p-6 space-y-6">
                     {error && <p className="text-sm text-center text-danger bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-24 h-24 text-gray-400" />
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full hover:bg-primary-dark"
                                aria-label="Change photo"
                            >
                                <PhotoIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                            <input type="text" id="displayName" value={name} onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address (cannot be changed)</label>
                            <input type="email" value={user.email} disabled
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role (cannot be changed)</label>
                            <input type="text" value={user.role} disabled
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                    <button onClick={handleSaveChanges} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;
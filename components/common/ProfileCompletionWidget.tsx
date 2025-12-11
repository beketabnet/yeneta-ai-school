import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { View } from '../../App';
import DocumentUploadModal from './DocumentUploadModal';
import AccountStatusDetail from './AccountStatusDetail';
import { apiService } from '../../services/apiService';

interface ProfileCompletionWidgetProps {
    setView?: (view: View) => void;
}

const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({ setView }) => {
    const { user, updateUser } = useContext(AuthContext);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isStatusDetailOpen, setIsStatusDetailOpen] = useState(false);

    if (!user) return null;

    // If status is Active, don't show the widget (or show a minimized version)
    if (user.account_status === 'Active') return null;

    const completionPercentage = user.profile_completion_percentage || 0;

    let message = "Please complete your profile to access all features.";
    let actionText = "Complete Profile";

    if (user.account_status === 'Pending Review') {
        message = "Your profile is under review by an administrator.";
        actionText = "View Status";
    } else if (user.account_status === 'Rejected') {
        message = "Your account application has been rejected.";
        actionText = "View Reason";
    } else if (user.account_status === 'Suspended') {
        message = "Your account has been suspended.";
        actionText = "View Details";
    }

    const handleAction = () => {
        if (user.account_status === 'Incomplete') {
            setIsUploadModalOpen(true);
        } else {
            setIsStatusDetailOpen(true);
        }
    };

    const handleUploadSuccess = async () => {
        // Trigger a profile update to check for completion status change
        try {
            // We send an empty update to trigger the backend's completion check logic
            await apiService.updateProfile({});

            // Refresh user data
            const updatedUser = await apiService.getCurrentUser();
            updateUser(updatedUser);
        } catch (error) {
            console.error("Failed to update profile status:", error);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Account Status: <span className={`font-bold ${getStatusColor(user.account_status)}`}>{user.account_status}</span>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {message}
                        </p>
                        {user.account_status === 'Incomplete' && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-xs">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                                <p className="text-xs text-right mt-1 text-gray-500">{completionPercentage}% Complete</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {/* Always show View Status button if not incomplete, or as secondary action */}
                        {user.account_status === 'Incomplete' && (
                            <button
                                onClick={() => setIsStatusDetailOpen(true)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                            >
                                View Details
                            </button>
                        )}
                        <button
                            onClick={handleAction}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark transition-colors"
                        >
                            {actionText}
                        </button>
                    </div>
                </div>
            </div>

            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                role={user.role}
                onUploadSuccess={handleUploadSuccess}
            />

            {isStatusDetailOpen && (
                <AccountStatusDetail
                    user={user}
                    onClose={() => setIsStatusDetailOpen(false)}
                />
            )}
        </>
    );
};

const getStatusColor = (status: string | undefined) => {
    switch (status) {
        case 'Active': return 'text-green-600';
        case 'Pending Review': return 'text-yellow-600';
        case 'Rejected': return 'text-red-600';
        case 'Suspended': return 'text-red-600';
        default: return 'text-gray-600';
    }
};

export default ProfileCompletionWidget;

import React, { useState } from 'react';
import ApprovedCoursesGradebook from './gradebook/ApprovedCoursesGradebook';
import AssignmentUploadModal from './AssignmentUploadModal';

const GradebookView: React.FC = () => {
    const [showUploadModal, setShowUploadModal] = useState(false);

    return (
        <>
            <ApprovedCoursesGradebook onSubmitAssignmentClick={() => setShowUploadModal(true)} />
            <AssignmentUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    setShowUploadModal(false);
                }}
            />
        </>
    );
};

export default GradebookView;
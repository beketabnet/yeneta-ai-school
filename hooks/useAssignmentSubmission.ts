import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface AssignmentSubmissionData {
    file: File;
    assignment_topic: string;
    document_type: string;
    submission_notes?: string;
}

export interface SubmissionResponse {
    id: number;
    student_id: number;
    assignment_id?: number;
    file_path: string;
    submitted_at: string;
    status: 'submitted' | 'graded' | 'pending';
    message: string;
}

interface UseAssignmentSubmissionReturn {
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
    successMessage: string | null;
    submitAssignment: (data: AssignmentSubmissionData) => Promise<SubmissionResponse | null>;
    resetState: () => void;
}

export const useAssignmentSubmission = (): UseAssignmentSubmissionReturn => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const submitAssignment = useCallback(async (data: AssignmentSubmissionData): Promise<SubmissionResponse | null> => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        setSuccessMessage(null);

        try {
            // Validate input
            if (!data.file || !data.assignment_topic || !data.document_type) {
                throw new Error('Missing required fields: file, assignment_topic, or document_type');
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('assignment_topic', data.assignment_topic);
            formData.append('document_type', data.document_type);
            if (data.submission_notes) {
                formData.append('submission_notes', data.submission_notes);
            }

            // Call API to submit assignment
            const response = await apiService.submitAssignment(formData);

            setSuccess(true);
            setSuccessMessage(`Assignment "${data.assignment_topic}" submitted successfully!`);
            setIsSubmitting(false);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit assignment';
            setError(errorMessage);
            setIsSubmitting(false);
            console.error('Error submitting assignment:', err);
            return null;
        }
    }, []);

    const resetState = useCallback(() => {
        setIsSubmitting(false);
        setError(null);
        setSuccess(false);
        setSuccessMessage(null);
    }, []);

    return {
        isSubmitting,
        error,
        success,
        successMessage,
        submitAssignment,
        resetState
    };
};

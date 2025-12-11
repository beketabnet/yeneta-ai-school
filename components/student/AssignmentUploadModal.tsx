import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useApprovedTeachers, ApprovedTeacher } from '../../hooks/useApprovedTeachers';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';
import { useNotification } from '../../contexts/NotificationContext';
import { DocumentType } from '../../types';
import { XMarkIcon, UploadIcon, CheckCircleIcon } from '../icons/Icons';

interface AssignmentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AssignmentUploadModal: React.FC<AssignmentUploadModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { addNotification } = useNotification();
    const { teachers: approvedTeachers, isLoading: teachersLoading } = useApprovedTeachers();
    const { types: assignmentTypes, isLoading: typesLoading } = useAssignmentTypes();
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [assignmentTopic, setAssignmentTopic] = useState('');
    const [documentType, setDocumentType] = useState<string>('homework');
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Auto-fill grade level and subject when teacher is selected
    useEffect(() => {
        if (selectedTeacherId && approvedTeachers.length > 0) {
            const selectedTeacher = approvedTeachers.find(t => t.id === selectedTeacherId);
            if (selectedTeacher && selectedTeacher.courses.length > 0) {
                const firstCourse = selectedTeacher.courses[0];
                setGradeLevel(firstCourse.grade_level);
                setSubject(firstCourse.subject);
            }
        }
    }, [selectedTeacherId, approvedTeachers]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validation
        if (!selectedTeacherId) {
            const msg = 'Please select a teacher';
            setError(msg);
            addNotification(msg, 'error');
            return;
        }

        if (!assignmentTopic.trim()) {
            const msg = 'Please enter assignment topic';
            setError(msg);
            addNotification(msg, 'error');
            return;
        }

        if (!file) {
            const msg = 'Please select a file to upload';
            setError(msg);
            addNotification(msg, 'error');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('teacher_id', selectedTeacherId.toString());
            formData.append('assignment_topic', assignmentTopic);
            // Convert document type to snake_case for backend validation
            const backendDocumentType = documentType.toLowerCase().replace(/ /g, '_');
            formData.append('document_type', backendDocumentType);
            formData.append('file', file);
            if (description) formData.append('description', description);
            if (gradeLevel) formData.append('grade_level', gradeLevel);
            if (subject) formData.append('subject', subject);

            const response = await apiService.submitAssignment(formData);

            // Success notification
            const successMsg = `Assignment "${assignmentTopic}" submitted successfully!`;
            setSuccessMessage(successMsg);
            addNotification(successMsg, 'success');

            // Reset form
            setSelectedTeacherId(null);
            setAssignmentTopic('');
            setDocumentType('homework');
            setFile(null);
            setDescription('');
            setGradeLevel('');
            setSubject('');

            if (onSuccess) onSuccess();

            // Close after brief delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error: any) {
            const errorMsg = error.message || 'Failed to submit assignment';
            setError(errorMsg);
            addNotification(errorMsg, 'error');
            console.error('Assignment submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 dark:border-gray-700/50 transform transition-all scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/10 dark:to-blue-900/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <UploadIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Submit Assignment
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Upload your work for grading</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm border border-gray-100 dark:border-gray-700"
                        aria-label="Close"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 font-medium">❌ {error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="text-green-600 dark:text-green-400 font-medium">{successMessage}</p>
                        </div>
                    )}

                    {/* Teacher Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Teacher *
                        </label>
                        <select
                            value={selectedTeacherId || ''}
                            onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                            disabled={teachersLoading}
                            title="Select a teacher for this assignment"
                        >
                            <option value="">
                                {teachersLoading ? 'Loading teachers...' : '-- Select a teacher --'}
                            </option>
                            {approvedTeachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                                </option>
                            ))}
                        </select>
                        {approvedTeachers.length === 0 && !teachersLoading && (
                            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                                No approved teachers found. Request enrollment in courses first.
                            </p>
                        )}
                    </div>

                    {/* Assignment Topic */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Assignment Topic *
                        </label>
                        <input
                            type="text"
                            value={assignmentTopic}
                            onChange={(e) => setAssignmentTopic(e.target.value)}
                            placeholder="e.g., Math Homework Chapter 5"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Document Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Document Type *
                        </label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                            disabled={typesLoading}
                            title="Select the type of document you are submitting"
                        >
                            {typesLoading ? (
                                <option>Loading types...</option>
                            ) : (
                                assignmentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Upload File *
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                            title="Upload your assignment file"
                        />
                        {file && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add any additional notes..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Grade Level & Subject */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Grade Level (Optional)
                            </label>
                            <input
                                type="text"
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                placeholder="e.g., Grade 10"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Subject (Optional)
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Mathematics"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || approvedTeachers.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2"
                            title={loading ? 'Submitting assignment...' : 'Submit your assignment'}
                        >
                            {loading ? '⏳ Submitting...' : 'Submit Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentUploadModal;

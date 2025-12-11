import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { StudentAssignment } from '../../types';
import { XMarkIcon, EyeIcon, DownloadIcon, CheckCircleIcon } from '../icons/Icons';

interface AssignmentViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AssignmentViewer: React.FC<AssignmentViewerProps> = ({ isOpen, onClose }) => {
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [grading, setGrading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'graded' | 'pending'>('all');

    useEffect(() => {
        if (isOpen) {
            fetchAssignments();
        }
    }, [isOpen]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await apiService.getStudentAssignments();
            setAssignments(data);
        } catch (error: any) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewFile = (assignment: StudentAssignment) => {
        // Open file in new tab
        window.open(assignment.file, '_blank');
    };

    const handleDownloadFile = (assignment: StudentAssignment) => {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = assignment.file;
        link.download = `${assignment.assignment_topic}_${assignment.student.username}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGradeClick = (assignment: StudentAssignment) => {
        setSelectedAssignment(assignment);
        setGrade(assignment.grade?.toString() || '');
        setFeedback(assignment.feedback || '');
        setShowGradeModal(true);
    };

    const handleSubmitGrade = async () => {
        if (!selectedAssignment) return;

        const gradeValue = parseFloat(grade);
        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
            alert('Please enter a valid grade between 0 and 100');
            return;
        }

        try {
            setGrading(true);
            await apiService.gradeAssignment(selectedAssignment.id, gradeValue, feedback);
            
            // Update local state
            setAssignments(prev =>
                prev.map(a =>
                    a.id === selectedAssignment.id
                        ? { ...a, is_graded: true, grade: gradeValue, feedback }
                        : a
                )
            );

            setShowGradeModal(false);
            setSelectedAssignment(null);
            setGrade('');
            setFeedback('');
        } catch (error: any) {
            alert(`Failed to grade assignment: ${error.message}`);
        } finally {
            setGrading(false);
        }
    };

    const filteredAssignments = assignments.filter(a => {
        if (filter === 'graded') return a.is_graded;
        if (filter === 'pending') return !a.is_graded;
        return true;
    });

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Student Assignments
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            aria-label="Close"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            All ({assignments.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'pending'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Pending ({assignments.filter(a => !a.is_graded).length})
                        </button>
                        <button
                            onClick={() => setFilter('graded')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'graded'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Graded ({assignments.filter(a => a.is_graded).length})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading assignments...</p>
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">No assignments found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAssignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {assignment.assignment_topic}
                                                    </h3>
                                                    {assignment.is_graded && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded flex items-center gap-1">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            Graded: {assignment.grade}/100
                                                        </span>
                                                    )}
                                                    {!assignment.is_graded && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Student: <span className="font-medium">{assignment.student.username}</span>
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Type: <span className="font-medium">{assignment.document_type.replace('_', ' ')}</span>
                                                </p>
                                                {assignment.description && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 italic">
                                                        "{assignment.description}"
                                                    </p>
                                                )}
                                                {assignment.is_graded && assignment.feedback && (
                                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback:</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.feedback}</p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    Submitted: {new Date(assignment.submitted_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleViewFile(assignment)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                                    title="View File"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadFile(assignment)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                                                    title="Download"
                                                >
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleGradeClick(assignment)}
                                                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
                                                >
                                                    {assignment.is_graded ? 'Update Grade' : 'Grade'}
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

            {/* Grade Modal */}
            {showGradeModal && selectedAssignment && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Grade Assignment
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {selectedAssignment.assignment_topic} - {selectedAssignment.student.username}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Grade (0-100) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter grade"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Feedback
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Provide feedback to the student..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowGradeModal(false);
                                        setSelectedAssignment(null);
                                        setGrade('');
                                        setFeedback('');
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitGrade}
                                    disabled={grading || !grade}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {grading ? 'Submitting...' : 'Submit Grade'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AssignmentViewer;

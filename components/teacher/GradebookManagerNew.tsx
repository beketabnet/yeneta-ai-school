import React, { useState, useEffect, useCallback } from 'react';
import Card from '../Card';
import { useTeacherStudents } from '../../hooks/useTeacherStudents';
import { useTeacherGrades, StudentGrade } from '../../hooks/useTeacherGrades';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotification } from '../../contexts/NotificationContext';
import { useEventListener } from '../../hooks/useEventListener';
import { AcademicCapIcon, ArrowPathIcon } from '../icons/Icons';
import GradeInputModal from './GradeInputModal';
import GradeRowDisplay from './GradeRowDisplay';

const GradebookManager: React.FC = () => {
    const { addNotification } = useNotification();
    const { students: enrolledStudents, isLoading: studentsLoading, refetch: refetchStudents } = useTeacherStudents();
    
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    
    const { grades, isLoading: gradesLoading, error, refetch: refetchGrades, updateGrade, deleteGrade } = useTeacherGrades(selectedSubject, selectedStudentId);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
    const [deletingGradeId, setDeletingGradeId] = useState<number | null>(null);

    // Auto-refresh hook
    useAutoRefresh({
        interval: 15000,
        enabled: autoRefreshEnabled,
        onRefresh: async () => {
            await refetchGrades();
            await refetchStudents();
        }
    });

    // Event listeners for real-time updates
    useEventListener({
        events: ['GRADE_CREATED', 'GRADE_UPDATED', 'GRADE_DELETED'],
        onEvent: (eventName) => {
            refetchGrades();
            if (eventName === 'GRADE_CREATED') {
                addNotification('New grade added', 'success');
            } else if (eventName === 'GRADE_UPDATED') {
                addNotification('Grade updated', 'success');
            } else if (eventName === 'GRADE_DELETED') {
                addNotification('Grade deleted', 'info');
            }
        }
    });

    // Show error notification
    useEffect(() => {
        if (error) {
            addNotification(error, 'error');
        }
    }, [error, addNotification]);

    // Get unique subjects from enrolled students
    const uniqueSubjects = useCallback(() => {
        const subjects = new Set<string>();
        enrolledStudents.forEach(student => {
            student.courses.forEach(course => {
                subjects.add(course.subject);
            });
        });
        return Array.from(subjects).sort();
    }, [enrolledStudents]);

    // Get students for selected subject
    const studentsForSubject = useCallback(() => {
        if (!selectedSubject) return [];
        return enrolledStudents.filter(student =>
            student.courses.some(course => course.subject === selectedSubject)
        );
    }, [enrolledStudents, selectedSubject]);

    // Filter grades based on selection
    const filteredGrades = useCallback(() => {
        return grades.filter(grade => {
            if (selectedSubject && grade.subject !== selectedSubject) return false;
            if (selectedStudentId && grade.student_id !== selectedStudentId) return false;
            return true;
        });
    }, [grades, selectedSubject, selectedStudentId]);

    // Handle grade save
    const handleGradeSave = async (score: number, feedback: string) => {
        if (!editingGrade) return;

        try {
            const result = await updateGrade(editingGrade.id, score, feedback);
            if (result) {
                addNotification(`Grade updated for ${editingGrade.student_name}`, 'success');
                setEditingGrade(null);
                setIsModalOpen(false);
                await refetchGrades();
            }
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to save grade', 'error');
        }
    };

    // Handle grade delete
    const handleGradeDelete = async (gradeId: number) => {
        if (!window.confirm('Are you sure you want to delete this grade?')) return;

        setDeletingGradeId(gradeId);
        try {
            const success = await deleteGrade(gradeId);
            if (success) {
                addNotification('Grade deleted successfully', 'success');
                await refetchGrades();
            }
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to delete grade', 'error');
        } finally {
            setDeletingGradeId(null);
        }
    };

    // Handle edit grade
    const handleEditGrade = (grade: StudentGrade) => {
        setEditingGrade(grade);
        setIsModalOpen(true);
    };

    const subjects = uniqueSubjects();
    const students = studentsForSubject();
    const displayGrades = filteredGrades();

    return (
        <div className="space-y-6">
            <Card>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gradebook Manager</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                refetchGrades();
                                refetchStudents();
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                            title="Refresh grades"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefreshEnabled}
                                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh</span>
                        </label>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Subject Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject *
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setSelectedStudentId(null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            title="Select a subject to view grades"
                        >
                            <option value="">-- Select Subject --</option>
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        {subjects.length === 0 && !studentsLoading && (
                            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                                No subjects available. Enroll in courses first.
                            </p>
                        )}
                    </div>

                    {/* Student Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Student (Optional)
                        </label>
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
                            disabled={!selectedSubject}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Optionally filter by student"
                        >
                            <option value="">-- All Students --</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.username}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grades Table */}
                {gradesLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-3 text-gray-600 dark:text-gray-400">Loading grades...</p>
                    </div>
                ) : displayGrades.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        %
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Feedback
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayGrades.map(grade => (
                                    <GradeRowDisplay
                                        key={grade.id}
                                        grade={grade}
                                        onEdit={handleEditGrade}
                                        onDelete={handleGradeDelete}
                                        isDeleting={deletingGradeId === grade.id}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : selectedSubject ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No grades found for {selectedSubject}</p>
                        <p className="text-sm mt-2">Grades will appear here once you add them.</p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Select a subject to view grades</p>
                    </div>
                )}
            </Card>

            {/* Grade Input Modal */}
            {editingGrade && (
                <GradeInputModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingGrade(null);
                    }}
                    onSave={handleGradeSave}
                    studentName={editingGrade.student_name}
                    subject={editingGrade.subject}
                    assignmentType={editingGrade.assignment_type}
                    examType={editingGrade.exam_type}
                    currentScore={editingGrade.score}
                    maxScore={editingGrade.max_score}
                    currentFeedback={editingGrade.feedback}
                />
            )}
        </div>
    );
};

export default GradebookManager;

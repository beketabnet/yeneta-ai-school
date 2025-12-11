import React from 'react';
import { PencilIcon, TrashIcon } from '../icons/Icons';
import { StudentGrade } from '../../hooks/useTeacherGrades';

interface GradeRowDisplayProps {
    grade: StudentGrade;
    onEdit: (grade: StudentGrade) => void;
    onDelete: (gradeId: number) => void;
    isDeleting?: boolean;
}

export const GradeRowDisplay: React.FC<GradeRowDisplayProps> = ({
    grade,
    onEdit,
    onDelete,
    isDeleting = false
}) => {
    const gradeType = grade.assignment_type || grade.exam_type || 'Grade';
    const percentageColor = grade.percentage >= 70 ? 'text-green-600 dark:text-green-400' : 
                           grade.percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 
                           'text-red-600 dark:text-red-400';

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                {grade.student_name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {grade.subject}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {gradeType}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{grade.score}</span>
                <span className="text-gray-500 dark:text-gray-400"> / {grade.max_score}</span>
            </td>
            <td className={`px-4 py-3 text-sm font-medium ${percentageColor}`}>
                {grade.percentage.toFixed(1)}%
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="truncate block max-w-xs" title={grade.feedback}>
                    {grade.feedback || '-'}
                </span>
            </td>
            <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(grade)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                        title="Edit grade"
                        disabled={isDeleting}
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(grade.id)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition disabled:opacity-50"
                        title="Delete grade"
                        disabled={isDeleting}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default GradeRowDisplay;

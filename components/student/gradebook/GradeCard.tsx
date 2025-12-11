import React from 'react';
import { Course } from '../../../types';

interface GradeCardProps {
    course: Course;
    isExpanded: boolean;
    onToggle: () => void;
}

const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

const getScoreBadge = (score: number): string => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    if (score >= 60) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
};

const getGradeLabel = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
};

const GradeCard: React.FC<GradeCardProps> = ({ course, isExpanded, onToggle }) => {
    // Handle both old and new data structures with proper null safety
    const getTeacherName = () => {
        try {
            if (typeof course.teacher_name === 'string' && course.teacher_name.trim()) {
                return course.teacher_name;
            } else if (course.teacher && typeof course.teacher === 'object') {
                const firstName = course.teacher.first_name?.trim() || '';
                const lastName = course.teacher.last_name?.trim() || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || 'Unknown Teacher';
            }
        } catch (e) {
            console.warn('Error getting teacher name:', e);
        }
        return 'Unknown Teacher';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {course.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreBadge(course.overall_grade)}`}>
                            {getGradeLabel(course.overall_grade)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        👨‍🏫 {getTeacherName()}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overall Grade</p>
                        <div className="flex items-center gap-2">
                            <p className={`font-bold text-2xl ${getScoreColor(course.overall_grade)}`}>
                                {course.overall_grade.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="p-5 space-y-4">
                        {course.units.map(unit => (
                            <div key={unit.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {unit.title}
                                    </h4>
                                    <span className={`font-bold text-lg ${getScoreColor(unit.unit_grade)}`}>
                                        {unit.unit_grade.toFixed(1)}%
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    {unit.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {item.title}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <span className={`font-medium text-sm ${item.score !== null ? getScoreColor((item.score / item.max_score) * 100) : 'text-gray-400 dark:text-gray-500'}`}>
                                                {item.score !== null ? (
                                                    <>
                                                        {item.score} / {item.max_score}
                                                        <span className="ml-2 text-xs">
                                                            ({((item.score / item.max_score) * 100).toFixed(0)}%)
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="italic">Not Graded</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeCard;

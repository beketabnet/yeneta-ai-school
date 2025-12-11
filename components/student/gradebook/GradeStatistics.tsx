import React from 'react';
import { Course } from '../../../types';

interface GradeStatisticsProps {
    courses: Course[];
}

const GradeStatistics: React.FC<GradeStatisticsProps> = ({ courses }) => {
    const calculateStats = () => {
        if (courses.length === 0) {
            return {
                overallGPA: 0,
                totalCourses: 0,
                completedAssignments: 0,
                pendingAssignments: 0,
                averageGrade: 0,
                highestGrade: 0,
                lowestGrade: 0
            };
        }

        const grades = courses.map(c => c.overall_grade);
        const allItems = courses.flatMap(c => c.units.flatMap(u => u.items));
        const completed = allItems.filter(item => item.score !== null).length;
        const pending = allItems.filter(item => item.score === null).length;

        return {
            overallGPA: (grades.reduce((sum, g) => sum + g, 0) / grades.length / 25).toFixed(2), // Convert to 4.0 scale
            totalCourses: courses.length,
            completedAssignments: completed,
            pendingAssignments: pending,
            averageGrade: (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1),
            highestGrade: Math.max(...grades).toFixed(1),
            lowestGrade: Math.min(...grades).toFixed(1)
        };
    };

    const stats = calculateStats();

    const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon="🎯"
                label="Overall GPA"
                value={stats.overallGPA}
                color="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
                icon="📚"
                label="Total Courses"
                value={stats.totalCourses}
                color="bg-purple-100 dark:bg-purple-900/30"
            />
            <StatCard
                icon="✅"
                label="Completed"
                value={stats.completedAssignments}
                color="bg-green-100 dark:bg-green-900/30"
            />
            <StatCard
                icon="⏳"
                label="Pending"
                value={stats.pendingAssignments}
                color="bg-orange-100 dark:bg-orange-900/30"
            />
        </div>
    );
};

export default GradeStatistics;

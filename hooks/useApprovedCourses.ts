import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface CourseGrade {
    id: string;
    title: string;
    subject: string;
    grade_level: string;
    stream?: string;
    teacher: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    units: Array<{
        id: string;
        title: string;
        unit_grade: number;
        items: Array<{
            id: number;
            title: string;
            score: number;
            max_score: number;
            type: string;
            submitted_at?: string;
        }>;
    }>;
    overall_grade: number;
    assignment_average: number | null;
    exam_average: number | null;
}

interface UseApprovedCoursesReturn {
    courses: CourseGrade[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useApprovedCourses = (): UseApprovedCoursesReturn => {
    const [courses, setCourses] = useState<CourseGrade[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getApprovedCoursesWithGrades();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approved courses';
            setError(errorMessage);
            console.error('Error fetching approved courses:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return {
        courses,
        isLoading,
        error,
        refetch: fetchCourses
    };
};

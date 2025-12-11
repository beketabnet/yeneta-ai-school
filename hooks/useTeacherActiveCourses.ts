import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface TeacherCourse {
    subject: string;
    grade_level: string;
    stream?: string;
}

interface UseTeacherActiveCoursesReturn {
    courses: TeacherCourse[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useTeacherActiveCourses = (): UseTeacherActiveCoursesReturn => {
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getTeacherActiveCourses();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active courses';
            setError(errorMessage);
            console.error('Error fetching teacher active courses:', err);
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

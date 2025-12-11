import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface StudentCourse {
    subject: string;
    grade_level: string;
    stream?: string;
}

export interface TeacherStudent {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    courses: StudentCourse[];
}

interface UseTeacherStudentsReturn {
    students: TeacherStudent[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useTeacherStudents = (): UseTeacherStudentsReturn => {
    const [students, setStudents] = useState<TeacherStudent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getTeacherEnrolledStudents();
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
            setError(errorMessage);
            console.error('Error fetching teacher students:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return {
        students,
        isLoading,
        error,
        refetch: fetchStudents
    };
};

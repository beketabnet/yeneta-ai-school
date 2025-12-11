import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface TeacherCourse {
    subject: string;
    grade_level: string;
    stream?: string;
}

export interface ApprovedTeacher {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    courses: TeacherCourse[];
}

interface UseApprovedTeachersReturn {
    teachers: ApprovedTeacher[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useApprovedTeachers = (): UseApprovedTeachersReturn => {
    const [teachers, setTeachers] = useState<ApprovedTeacher[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTeachers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getApprovedTeachersForStudent();
            setTeachers(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approved teachers';
            setError(errorMessage);
            console.error('Error fetching approved teachers:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    return {
        teachers,
        isLoading,
        error,
        refetch: fetchTeachers
    };
};

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface StudentGrade {
    id: number;
    student_id: number;
    student_name: string;
    subject: string;
    assignment_type?: string;
    exam_type?: string;
    score: number;
    max_score: number;
    percentage: number;
    feedback: string;
    graded_at: string;
    created_at: string;
}

export interface UseTeacherGradesReturn {
    grades: StudentGrade[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateGrade: (gradeId: number, score: number, feedback?: string) => Promise<StudentGrade | null>;
    deleteGrade: (gradeId: number) => Promise<boolean>;
    createGrade: (gradeData: Partial<StudentGrade>) => Promise<StudentGrade | null>;
}

export const useTeacherGrades = (subject?: string, studentId?: number): UseTeacherGradesReturn => {
    const [grades, setGrades] = useState<StudentGrade[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGrades = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch grades with optional filters
            const params = new URLSearchParams();
            if (subject) params.append('subject', subject);
            if (studentId) params.append('student_id', studentId.toString());

            const response = await apiService.getStudentGradesBySubject(
                subject || '',
                studentId || undefined,
                undefined,
                undefined
            );

            setGrades(Array.isArray(response) ? response : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grades';
            setError(errorMessage);
            console.error('Error fetching grades:', err);
        } finally {
            setIsLoading(false);
        }
    }, [subject, studentId]);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    const updateGrade = useCallback(async (gradeId: number, score: number, feedback?: string): Promise<StudentGrade | null> => {
        try {
            const response = await apiService.updateStudentGrade(gradeId, {
                score,
                feedback: feedback || ''
            });

            // Update local state
            setGrades(prevGrades =>
                prevGrades.map(g => g.id === gradeId ? { ...g, score, feedback: feedback || '', percentage: (score / g.max_score) * 100 } : g)
            );

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update grade';
            setError(errorMessage);
            console.error('Error updating grade:', err);
            return null;
        }
    }, []);

    const deleteGrade = useCallback(async (gradeId: number): Promise<boolean> => {
        try {
            await apiService.deleteStudentGrade(gradeId);

            // Update local state
            setGrades(prevGrades => prevGrades.filter(g => g.id !== gradeId));

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete grade';
            setError(errorMessage);
            console.error('Error deleting grade:', err);
            return false;
        }
    }, []);

    const createGrade = useCallback(async (gradeData: Partial<StudentGrade>): Promise<StudentGrade | null> => {
        try {
            const response = await apiService.createStudentGrade(gradeData);

            // Update local state
            setGrades(prevGrades => [...prevGrades, response]);

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create grade';
            setError(errorMessage);
            console.error('Error creating grade:', err);
            return null;
        }
    }, []);

    return {
        grades,
        isLoading,
        error,
        refetch: fetchGrades,
        updateGrade,
        deleteGrade,
        createGrade
    };
};

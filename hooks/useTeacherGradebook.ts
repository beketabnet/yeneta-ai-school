import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface GradebookAssignment {
    id: number;
    topic: string;
    type: string;
    score: number | null;
    max_score: number;
    submitted_at?: string;
    is_graded: boolean;
}

export interface GradebookEntry {
    student_id: number;
    student_name: string;
    subject: string;
    grade_level: string;
    stream?: string;
    assignments: GradebookAssignment[];
}

interface UseTeacherGradebookReturn {
    gradebook: GradebookEntry[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useTeacherGradebook = (): UseTeacherGradebookReturn => {
    const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGradebook = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getTeacherGradebook();
            setGradebook(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gradebook';
            setError(errorMessage);
            console.error('Error fetching teacher gradebook:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGradebook();
    }, [fetchGradebook]);

    return {
        gradebook,
        isLoading,
        error,
        refetch: fetchGradebook
    };
};

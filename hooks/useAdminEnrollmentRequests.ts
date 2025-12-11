import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface EnrollmentStudent {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
}

export interface EnrollmentTeacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
}

export interface EnrollmentRequest {
    id: number;
    student: EnrollmentStudent;
    teacher: EnrollmentTeacher;
    subject: string;
    grade_level: string;
    stream?: string;
    status: 'pending' | 'approved' | 'declined' | 'under_review';
    review_notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface EnrollmentStats {
    total: number;
    pending: number;
    approved: number;
    declined: number;
    under_review: number;
}

interface UseAdminEnrollmentRequestsReturn {
    enrollments: EnrollmentRequest[];
    stats: EnrollmentStats | null;
    isLoading: boolean;
    error: string | null;
    refetch: (filters?: { status?: string; teacher_id?: number; student_id?: number; search?: string }) => Promise<void>;
}

export const useAdminEnrollmentRequests = (): UseAdminEnrollmentRequestsReturn => {
    const [enrollments, setEnrollments] = useState<EnrollmentRequest[]>([]);
    const [stats, setStats] = useState<EnrollmentStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEnrollments = useCallback(async (filters?: { status?: string; teacher_id?: number; student_id?: number; search?: string }) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getAdminEnrollmentRequests(filters);
            setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
            setStats(data.stats || null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollment requests';
            setError(errorMessage);
            console.error('Error fetching admin enrollment requests:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    return {
        enrollments,
        stats,
        isLoading,
        error,
        refetch: fetchEnrollments
    };
};

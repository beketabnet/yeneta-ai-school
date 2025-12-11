import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import eventService, { EVENTS } from '../services/eventService';

export interface StudentFeedback {
  id: number;
  student: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  message_content: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface UseStudentFeedbackReturn {
  feedbacks: StudentFeedback[];
  isLoading: boolean;
  error: string | null;
  createFeedback: (data: { message_content: string; category: string; priority: string }) => Promise<StudentFeedback>;
  updateFeedback: (id: number, updates: Partial<StudentFeedback>) => Promise<StudentFeedback>;
  deleteFeedback: (id: number) => Promise<void>;
  assignFeedback: (id: number, assignedToId: number) => Promise<StudentFeedback>;
  refetch: () => Promise<void>;
  getStatistics: () => Promise<any>;
}

export const useStudentFeedback = (isAdmin: boolean = false): UseStudentFeedbackReturn => {
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isAdmin 
        ? await apiService.getStudentFeedbacks()
        : await apiService.getMyFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feedbacks';
      setError(errorMessage);
      console.error('Error fetching feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Listen for feedback events
  useEffect(() => {
    const unsubscribeCreated = eventService.subscribe('FEEDBACK_CREATED', () => {
      fetchFeedbacks();
    });
    const unsubscribeUpdated = eventService.subscribe('FEEDBACK_UPDATED', () => {
      fetchFeedbacks();
    });
    const unsubscribeAssigned = eventService.subscribe('FEEDBACK_ASSIGNED', () => {
      fetchFeedbacks();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeAssigned();
    };
  }, [fetchFeedbacks]);

  const createFeedback = useCallback(
    async (data: { message_content: string; category: string; priority: string }): Promise<StudentFeedback> => {
      try {
        const newFeedback = await apiService.createStudentFeedback(data);
        setFeedbacks(prev => [newFeedback, ...prev]);
        eventService.emit('FEEDBACK_CREATED', newFeedback);
        return newFeedback;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create feedback';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const updateFeedback = useCallback(
    async (id: number, updates: Partial<StudentFeedback>): Promise<StudentFeedback> => {
      try {
        const updated = await apiService.updateStudentFeedback(id, updates);
        setFeedbacks(prev =>
          prev.map(f => f.id === id ? updated : f)
        );
        eventService.emit('FEEDBACK_UPDATED', updated);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update feedback';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const deleteFeedback = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiService.deleteStudentFeedback(id);
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        eventService.emit('FEEDBACK_DELETED', { id });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete feedback';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const assignFeedback = useCallback(
    async (id: number, assignedToId: number): Promise<StudentFeedback> => {
      try {
        const updated = await apiService.assignStudentFeedback(id, assignedToId);
        setFeedbacks(prev =>
          prev.map(f => f.id === id ? updated : f)
        );
        eventService.emit('FEEDBACK_ASSIGNED', updated);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to assign feedback';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const getStatistics = useCallback(async () => {
    try {
      return await apiService.getStudentFeedbackStatistics();
    } catch (err) {
      console.error('Error fetching feedback statistics:', err);
      throw err;
    }
  }, []);

  return {
    feedbacks,
    isLoading,
    error,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    assignFeedback,
    refetch: fetchFeedbacks,
    getStatistics,
  };
};

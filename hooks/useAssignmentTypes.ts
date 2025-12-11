import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export interface AssignmentTypeOption {
    value: string;
    label: string;
}

export const useAssignmentTypes = () => {
    const [types, setTypes] = useState<AssignmentTypeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const data = await apiService.getAssignmentTypes();
                setTypes(data);
            } catch (err) {
                setError('Failed to load assignment types');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTypes();
    }, []);

    return { types, isLoading, error };
};

export const useExamTypes = () => {
    const [types, setTypes] = useState<AssignmentTypeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const data = await apiService.getExamTypes();
                setTypes(data);
            } catch (err) {
                setError('Failed to load exam types');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTypes();
    }, []);

    return { types, isLoading, error };
};


import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Expression, EngagementState, EngagementContextType } from '../types';
import { apiService } from '../services/apiService';

const INACTIVITY_TIMEOUT = 10000; // 10 seconds
const SNAPSHOT_INTERVAL = 5000; // Send snapshot every 5 seconds

export const EngagementContext = createContext<EngagementContextType>({} as EngagementContextType);

export const EngagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [engagementState, setEngagementState] = useState<EngagementState>({});
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [lastSnapshotTime, setLastSnapshotTime] = useState<number>(0);

    const updateStudentEngagement = useCallback((studentId: string, expression: Expression) => {
        setEngagementState(prevState => ({
            ...prevState,
            [studentId]: {
                expression,
                lastSeen: Date.now(),
            },
        }));
    }, []);

    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setEngagementState(prevState => {
                const nextState = { ...prevState };
                let hasChanged = false;
                for (const studentId in nextState) {
                    if (now - nextState[studentId].lastSeen > INACTIVITY_TIMEOUT) {
                        delete nextState[studentId];
                        hasChanged = true;
                    }
                }
                return hasChanged ? nextState : prevState;
            });
        }, 5000); // Check for inactive students every 5 seconds

        return () => clearInterval(cleanupInterval);
    }, []);

    const contextValue = {
        engagementState,
        updateStudentEngagement,
    };

    return (
        <EngagementContext.Provider value={contextValue}>
            {children}
        </EngagementContext.Provider>
    );
};
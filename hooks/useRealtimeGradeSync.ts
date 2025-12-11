import { useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface GradeUpdatePayload {
  student_id: number;
  teacher_id: number;
  subject: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

interface RealtimeSyncOptions {
  enabled?: boolean;
  interval?: number;
  onGradeUpdated?: (payload: GradeUpdatePayload) => void;
}

/**
 * Hook for real-time grade synchronization across features
 * Automatically refreshes related data when grades change
 */
export const useRealtimeGradeSync = (options: RealtimeSyncOptions = {}) => {
  const { enabled = true, interval = 5000, onGradeUpdated } = options;
  const { addNotification } = useNotification();

  // Emit custom event for grade updates
  const emitGradeUpdate = useCallback((payload: GradeUpdatePayload) => {
    const event = new CustomEvent('gradeUpdated', { detail: payload });
    window.dispatchEvent(event);
    onGradeUpdated?.(payload);
  }, [onGradeUpdated]);

  // Listen for grade update events
  useEffect(() => {
    if (!enabled) return;

    const handleGradeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<GradeUpdatePayload>;
      const payload = customEvent.detail;

      // Trigger updates for affected features
      triggerFeatureUpdates(payload);
    };

    window.addEventListener('gradeUpdated', handleGradeUpdate);

    return () => {
      window.removeEventListener('gradeUpdated', handleGradeUpdate);
    };
  }, [enabled]);

  // Poll for updates at regular intervals
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const checkInterval = setInterval(() => {
      checkForGradeUpdates();
    }, interval);

    return () => clearInterval(checkInterval);
  }, [enabled, interval]);

  const checkForGradeUpdates = useCallback(async () => {
    try {
      // Poll backend for recent grade updates
      const response = await fetch('/api/grades/recent-updates/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const updates = await response.json();
        if (Array.isArray(updates) && updates.length > 0) {
          updates.forEach((update: GradeUpdatePayload) => {
            emitGradeUpdate(update);
          });
        }
      }
    } catch (error) {
      console.error('Error checking for grade updates:', error);
    }
  }, [emitGradeUpdate]);

  const triggerFeatureUpdates = useCallback((payload: GradeUpdatePayload) => {
    // Emit specific events for each feature that needs updating
    const event = new CustomEvent('refreshGradebookManager', { detail: payload });
    window.dispatchEvent(event);

    const studentEvent = new CustomEvent('refreshStudentGradebook', { detail: payload });
    window.dispatchEvent(studentEvent);

    const parentEvent = new CustomEvent('refreshParentDashboard', { detail: payload });
    window.dispatchEvent(parentEvent);

    const analyticsEvent = new CustomEvent('refreshAnalytics', { detail: payload });
    window.dispatchEvent(analyticsEvent);
  }, []);

  return {
    emitGradeUpdate,
    checkForUpdates: checkForGradeUpdates,
    triggerFeatureUpdates,
  };
};

// Hook to listen for specific feature updates
export const useGradeUpdateListener = (featureName: string, onUpdate: (payload: GradeUpdatePayload) => void) => {
  useEffect(() => {
    const eventName = `refresh${featureName}`;

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<GradeUpdatePayload>;
      onUpdate(customEvent.detail);
    };

    window.addEventListener(eventName, handleUpdate);

    return () => {
      window.removeEventListener(eventName, handleUpdate);
    };
  }, [featureName, onUpdate]);
};

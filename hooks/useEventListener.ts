import { useEffect, useCallback } from 'react';
import eventService from '../services/eventService';

interface UseEventListenerOptions {
  events: string[];
  onEvent: (eventName: string, data?: any) => void;
}

/**
 * Hook for subscribing to multiple events with automatic cleanup
 * Simplifies event subscription management in components
 */
export const useEventListener = ({
  events,
  onEvent
}: UseEventListenerOptions) => {
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    events.forEach(eventName => {
      const unsubscribe = eventService.subscribe(eventName, (data) => {
        onEvent(eventName, data);
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [events, onEvent]);
};

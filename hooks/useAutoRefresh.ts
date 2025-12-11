import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  interval: number; // milliseconds
  enabled?: boolean;
  onRefresh: () => Promise<void>;
}

/**
 * Hook for automatic data refresh at specified intervals
 * Handles cleanup and prevents memory leaks
 */
export const useAutoRefresh = ({
  interval,
  enabled = true,
  onRefresh
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          await onRefresh();
        } catch (error) {
          console.error('Auto-refresh error:', error);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, interval);
  }, [interval, onRefresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [enabled, startAutoRefresh, stopAutoRefresh]);

  return { startAutoRefresh, stopAutoRefresh };
};

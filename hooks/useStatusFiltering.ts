import { useState, useCallback, useMemo } from 'react';

type StatusType = 'all' | 'pending' | 'approved' | 'declined' | 'under_review';

interface UseStatusFilteringOptions<T> {
  items: T[];
  getStatus: (item: T) => string;
  defaultFilter?: StatusType;
}

/**
 * Hook for filtering items by status
 * Provides consistent status filtering logic across components
 */
export const useStatusFiltering = <T,>({
  items,
  getStatus,
  defaultFilter = 'all'
}: UseStatusFilteringOptions<T>) => {
  const [filter, setFilter] = useState<StatusType>(defaultFilter);

  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return items;
    }
    return items.filter(item => getStatus(item) === filter);
  }, [items, filter, getStatus]);

  const resetFilter = useCallback(() => {
    setFilter(defaultFilter);
  }, [defaultFilter]);

  return {
    filter,
    setFilter,
    filteredItems,
    resetFilter
  };
};

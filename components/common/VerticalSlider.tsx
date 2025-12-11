import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';

interface VerticalSliderProps {
  items: Array<{
    id: string | number;
    label: string;
    name?: string;
  }>;
  onSelect?: (item: any) => void;
  selectedId?: string | number | null;
  maxVisibleItems?: number;
  className?: string;
  itemRenderer?: (item: any) => React.ReactNode;
}

const VerticalSlider: React.FC<VerticalSliderProps> = ({
  items,
  onSelect,
  selectedId,
  maxVisibleItems = 5,
  className = '',
  itemRenderer
}) => {
  const [scrollIndex, setScrollIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const canScrollUp = scrollIndex > 0;
  const canScrollDown = scrollIndex + maxVisibleItems < items.length;

  const visibleItems = items.slice(scrollIndex, scrollIndex + maxVisibleItems);

  const handleScrollUp = () => {
    if (canScrollUp) {
      setScrollIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleScrollDown = () => {
    if (canScrollDown) {
      setScrollIndex(prev => Math.min(items.length - maxVisibleItems, prev + 1));
    }
  };

  useEffect(() => {
    if (selectedId !== undefined && selectedId !== null) {
      const selectedIndex = items.findIndex(item => item.id === selectedId);
      if (selectedIndex !== -1) {
        if (selectedIndex < scrollIndex) {
          setScrollIndex(selectedIndex);
        } else if (selectedIndex >= scrollIndex + maxVisibleItems) {
          setScrollIndex(Math.max(0, selectedIndex - maxVisibleItems + 1));
        }
      }
    }
  }, [selectedId, items, scrollIndex, maxVisibleItems]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Scroll Up Button */}
      <button
        onClick={handleScrollUp}
        disabled={!canScrollUp}
        className={`p-2 rounded transition-colors ${
          canScrollUp
            ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Scroll up"
      >
        <ChevronUpIcon className="h-5 w-5" />
      </button>

      {/* Visible Items Container */}
      <div
        ref={containerRef}
        className={`flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700`}
        style={{ height: `${maxVisibleItems * 50}px`, overflow: 'hidden' }}
      >
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item)}
            className={`px-3 py-2 rounded text-sm font-medium text-left transition-all ${
              selectedId === item.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {itemRenderer ? itemRenderer(item) : (item.label || item.name || `Item ${item.id}`)}
          </button>
        ))}
      </div>

      {/* Scroll Down Button */}
      <button
        onClick={handleScrollDown}
        disabled={!canScrollDown}
        className={`p-2 rounded transition-colors ${
          canScrollDown
            ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Scroll down"
      >
        <ChevronDownIcon className="h-5 w-5" />
      </button>

      {/* Item Counter */}
      {items.length > maxVisibleItems && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          {scrollIndex + 1}-{Math.min(scrollIndex + maxVisibleItems, items.length)} of {items.length}
        </div>
      )}
    </div>
  );
};

export default VerticalSlider;

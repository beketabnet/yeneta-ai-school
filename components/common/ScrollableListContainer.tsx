import React from 'react';

interface ScrollableListContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

/**
 * Reusable component for displaying scrollable lists with consistent styling
 * Provides vertical scrolling for long lists without extending page height
 */
const ScrollableListContainer: React.FC<ScrollableListContainerProps> = ({
  children,
  maxHeight = 'max-h-[600px]',
  className = ''
}) => {
  return (
    <div className={`${maxHeight} overflow-y-auto overflow-x-auto ${className}`}>
      {children}
    </div>
  );
};

export default ScrollableListContainer;

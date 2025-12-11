
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', action }) => {
  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  );
};

export default Card;

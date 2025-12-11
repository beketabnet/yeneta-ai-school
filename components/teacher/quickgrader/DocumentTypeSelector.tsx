import React from 'react';
import { useAssignmentTypes } from '../../../hooks/useAssignmentTypes';

interface DocumentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const getIconForType = (type: string): string => {
  const icons: Record<string, string> = {
    essay: '📝',
    exam: '📋',
    project: '🔬',
    group_work: '👥',
    lab_report: '🧪',
    presentation: '📊',
    homework: '📚',
    quiz: '❓',
    creative_writing: '✍️',
    analysis: '🔍',
  };
  return icons[type] || '📄';
};

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ value, onChange, disabled = false }) => {
  const { types, isLoading } = useAssignmentTypes();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Document Type *
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
      >
        {isLoading ? (
          <option>Loading types...</option>
        ) : (
          types.map((type) => (
            <option key={type.value} value={type.value}>
              {getIconForType(type.value)} {type.label}
            </option>
          ))
        )}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select the type of document to grade for optimized assessment
      </p>
    </div>
  );
};

export default DocumentTypeSelector;

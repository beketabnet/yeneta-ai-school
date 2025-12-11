import React from 'react';
import { useAssignmentTypes } from '../../../hooks/useAssignmentTypes';

export type DocumentType = 
  | 'essay'
  | 'examination'
  | 'project'
  | 'group_work'
  | 'lab_report'
  | 'presentation'
  | 'homework'
  | 'creative_writing'
  | 'critical_analysis';

interface DocumentTypeSelectorProps {
  value: DocumentType;
  onChange: (value: DocumentType) => void;
  disabled?: boolean;
}

const getIconForType = (type: string): string => {
  const icons: Record<string, string> = {
    essay: '📝',
    examination: '📄',
    project: '🔬',
    group_work: '👥',
    lab_report: '🧪',
    presentation: '📊',
    homework: '📚',
    creative_writing: '✍️',
    critical_analysis: '🔍',
  };
  return icons[type] || '📄';
};

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { types, isLoading } = useAssignmentTypes();

  return (
    <div className="space-y-2">
      <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Document Type *
      </label>
      <select
        id="document-type"
        value={value}
        onChange={(e) => onChange(e.target.value as DocumentType)}
        disabled={disabled || isLoading}
        className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
        Select the type of document to generate an appropriate rubric
      </p>
    </div>
  );
};

export default DocumentTypeSelector;

import React from 'react';

export type SubmissionSource = 'assignment' | 'upload' | 'custom';

interface SubmissionSourceSelectorProps {
  value: SubmissionSource;
  onChange: (value: SubmissionSource) => void;
  disabled?: boolean;
}

const SubmissionSourceSelector: React.FC<SubmissionSourceSelectorProps> = ({ value, onChange, disabled = false }) => {
  const sources = [
    { value: 'assignment' as SubmissionSource, label: 'From Student Submission', icon: '📥', description: 'Grade existing student submissions' },
    { value: 'upload' as SubmissionSource, label: 'Upload Document', icon: '📤', description: 'Upload a document file to grade' },
    { value: 'custom' as SubmissionSource, label: 'Custom Text', icon: '✏️', description: 'Enter or paste text directly' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Submission Source *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sources.map((source) => (
          <button
            key={source.value}
            type="button"
            onClick={() => onChange(source.value)}
            disabled={disabled}
            className={`group p-4 border rounded-xl text-left transition-all duration-300 relative overflow-hidden ${value === source.value
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800 hover:shadow-md hover:-translate-y-0.5'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {value === source.value && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-400/10 dark:to-purple-400/10 pointer-events-none" />
            )}
            <div className="flex items-start space-x-4 relative z-10">
              <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{source.icon}</span>
              <div className="flex-1">
                <div className={`font-semibold text-sm transition-colors ${value === source.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                  {source.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {source.description}
                </div>
              </div>
              {value === source.value && (
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubmissionSourceSelector;

import React from 'react';

interface EditableSuggestionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onAcceptSuggestion: (suggestion: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  helpText?: string;
  isLoading?: boolean;
}

const EditableSuggestionField: React.FC<EditableSuggestionFieldProps> = ({
  label,
  value,
  onChange,
  suggestions,
  onAcceptSuggestion,
  placeholder = '',
  multiline = false,
  rows = 3,
  helpText,
  isLoading = false,
}) => {
  const fieldId = `editable-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
              ✨ AI Suggestions from Curriculum
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700 hover:shadow-sm transition-shadow"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                  {suggestion}
                </span>
                <button
                  onClick={() => onAcceptSuggestion(suggestion)}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex-shrink-0"
                  title="Use this suggestion"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Extracting content from curriculum...
          </span>
        </div>
      )}

      {/* Editable Input Field */}
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full p-3 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      ) : (
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      )}

      {/* Help Text */}
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default EditableSuggestionField;

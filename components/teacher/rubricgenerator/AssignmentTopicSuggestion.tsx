import React from 'react';

interface AssignmentTopicSuggestionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  suggestedTopics: string[];
  onSelectTopic: (topic: string) => void;
  isLoading: boolean;
}

const AssignmentTopicSuggestion: React.FC<AssignmentTopicSuggestionProps> = ({
  enabled,
  onEnabledChange,
  suggestedTopics,
  onSelectTopic,
  isLoading,
}) => {
  return (
    <div className="space-y-3">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <label htmlFor="topic-suggestion-toggle" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
            Suggest Assignment Topic
          </label>
        </div>
        <label className="relative inline-flex items-center cursor-pointer" htmlFor="topic-suggestion-toggle">
          <input
            id="topic-suggestion-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
        </label>
      </div>

      {/* Loading State */}
      {enabled && isLoading && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Generating topic suggestion...
          </span>
        </div>
      )}

      {/* Suggested Topics Display */}
      {enabled && suggestedTopics.length > 0 && !isLoading && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-3">
                AI-Suggested Assignment Topics ({suggestedTopics.length}):
              </p>
              <div className="space-y-2">
                {suggestedTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition-shadow"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {topic}
                    </p>
                    <button
                      onClick={() => onSelectTopic(topic)}
                      className="flex-shrink-0 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors"
                      title="Use this topic"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {enabled && suggestedTopics.length === 0 && !isLoading && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-3">
          Click "Extract Content from Curriculum" to get 5 AI-suggested assignment topics based on your selected curriculum content.
        </p>
      )}
    </div>
  );
};

export default AssignmentTopicSuggestion;

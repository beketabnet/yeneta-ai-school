import React from 'react';

interface LearningObjectivesListProps {
  objectives: string[];
  onAdd: (objective: string) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, value: string) => void;
  suggestions: string[];
  isLoading?: boolean;
}

const LearningObjectivesList: React.FC<LearningObjectivesListProps> = ({
  objectives,
  onAdd,
  onRemove,
  onEdit,
  suggestions,
  isLoading = false,
}) => {
  const [newObjective, setNewObjective] = React.useState('');

  const handleAdd = () => {
    if (newObjective.trim()) {
      onAdd(newObjective.trim());
      setNewObjective('');
    }
  };

  const handleAcceptSuggestion = (suggestion: string) => {
    if (!objectives.includes(suggestion)) {
      onAdd(suggestion);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Learning Objectives (Optional - Enables Alignment Validation)
      </label>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">
              ✨ AI-Extracted Learning Objectives
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700 hover:shadow-sm transition-shadow"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                  {index + 1}. {suggestion}
                </span>
                <button
                  onClick={() => handleAcceptSuggestion(suggestion)}
                  disabled={objectives.includes(suggestion)}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={objectives.includes(suggestion) ? "Already added" : "Add this objective"}
                >
                  {objectives.includes(suggestion) ? '✓ Added' : 'Add'}
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
            Extracting learning objectives...
          </span>
        </div>
      )}

      {/* Current Objectives List */}
      {objectives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Current Objectives ({objectives.length}):
          </p>
          {objectives.map((obj, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                {index + 1}.
              </span>
              <input
                type="text"
                value={obj}
                onChange={(e) => onEdit(index, e.target.value)}
                className="flex-1 p-1.5 text-xs border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => onRemove(index)}
                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex-shrink-0"
                title="Remove objective"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Objective */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newObjective}
          onChange={(e) => setNewObjective(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Enter a learning objective..."
          className="flex-1 p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newObjective.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Add learning objectives to enable alignment validation in the generated rubric
      </p>
    </div>
  );
};

export default LearningObjectivesList;

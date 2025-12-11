import React from 'react';
import { SparklesIcon } from '../../icons/Icons';

interface AssignmentDescriptionGeneratorProps {
  topic: string;
  description: string;
  onDescriptionChange: (description: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const AssignmentDescriptionGenerator: React.FC<AssignmentDescriptionGeneratorProps> = ({
  topic,
  description,
  onDescriptionChange,
  onGenerate,
  isGenerating,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="assignment-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Assignment Description (Optional)
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!topic || isGenerating || disabled}
          className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title={!topic ? "Enter a topic first to generate description" : "Generate AI description for this assignment"}
        >
          <SparklesIcon />
          <span>{isGenerating ? 'Generating...' : 'Generate Description'}</span>
        </button>
      </div>
      
      <textarea
        id="assignment-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={4}
        placeholder="Describe the assignment requirements, expectations, and learning goals... Or click 'Generate Description' to create one automatically."
        className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        disabled={disabled}
      />
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {description.length > 0 ? (
          <>
            {description.length} characters, ~{Math.ceil(description.split(/\s+/).filter(w => w.length > 0).length)} words
          </>
        ) : (
          'This description will be used in Quick Grader and other features'
        )}
      </p>
    </div>
  );
};

export default AssignmentDescriptionGenerator;

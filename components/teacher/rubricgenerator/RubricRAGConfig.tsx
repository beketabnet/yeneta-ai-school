import React from 'react';


interface RubricRAGConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  region: string;
  onRegionChange: (region: string) => void;
  gradeLevel: string;
  onGradeLevelChange: (grade: string) => void;
  stream: string;
  onStreamChange: (stream: string) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  chapterInput: string;
  onChapterInputChange: (input: string) => void;
  enableTopicSuggestion: boolean;
  onTopicSuggestionChange: (enabled: boolean) => void;
  isExtracting: boolean;
  onExtractContent: () => void;
  regions: { id: number; name: string }[];
  gradeLevels: { id: number; name: string }[];
  streams: { id: number; name: string }[];
  availableSubjects: string[];
  extractedChapters: { number: string | number; title: string; label?: string }[];
  isExtractingChapters: boolean;
  onExtractChapters: () => void;
}

const RubricRAGConfig: React.FC<RubricRAGConfigProps> = ({
  enabled,
  onEnabledChange,
  region,
  onRegionChange,
  gradeLevel,
  onGradeLevelChange,
  stream,
  onStreamChange,
  subject,
  onSubjectChange,
  chapterInput,
  onChapterInputChange,
  enableTopicSuggestion,
  onTopicSuggestionChange,
  isExtracting,
  onExtractContent,
  regions,
  gradeLevels,
  streams,
  availableSubjects,
  extractedChapters,
  isExtractingChapters,
  onExtractChapters,
}) => {
  const showStream = gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12';

  return (
    <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-2xl">📚</span>
            Curriculum-Based Rubric Generator (RAG)
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Extract learning objectives and standards from curriculum vector stores
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer" htmlFor="rubric-rag-toggle">
          <input
            id="rubric-rag-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 pt-3 border-t-2 border-blue-200 dark:border-blue-800">
          {/* Region Selection */}
          <div>
            <label htmlFor="rubric-region" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <select
              id="rubric-region"
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Level and Stream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rubric-grade-level" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Grade Level *
              </label>
              <select
                id="rubric-grade-level"
                value={gradeLevel}
                onChange={(e) => onGradeLevelChange(e.target.value)}
                className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Grade Level</option>
                {gradeLevels.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {showStream && (
              <div>
                <label htmlFor="rubric-stream" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Stream *
                </label>
                <select
                  id="rubric-stream"
                  value={stream}
                  onChange={(e) => onStreamChange(e.target.value)}
                  className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="rubric-subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <select
              id="rubric-subject"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Subject</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Extract Chapters Button & Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Available Chapters
              </label>
              <button
                type="button"
                onClick={onExtractChapters}
                disabled={isExtractingChapters || !gradeLevel || !subject}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {isExtractingChapters ? 'Scanning...' : 'Scan for Chapters'}
              </button>
            </div>

            {extractedChapters.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const selected = extractedChapters.find(c => c.number.toString() === e.target.value);
                    if (selected) {
                      const label = selected.label || 'Chapter';
                      onChapterInputChange(`${label} ${selected.number}: ${selected.title}`);
                    }
                  }
                }}
                className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a chapter from list...</option>
                {extractedChapters.map((c, idx) => (
                  <option key={idx} value={c.number.toString()}>
                    {c.label || 'Chapter'} {c.number}: {c.title}
                  </option>
                ))}
              </select>
            )}
            {extractedChapters.length === 0 && !isExtractingChapters && (
              <p className="text-xs text-gray-500 italic">
                Click "Scan for Chapters" to auto-detect chapters from the textbook.
              </p>
            )}
          </div>

          {/* Chapter/Unit/Lesson Input */}
          <div>
            <label htmlFor="rubric-chapter-input" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Chapter / Unit / Lesson
            </label>
            <input
              id="rubric-chapter-input"
              type="text"
              value={chapterInput}
              onChange={(e) => onChapterInputChange(e.target.value)}
              placeholder="e.g., 'Chapter 5' or 'Chapters 3-5' or 'Unit 2'"
              className="w-full p-2.5 text-sm border-2 border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a single chapter (e.g., "5" or "Chapter 5") or a range (e.g., "3-5" or "Chapters 3-5")
            </p>
          </div>

          {/* Topic Suggestion Toggle */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <label htmlFor="rag-topic-suggestion-toggle" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                Suggest Assignment Topics
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" htmlFor="rag-topic-suggestion-toggle">
              <input
                id="rag-topic-suggestion-toggle"
                type="checkbox"
                checked={enableTopicSuggestion}
                onChange={(e) => onTopicSuggestionChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Extract Button */}
          <button
            onClick={onExtractContent}
            disabled={isExtracting || !gradeLevel || !subject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Extracting Content...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Extract Content from Curriculum</span>
              </>
            )}
          </button>

          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>💡 How it works:</strong> The AI will extract learning objectives, MoE standards, and suggest criteria from your curriculum vector stores. You can edit these suggestions before generating the final rubric.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricRAGConfig;

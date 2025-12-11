import React from 'react';

interface RAGConfigPanelProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  grade: string;
  onGradeChange: (grade: string) => void;
  chapterNumber: string;
  onChapterNumberChange: (chapter: string) => void;
  chapterRangeStart: string;
  onChapterRangeStartChange: (start: string) => void;
  chapterRangeEnd: string;
  onChapterRangeEndChange: (end: string) => void;
  useChapterRange: boolean;
  onUseChapterRangeChange: (use: boolean) => void;
}

const RAGConfigPanel: React.FC<RAGConfigPanelProps> = ({
  enabled,
  onEnabledChange,
  subject,
  onSubjectChange,
  grade,
  onGradeChange,
  chapterNumber,
  onChapterNumberChange,
  chapterRangeStart,
  onChapterRangeStartChange,
  chapterRangeEnd,
  onChapterRangeEndChange,
  useChapterRange,
  onUseChapterRangeChange,
}) => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Amharic',
    'History', 'Geography', 'Economics', 'Civics', 'ICT', 'Agriculture'
  ];

  const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            📚 Curriculum-Based Grading (RAG)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use curriculum content for accurate, standards-aligned grading
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer" htmlFor="rag-enabled-toggle">
          <input
            id="rag-enabled-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Subject and Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rag-subject" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <select
                id="rag-subject"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rag-grade" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade Level *
              </label>
              <select
                id="rag-grade"
                value={grade}
                onChange={(e) => onGradeChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapter Selection */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useChapterRange}
                onChange={(e) => onUseChapterRangeChange(e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Use Chapter Range (instead of single chapter)
              </span>
            </label>

            {useChapterRange ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="chapter-range-start" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Chapter
                  </label>
                  <input
                    id="chapter-range-start"
                    type="number"
                    min="1"
                    max="20"
                    value={chapterRangeStart}
                    onChange={(e) => onChapterRangeStartChange(e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="chapter-range-end" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Chapter
                  </label>
                  <input
                    id="chapter-range-end"
                    type="number"
                    min="1"
                    max="20"
                    value={chapterRangeEnd}
                    onChange={(e) => onChapterRangeEndChange(e.target.value)}
                    placeholder="e.g., 3"
                    className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="chapter-number" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chapter Number (Optional)
                </label>
                <input
                  id="chapter-number"
                  type="number"
                  min="1"
                  max="20"
                  value={chapterNumber}
                  onChange={(e) => onChapterNumberChange(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <strong>💡 Tip:</strong> Enabling RAG will grade submissions against curriculum standards for more accurate, context-aware assessment.
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGConfigPanel;

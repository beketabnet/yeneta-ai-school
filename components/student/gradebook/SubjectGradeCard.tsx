import React from 'react';

interface SubjectGradeCardProps {
  subject: string;
  grade_level: string;
  stream?: string;
  teacher_name: string;
  overall_grade: number | null;
  assignment_average: number | null;
  exam_average: number | null;
  isExpanded: boolean;
  onToggle: () => void;
}

const getScoreColor = (score: number | null): string => {
  if (score === null) return 'text-gray-600 dark:text-gray-400';
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 80) return 'text-blue-600 dark:text-blue-400';
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBadge = (score: number | null): string => {
  if (score === null) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  if (score >= 90) return 'bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-sm';
  if (score >= 80) return 'bg-gradient-to-r from-blue-400 to-indigo-600 text-white shadow-sm';
  if (score >= 70) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm';
  if (score >= 60) return 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-sm';
  return 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-sm';
};

const getGradeLabel = (score: number | null): string => {
  if (score === null) return 'N/A';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const SubjectGradeCard: React.FC<SubjectGradeCardProps> = ({
  subject,
  grade_level,
  stream,
  teacher_name,
  overall_grade,
  assignment_average,
  exam_average,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {subject} - Grade {grade_level}
              {stream && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({stream})</span>}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getScoreBadge(overall_grade)}`}>
              {getGradeLabel(overall_grade)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            👨‍🏫 {teacher_name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overall Grade</p>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-2xl ${getScoreColor(overall_grade)}`}>
                {overall_grade !== null && overall_grade > 0 ? `${overall_grade.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="p-5 space-y-4">
            {/* Grade Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Assignments</p>
                <p className={`font-bold text-2xl ${getScoreColor(assignment_average)}`}>
                  {assignment_average !== null && assignment_average > 0 ? `${assignment_average.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Exams</p>
                <p className={`font-bold text-2xl ${getScoreColor(exam_average)}`}>
                  {exam_average !== null && exam_average > 0 ? `${exam_average.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Grade Calculation Info */}
            <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
              <div className="mt-0.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                Overall Grade = (Assignment Average × 0.4) + (Exam Average × 0.6)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectGradeCard;

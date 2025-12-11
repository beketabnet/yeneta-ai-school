import React from 'react';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { BookOpenIcon, UsersIcon, ChartBarIcon, ClockIcon } from '../icons/Icons';

interface Subject {
  id: number;
  title: string;
  grade_level: string;
  student_count: number;
  total_grades: number;
  avg_score: number | null;
}

interface TeacherSubjectsListProps {
  subjects: Subject[];
  selectedSubjectId: number | null;
  onSelectSubject: (subjectId: number) => void;
  isLoading?: boolean;
  onAddGrade?: (subjectId: number) => void;
}

const TeacherSubjectsList: React.FC<TeacherSubjectsListProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  isLoading = false,
  onAddGrade
}) => {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No enrolled subjects</p>
      </div>
    );
  }

  return (
    <ScrollableListContainer className="space-y-2">
      {subjects.map(subject => (
        <div
          key={subject.id}
          onClick={() => onSelectSubject(subject.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedSubjectId === subject.id
              ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{subject.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Grade {subject.grade_level}</p>
              </div>
            </div>
            {subject.avg_score !== null && (
              <div className={`text-lg font-bold ${getScoreColor(subject.avg_score)}`}>
                {subject.avg_score.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <UsersIcon className="h-4 w-4" />
              <span>{subject.student_count} students</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <ChartBarIcon className="h-4 w-4" />
              <span>{subject.total_grades} grades</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <ClockIcon className="h-4 w-4" />
              <span>Active</span>
            </div>
          </div>

          {onAddGrade && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddGrade(subject.id);
              }}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Add Grade
            </button>
          )}
        </div>
      ))}
    </ScrollableListContainer>
  );
};

export default TeacherSubjectsList;

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon, AcademicCapIcon } from '../../icons/Icons';
import { EnrolledSubject } from '../../../services/gradebookService';

interface SubjectsVerticalSliderProps {
  subjects: EnrolledSubject[];
  selectedSubject?: string;
  onSelectSubject?: (subject: EnrolledSubject) => void;
  loading?: boolean;
}

const SubjectsVerticalSlider: React.FC<SubjectsVerticalSliderProps> = ({
  subjects,
  selectedSubject,
  onSelectSubject,
  loading = false,
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const canScrollUp = scrollPosition > 0;
  const canScrollDown =
    scrollContainerRef.current &&
    scrollContainerRef.current.scrollHeight >
      scrollContainerRef.current.clientHeight + scrollPosition;

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop);
    }
  };

  const scroll = (direction: 'up' | 'down') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 100;
      const newPosition =
        direction === 'up'
          ? scrollContainerRef.current.scrollTop - scrollAmount
          : scrollContainerRef.current.scrollTop + scrollAmount;

      scrollContainerRef.current.scrollTo({
        top: newPosition,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AcademicCapIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Enrolled Subjects
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AcademicCapIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Enrolled Subjects
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No subjects found
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <AcademicCapIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Enrolled Subjects ({subjects.length})
        </h3>
      </div>

      <div className="flex flex-col h-96">
        {canScrollUp && (
          <button
            onClick={() => scroll('up')}
            className="flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Scroll up"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="space-y-1 p-2">
            {subjects.map(subject => (
              <button
                key={`${subject.subject_id}_${subject.grade_level}`}
                onClick={() => onSelectSubject?.(subject)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                  selectedSubject === `${subject.subject_name}_${subject.grade_level}`
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {subject.subject_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Grade {subject.grade_level} • {subject.student_count}{' '}
                      {subject.student_count === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                  {subject.average_score != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {subject.average_score.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {canScrollDown && (
          <button
            onClick={() => scroll('down')}
            className="flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {subjects.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
          Total: {subjects.reduce((sum, s) => sum + s.student_count, 0)} students across{' '}
          {subjects.length} subjects
        </div>
      )}
    </div>
  );
};

export default SubjectsVerticalSlider;

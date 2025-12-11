import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../../icons/Icons';
import Card from '../../Card';
import ScrollableListContainer from '../../common/ScrollableListContainer';
import { EnrolledSubject } from '../../../services/gradebookService';

interface EnrolledSubjectsTableProps {
  subjects: any[];
  isLoading?: boolean;
  onAddGrade?: (subject: any) => void;
}

const ROWS_PER_PAGE = 5;

const EnrolledSubjectsTable: React.FC<EnrolledSubjectsTableProps> = ({
  subjects,
  isLoading = false,
  onAddGrade,
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [displayedRows, setDisplayedRows] = useState(ROWS_PER_PAGE);

  // Debug logging
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      console.log('=== ENROLLED SUBJECTS DEBUG ===');
      subjects.forEach((subject, idx) => {
        const isDisabled = subject.subject_id === null || subject.subject_id === undefined;
        console.log(`Subject ${idx}: ${subject.subject_name}`, {
          subject_id: subject.subject_id,
          type: typeof subject.subject_id,
          is_disabled: isDisabled,
          button_status: isDisabled ? '❌ DISABLED' : '✅ ACTIVE',
        });
      });
    }
  }, [subjects]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop);
    }
  };

  const scroll = (direction: 'up' | 'down') => {
    if (scrollContainerRef.current) {
      const rowHeight = 65;
      const scrollAmount = rowHeight * 2;
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

  const canScrollUp = scrollPosition > 0;
  const canScrollDown =
    scrollContainerRef.current &&
    scrollContainerRef.current.scrollHeight >
      scrollContainerRef.current.clientHeight + scrollPosition;

  if (isLoading && subjects.length === 0) {
    return (
      <Card title="Enrolled Subjects">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card title="Enrolled Subjects">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-base font-medium mb-2">No enrolled subjects found</p>
          <p className="text-sm">Students will appear here once they enroll in your subjects.</p>
        </div>
      </Card>
    );
  }


  return (
    <Card title={`Enrolled Subjects (${subjects.length})`} data-testid="subject-list">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Scroll Up Button */}
        {canScrollUp && (
          <button
            onClick={() => scroll('up')}
            className="w-full flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Scroll up"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
        )}

        {/* Table Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto"
          style={{ maxHeight: `${ROWS_PER_PAGE * 65}px` }}
        >
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
              <tr>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3">Grade Level</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-center">Total Students</th>
                <th className="px-4 py-3 text-center">Average Score</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr
                  key={`${subject.subject_id}_${subject.grade_level}_${index}`}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`subject-row subject-row-${index}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {subject.subject_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {subject.grade_level === 'KG' ? 'Grade KG' : `Grade ${subject.grade_level}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1 max-w-xs">
                      {subject.students && subject.students.length > 0 ? (
                        subject.students.slice(0, 2).map((student: any, idx: number) => {
                          const displayName = student.student_name && 
                            student.student_name.trim() && 
                            student.student_name !== 'None None' && 
                            student.student_name !== 'None'
                            ? student.student_name 
                            : student.username || 'Unknown';
                          return (
                            <div key={idx} className="text-gray-700 dark:text-gray-300">
                              {displayName}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-gray-400">No students</span>
                      )}
                      {subject.students && subject.students.length > 2 && (
                        <div className="text-gray-500 dark:text-gray-400 font-medium">
                          +{subject.students.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {subject.student_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {subject.average_score != null ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        {subject.average_score.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const hasValidId = subject.subject_id !== null && subject.subject_id !== undefined;
                      return (
                        <button
                          onClick={() => {
                            console.log(`Clicked Add Grade for ${subject.subject_name} (ID: ${subject.subject_id})`);
                            onAddGrade?.(subject);
                          }}
                          disabled={!hasValidId}
                          title={hasValidId ? 'Add grade for this subject' : 'Subject not available for grading'}
                          data-testid="add-grade-btn"
                          className={`font-medium transition-colors ${
                            hasValidId
                              ? 'text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer'
                              : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Add Grade
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scroll Down Button */}
        {canScrollDown && (
          <button
            onClick={() => scroll('down')}
            className="w-full flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {subjects.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
          Total: {subjects.reduce((sum, s) => sum + s.student_count, 0)} students across{' '}
          {subjects.length} subjects
        </div>
      )}
    </Card>
  );
};

export default EnrolledSubjectsTable;

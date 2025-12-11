import React, { useMemo } from 'react';
import { ChildSummary } from '../../types';
import { useChildEnrolledSubjects } from '../../hooks/useChildEnrolledSubjects';

interface ChildSelectorDropdownProps {
  children: ChildSummary[];
  selectedChildId: number | null;
  onChildSelect: (childId: number) => void;
  isLoading?: boolean;
}

const ChildSelectorDropdown: React.FC<ChildSelectorDropdownProps> = ({
  children,
  selectedChildId,
  onChildSelect,
  isLoading = false
}) => {
  const { subjects } = useChildEnrolledSubjects(selectedChildId);

  // Get unique subjects for selected child
  const enrolledSubjectsText = useMemo(() => {
    if (subjects.length === 0) return 'No subjects';
    const uniqueSubjects = [...new Set(subjects.map(s => s.subject))];
    return uniqueSubjects.slice(0, 2).join(', ') + (uniqueSubjects.length > 2 ? '...' : '');
  }, [subjects]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <label htmlFor="child-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        👨‍👩‍👧 Viewing Dashboard For
      </label>
      <select
        id="child-selector"
        value={selectedChildId || ''}
        onChange={(e) => onChildSelect(Number(e.target.value))}
        disabled={isLoading}
        className="w-full px-4 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
      >
        <option value="">Select a student...</option>
        {children.map(child => {
          // Get enrolled subjects for this child
          const childSubjects = subjects.filter(s => s.student_id === child.id);
          const firstSubject = childSubjects.length > 0 ? childSubjects[0].subject : '';
          const subjectText = firstSubject ? `${firstSubject} - ` : '';

          return (
            <option key={child.id} value={child.id}>
              {subjectText}Grade {child.grade} - {child.name}
            </option>
          );
        })}
      </select>

      {selectedChild && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{selectedChild.name}</span>
            {' '}
            <span className="text-gray-600 dark:text-gray-400">
              • Grade {selectedChild.grade}
            </span>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            📚 Enrolled: {enrolledSubjectsText}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChildSelectorDropdown;

import React from 'react';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';

interface GradeFiltersProps {
  assignmentType: string;
  examType: string;
  onAssignmentTypeChange: (type: string) => void;
  onExamTypeChange: (type: string) => void;
}


const EXAM_TYPES = [
  'Quiz',
  'Mid Exam',
  'Final Exam',
];

const GradeFilters: React.FC<GradeFiltersProps> = ({
  assignmentType,
  examType,
  onAssignmentTypeChange,
  onExamTypeChange,
}) => {
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Assignment Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assignment Type
        </label>
        <select
          aria-label="Filter by assignment type"
          value={assignmentType}
          onChange={(e) => onAssignmentTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingTypes}
        >
          <option value="">All Assignment Types</option>
          {isLoadingTypes ? (
            <option disabled>Loading types...</option>
          ) : (
            assignmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Exam Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Exam Type
        </label>
        <select
          aria-label="Filter by exam type"
          value={examType}
          onChange={(e) => onExamTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GradeFilters;

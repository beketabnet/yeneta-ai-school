import React, { useMemo } from 'react';
import { SearchIcon, ChevronDownIcon, XMarkIcon } from '../../icons/Icons';
import { GradebookFilters, GradebookStudent } from '../../../hooks/useGradebookManager';
import { EnrolledSubject } from '../../../services/gradebookService';
import { useAssignmentTypes, useExamTypes } from '../../../hooks/useAssignmentTypes';

interface GradebookManagerFiltersProps {
  filters: GradebookFilters;
  onFilterChange: (filters: GradebookFilters) => void;
  students: GradebookStudent[];
  allSubjects?: string[] | EnrolledSubject[];
  allGradeLevels: string[];
  subjectsLoading?: boolean;
}

const GradebookManagerFilters: React.FC<GradebookManagerFiltersProps> = ({
  filters,
  onFilterChange,
  students,
  allSubjects = [],
  allGradeLevels,
  subjectsLoading = false,
}) => {
  const { types: assignmentTypes, isLoading: isLoadingAssignmentTypes } = useAssignmentTypes();
  const { types: examTypes, isLoading: isLoadingExamTypes } = useExamTypes();

  const isEnrolledSubjectArray = (arr: any[]): arr is EnrolledSubject[] => {
    return arr.length > 0 && 'subject_name' in arr[0];
  };

  const subjectNames = useMemo(() => {
    if (!Array.isArray(allSubjects)) return [];
    if (allSubjects.length === 0) return [];

    if (isEnrolledSubjectArray(allSubjects)) {
      return allSubjects.map(s => s.subject_name);
    }
    return (allSubjects as string[]);
  }, [allSubjects]);

  const gradeLevelOptions = useMemo(() => {
    const GRADE_LEVELS = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const enrolledLevels = new Set(allGradeLevels);
    return GRADE_LEVELS.filter(level => enrolledLevels.has(level));
  }, [allGradeLevels]);

  const handleSubjectChange = (subject: string) => {
    onFilterChange({ ...filters, subject: subject || undefined });
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    onFilterChange({ ...filters, gradeLevel: gradeLevel || undefined });
  };

  const handleStreamChange = (stream: string) => {
    onFilterChange({ ...filters, stream: stream || undefined });
  };

  const handleAssignmentTypeChange = (assignmentType: string) => {
    onFilterChange({ ...filters, assignmentType: assignmentType || undefined });
  };

  const handleExamTypeChange = (examType: string) => {
    onFilterChange({ ...filters, examType: examType || undefined });
  };

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, searchStudent: search || undefined });
  };

  const handleResetFilters = () => {
    onFilterChange({});
  };

  const streams = useMemo(() => {
    return [...new Set(students.map(s => s.stream).filter(Boolean))];
  }, [students]);

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            title="Reset all filters"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Student
          </label>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.searchStudent || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={subjectsLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {subjectsLoading ? 'Loading subjects...' : 'All Subjects'}
            </option>
            {subjectNames.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade Level
          </label>
          <select
            value={filters.gradeLevel || ''}
            onChange={(e) => handleGradeLevelChange(e.target.value)}
            disabled={subjectsLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Levels</option>
            {gradeLevelOptions.map(level => (
              <option key={level} value={level}>
                {level === 'KG' ? 'Grade KG' : `Grade ${level}`}
              </option>
            ))}
          </select>
        </div>

        {streams.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stream
            </label>
            <select
              value={filters.stream || ''}
              onChange={(e) => handleStreamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Streams</option>
              {streams.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignment Type
          </label>
          <select
            value={filters.assignmentType || ''}
            onChange={(e) => handleAssignmentTypeChange(e.target.value)}
            disabled={isLoadingAssignmentTypes}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          >
            <option value="">All Types</option>
            {assignmentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exam Type
          </label>
          <select
            value={filters.examType || ''}
            onChange={(e) => handleExamTypeChange(e.target.value)}
            disabled={isLoadingExamTypes}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          >
            <option value="">All Types</option>
            {examTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};

export default GradebookManagerFilters;

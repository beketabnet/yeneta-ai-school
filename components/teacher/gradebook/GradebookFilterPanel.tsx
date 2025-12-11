import React, { useState } from 'react';
import { ChartBarIcon, XMarkIcon } from '../../icons/Icons';
import { useAssignmentTypes } from '../../../hooks/useAssignmentTypes';

interface GradebookFilterPanelProps {
  subjects: string[];
  students: Array<{ id: number; name: string; grade: string }>;
  selectedSubject: string;
  selectedStudent: number | null;
  selectedAssignmentType: string;
  selectedExamType: string;
  viewMode: 'table' | 'card';
  searchTerm: string;
  onSubjectChange: (subject: string) => void;
  onStudentChange: (studentId: number | null) => void;
  onAssignmentTypeChange: (type: string) => void;
  onExamTypeChange: (type: string) => void;
  onViewModeChange: (mode: 'table' | 'card') => void;
  onSearchChange: (term: string) => void;
  onReset: () => void;
}


const EXAM_TYPES = ['Quiz', 'Mid Exam', 'Final Exam'];

const GradebookFilterPanel: React.FC<GradebookFilterPanelProps> = ({
  subjects,
  students,
  selectedSubject,
  selectedStudent,
  selectedAssignmentType,
  selectedExamType,
  viewMode,
  searchTerm,
  onSubjectChange,
  onStudentChange,
  onAssignmentTypeChange,
  onExamTypeChange,
  onViewModeChange,
  onSearchChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();

  const hasActiveFilters =
    selectedSubject ||
    selectedStudent ||
    selectedAssignmentType ||
    selectedExamType ||
    searchTerm;

  const filteredStudents = students;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters & Options</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              {[selectedSubject, selectedStudent, selectedAssignmentType, selectedExamType, searchTerm].filter(
                Boolean
              ).length}{' '}
              active
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Grades
            </label>
            <input
              type="text"
              placeholder="Search by student name, subject..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div>
              <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                id="subject-filter"
                aria-label="Filter by subject"
                value={selectedSubject}
                onChange={(e) => {
                  onSubjectChange(e.target.value);
                  onStudentChange(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Filter */}
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student
              </label>
              <select
                id="student-filter"
                aria-label="Filter by student"
                value={selectedStudent || ''}
                onChange={(e) => onStudentChange(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedSubject}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Students</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - Grade {student.grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Type Filter */}
            <div>
              <label htmlFor="assignment-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignment Type
              </label>
              <select
                id="assignment-type-filter"
                aria-label="Filter by assignment type"
                value={selectedAssignmentType}
                onChange={(e) => onAssignmentTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingTypes}
              >
                <option value="">All Types</option>
                {isLoadingTypes ? (
                  <option disabled>Loading types...</option>
                ) : (
                  assignmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Exam Type Filter */}
            <div>
              <label htmlFor="exam-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Type
              </label>
              <select
                id="exam-type-filter"
                aria-label="Filter by exam type"
                value={selectedExamType}
                onChange={(e) => onExamTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
              <button
                onClick={() => onViewModeChange('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => onViewModeChange('card')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Card
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradebookFilterPanel;

import React, { useState } from 'react';
import Card from '../Card';

interface GradebookFiltersEnhancedProps {
  subjects: string[];
  students: Array<{ id: number; name: string }>;
  gradeStatuses: string[];
  onFilter: (filters: {
    subject?: string;
    student_id?: number;
    status?: string;
    search?: string;
  }) => void;
  isLoading?: boolean;
}

const GradebookFiltersEnhanced: React.FC<GradebookFiltersEnhancedProps> = ({
  subjects,
  students,
  gradeStatuses,
  onFilter,
  isLoading = false
}) => {
  const [filters, setFilters] = useState({
    subject: '',
    student_id: '',
    status: '',
    search: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);

    // Apply filters
    onFilter({
      subject: newFilters.subject || undefined,
      student_id: newFilters.student_id ? parseInt(newFilters.student_id) : undefined,
      status: newFilters.status || undefined,
      search: newFilters.search || undefined
    });
  };

  const handleReset = () => {
    setFilters({
      subject: '',
      student_id: '',
      status: '',
      search: ''
    });
    onFilter({});
  };

  return (
    <Card title="Filters">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Subject Filter */}
        <div>
          <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject
          </label>
          <select
            id="subject-filter"
            name="subject"
            value={filters.subject}
            onChange={handleChange}
            disabled={isLoading}
            aria-label="Filter by subject"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
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
            name="student_id"
            value={filters.student_id}
            onChange={handleChange}
            disabled={isLoading}
            aria-label="Filter by student"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleChange}
            disabled={isLoading}
            aria-label="Filter by status"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Statuses</option>
            {gradeStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-500 dark:hover:bg-gray-500 disabled:opacity-50 font-medium transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </Card>
  );
};

export default GradebookFiltersEnhanced;

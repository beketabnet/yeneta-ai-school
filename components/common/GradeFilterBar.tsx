import React from 'react';

interface GradeFilterBarProps {
  subjects: string[];
  students: { id: number; name: string }[];
  assignmentTypes: string[];
  examTypes: string[];
  filters: {
    subject: string;
    student_id: number | null;
    assignment_type: string;
    exam_type: string;
  };
  onFilterChange: (filters: any) => void;
}

const GradeFilterBar: React.FC<GradeFilterBarProps> = ({
  subjects,
  students,
  assignmentTypes,
  examTypes,
  filters,
  onFilterChange
}) => {
  const handleChange = (key: string, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject
        </label>
        <select
          value={filters.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          title="Filter by subject"
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Student
        </label>
        <select
          value={filters.student_id || ''}
          onChange={(e) => handleChange('student_id', e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          title="Filter by student"
        >
          <option value="">All Students</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Assignment Type
        </label>
        <select
          value={filters.assignment_type}
          onChange={(e) => handleChange('assignment_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          title="Filter by assignment type"
        >
          <option value="">All Assignments</option>
          {assignmentTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Exam Type
        </label>
        <select
          value={filters.exam_type}
          onChange={(e) => handleChange('exam_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          title="Filter by exam type"
        >
          <option value="">All Exams</option>
          {examTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GradeFilterBar;

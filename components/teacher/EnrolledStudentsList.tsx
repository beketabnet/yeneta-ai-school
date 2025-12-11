import React, { useState, useMemo } from 'react';
import { EnrolledStudent } from '../../hooks/useTeacherEnrolledStudents';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { UserCircleIcon } from '../icons/Icons';

interface EnrolledStudentsListProps {
  students: EnrolledStudent[];
  selectedStudentId: number | null;
  onSelectStudent: (student: EnrolledStudent) => void;
  isLoading: boolean;
}

const EnrolledStudentsList: React.FC<EnrolledStudentsListProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student =>
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.student_name.localeCompare(b.student_name));
    } else {
      filtered.sort((a, b) => a.grade_level.localeCompare(b.grade_level));
    }

    return filtered;
  }, [students, searchTerm, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No enrolled students found. Students will appear here once they enroll in your subjects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          aria-label="Sort students by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'grade')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="grade">Sort by Grade</option>
        </select>
      </div>

      {/* Students List */}
      <ScrollableListContainer className="border border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="space-y-2 p-2">
          {filteredAndSortedStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No students match your search criteria.</p>
            </div>
          ) : (
            filteredAndSortedStudents.map(student => (
              <button
                key={student.student_id}
                onClick={() => onSelectStudent(student)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                  selectedStudentId === student.student_id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{student.student_name}</p>
                    <p className={`text-sm ${
                      selectedStudentId === student.student_id
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Grade {student.grade_level}
                      {student.stream && ` - ${student.stream}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    selectedStudentId === student.student_id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {student.subjects.length} subject{student.subjects.length !== 1 ? 's' : ''}
                  </span>
                  {selectedStudentId === student.student_id && (
                    <span className="text-lg">→</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollableListContainer>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default EnrolledStudentsList;

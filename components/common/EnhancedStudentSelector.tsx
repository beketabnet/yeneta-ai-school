import React, { useState, useEffect, useRef } from 'react';

export interface StudentOption {
  id: number;
  name: string;
  grade?: string;
  grade_level?: string;
  subject?: string; // Added subject for better filtering
}

interface EnhancedStudentSelectorProps {
  students: StudentOption[];
  selectedStudentId: number | null;
  onSelect: (studentId: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const EnhancedStudentSelector: React.FC<EnhancedStudentSelectorProps> = ({
  students,
  selectedStudentId,
  onSelect,
  label = 'Select Student',
  placeholder = 'Choose a student...',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatStudentLabel = (student: StudentOption): string => {
    // Logic for formatting the label
    // If it has a subject, show it (this matches the "All Students" vs Specific Course logic in ParentDashboard)
    // The name from ParentDashboard already includes format "Grade X - Name - Subject", so maybe just use name?
    // Let's stick to the name provided if it's already formatted, otherwise fallback.
    return student.name;
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.grade && student.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
        >
          <span className="block truncate">
            {selectedStudent ? formatStudentLabel(selectedStudent) : placeholder}
          </span>
          <span className="ml-2 pointer-events-none text-gray-400">▼</span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {filteredStudents.length === 0 ? (
              <div className="cursor-default select-none relative py-2 px-4 text-gray-700 dark:text-gray-400">
                No results found.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100 dark:hover:bg-blue-900/50 ${selectedStudentId === student.id ? 'text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-900 dark:text-gray-100'}`}
                  onClick={() => {
                    onSelect(student.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span className={`block truncate ${selectedStudentId === student.id ? 'font-semibold' : 'font-normal'}`}>
                    {formatStudentLabel(student)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default EnhancedStudentSelector;

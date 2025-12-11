import React from 'react';
import { ChartSubjectData } from '../../../hooks/useGradeChartData';

interface GradeChartFiltersProps {
  subjects: ChartSubjectData[];
  filters: {
    subject?: string;
    grade_level?: string;
  };
  onFilterChange: (filters: { subject?: string; grade_level?: string }) => void;
}

const GradeChartFilters: React.FC<GradeChartFiltersProps> = ({
  subjects,
  filters,
  onFilterChange
}) => {
  // Get unique subjects and grade levels, properly deduplicated
  // Extract and filter valid subjects
  const subjectSet = new Set<string>();
  subjects.forEach(s => {
    if (s && s.subject) {
      const subject = String(s.subject).trim();
      if (subject && subject !== 'Unknown' && subject !== '') {
        subjectSet.add(subject);
      }
    }
  });
  const uniqueSubjects = Array.from(subjectSet).sort();
  
  // Extract and filter valid grade levels
  const gradeLevelSet = new Set<string>();
  subjects.forEach(s => {
    if (s && s.grade_level) {
      const gradeLevel = String(s.grade_level).trim();
      if (gradeLevel && gradeLevel !== 'Unknown' && gradeLevel !== '') {
        gradeLevelSet.add(gradeLevel);
      }
    }
  });
  const uniqueGradeLevels = Array.from(gradeLevelSet).sort((a, b) => {
    // Sort grade levels numerically
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  // Debug logging
  console.log('=== GradeChartFilters Debug ===');
  console.log('Subjects received:', subjects.length);
  if (subjects.length > 0) {
    console.log('First subject:', subjects[0]);
    console.log('Subject field:', subjects[0].subject);
    console.log('Grade level field:', subjects[0].grade_level);
  }
  console.log('Unique subjects extracted:', uniqueSubjects);
  console.log('Unique grade levels extracted:', uniqueGradeLevels);
  console.log('================================');

  const handleSubjectChange = (subject: string) => {
    onFilterChange({
      subject: subject || undefined,
      grade_level: filters.grade_level
    });
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    onFilterChange({
      subject: filters.subject,
      grade_level: gradeLevel || undefined
    });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  // Always show filters, even if data is loading or empty
  // This ensures the UI is consistent and ready for data

  return (
    <div className="flex flex-wrap gap-4 items-center mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Subject Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subject:
        </label>
        <select
          id="subject-filter"
          aria-label="Filter by subject"
          value={filters.subject || ''}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Subjects ({uniqueSubjects.length})</option>
          {uniqueSubjects.map((subject, idx) => (
            <option key={`${subject}-${idx}`} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Level Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="grade-level-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Grade Level:
        </label>
        <select
          id="grade-level-filter"
          aria-label="Filter by grade level"
          value={filters.grade_level || ''}
          onChange={(e) => handleGradeLevelChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Grades ({uniqueGradeLevels.length})</option>
          {uniqueGradeLevels.map((gradeLevel, idx) => (
            <option key={`${gradeLevel}-${idx}`} value={gradeLevel}>
              Grade {gradeLevel}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      {(filters.subject || filters.grade_level) && (
        <button
          onClick={handleReset}
          className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default GradeChartFilters;

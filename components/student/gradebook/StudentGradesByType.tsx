import React, { useState } from 'react';
import { SubjectGrades, StudentGradeData } from '../../../hooks/useStudentGradesEnhanced';
import StudentGradeDetail from './StudentGradeDetail';

interface StudentGradesByTypeProps {
  subject: SubjectGrades;
}

const StudentGradesByType: React.FC<StudentGradesByTypeProps> = ({ subject }) => {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const groupGradesByType = (grades: StudentGradeData[]): Record<string, StudentGradeData[]> => {
    const grouped: Record<string, StudentGradeData[]> = {};
    
    if (!grades) return grouped;
    
    for (const grade of grades) {
      const type = 'type';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(grade);
    }
    
    return grouped;
  };

  const calculateTypeAverage = (grades: StudentGradeData[]): number | null => {
    if (!grades || grades.length === 0) return null;
    
    let totalPercentage = 0;
    for (const grade of grades) {
      const percentage = grade.max_score > 0 
        ? (grade.score / grade.max_score) * 100 
        : 0;
      totalPercentage += percentage;
    }
    
    return Math.round((totalPercentage / grades.length) * 100) / 100;
  };

  const getGradeColor = (average: number | null): string => {
    if (average === null) return 'text-gray-500';
    if (average >= 90) return 'text-green-600 dark:text-green-400';
    if (average >= 80) return 'text-blue-600 dark:text-blue-400';
    if (average >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (average >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const renderGradeSection = (title: string, grades: StudentGradeData[]) => {
    if (!grades || grades.length === 0) {
      return null;
    }

    const average = calculateTypeAverage(grades);

    return (
      <div key={title} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <button
          onClick={() => setExpandedType(expandedType === title ? null : title)}
          className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {grades.length} grade{grades.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${getGradeColor(average)}`}>
                {average !== null ? average.toFixed(1) : 'N/A'}%
              </span>
              <span className={`ml-2 inline-block transform transition-transform ${
                expandedType === title ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </div>
          </div>
        </button>

        {expandedType === title && (
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {grades.map((grade, idx) => (
                <StudentGradeDetail
                  key={`${title}-${idx}`}
                  grade={grade}
                  subject={subject.subject}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {subject.assignmentGrades && subject.assignmentGrades.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Assignment Grades</h3>
          </div>
          <div>
            {renderGradeSection('Assignments', subject.assignmentGrades)}
          </div>
        </div>
      )}

      {subject.examGrades && subject.examGrades.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Exam Grades</h3>
          </div>
          <div>
            {renderGradeSection('Exams', subject.examGrades)}
          </div>
        </div>
      )}

      {(!subject.assignmentGrades || subject.assignmentGrades.length === 0) &&
       (!subject.examGrades || subject.examGrades.length === 0) && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No grades available for this subject yet.
        </div>
      )}
    </div>
  );
};

export default StudentGradesByType;

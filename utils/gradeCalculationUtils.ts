/**
 * Grade Calculation Utilities
 * Provides functions for calculating overall grades, GPA, and grade statistics
 */

export interface GradeEntry {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  assignment_type?: string;
  exam_type?: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  graded_at: string;
}

export interface GradeBreakdown {
  assignmentGrades: GradeEntry[];
  examGrades: GradeEntry[];
  overallPercentage: number;
  letterGrade: string;
}

export interface SubjectGrades {
  subject: string;
  grades: GradeEntry[];
  overallPercentage: number;
  letterGrade: string;
  assignmentAverage: number;
  examAverage: number;
}

/**
 * Convert percentage to letter grade
 */
export const percentageToLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * Calculate overall grade for a student in a subject
 */
export const calculateOverallGrade = (grades: GradeEntry[]): number => {
  if (grades.length === 0) return 0;
  
  const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
  return totalPercentage / grades.length;
};

/**
 * Calculate average for a specific grade type
 */
export const calculateGradeTypeAverage = (
  grades: GradeEntry[],
  type: 'assignment' | 'exam'
): number => {
  const filtered = type === 'assignment'
    ? grades.filter(g => g.assignment_type && !g.exam_type)
    : grades.filter(g => g.exam_type && !g.assignment_type);

  if (filtered.length === 0) return 0;
  
  const totalPercentage = filtered.reduce((sum, grade) => sum + grade.percentage, 0);
  return totalPercentage / filtered.length;
};

/**
 * Get grade breakdown by type
 */
export const getGradeBreakdown = (grades: GradeEntry[]): GradeBreakdown => {
  const assignmentGrades = grades.filter(g => g.assignment_type && !g.exam_type);
  const examGrades = grades.filter(g => g.exam_type && !g.assignment_type);
  
  const overallPercentage = calculateOverallGrade(grades);
  const letterGrade = percentageToLetterGrade(overallPercentage);

  return {
    assignmentGrades,
    examGrades,
    overallPercentage,
    letterGrade
  };
};

/**
 * Get grades grouped by subject
 */
export const getGradesBySubject = (grades: GradeEntry[]): Map<string, SubjectGrades> => {
  const subjectMap = new Map<string, SubjectGrades>();

  grades.forEach(grade => {
    if (!subjectMap.has(grade.subject)) {
      subjectMap.set(grade.subject, {
        subject: grade.subject,
        grades: [],
        overallPercentage: 0,
        letterGrade: 'F',
        assignmentAverage: 0,
        examAverage: 0
      });
    }

    const subject = subjectMap.get(grade.subject)!;
    subject.grades.push(grade);
  });

  // Calculate statistics for each subject
  subjectMap.forEach(subject => {
    subject.overallPercentage = calculateOverallGrade(subject.grades);
    subject.letterGrade = percentageToLetterGrade(subject.overallPercentage);
    subject.assignmentAverage = calculateGradeTypeAverage(subject.grades, 'assignment');
    subject.examAverage = calculateGradeTypeAverage(subject.grades, 'exam');
  });

  return subjectMap;
};

/**
 * Calculate GPA (Grade Point Average)
 * Assumes 4.0 scale: A=4.0, B=3.0, C=2.0, D=1.0, F=0.0
 */
export const calculateGPA = (grades: GradeEntry[]): number => {
  if (grades.length === 0) return 0;

  const gradePoints: { [key: string]: number } = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
  };

  const totalPoints = grades.reduce((sum, grade) => {
    const letterGrade = percentageToLetterGrade(grade.percentage);
    return sum + (gradePoints[letterGrade] || 0);
  }, 0);

  return totalPoints / grades.length;
};

/**
 * Get grade statistics for a student
 */
export const getGradeStatistics = (grades: GradeEntry[]) => {
  if (grades.length === 0) {
    return {
      totalGrades: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      gpa: 0,
      subjectCount: 0
    };
  }

  const percentages = grades.map(g => g.percentage);
  const subjects = new Set(grades.map(g => g.subject));

  return {
    totalGrades: grades.length,
    averagePercentage: calculateOverallGrade(grades),
    highestScore: Math.max(...percentages),
    lowestScore: Math.min(...percentages),
    gpa: calculateGPA(grades),
    subjectCount: subjects.size
  };
};

/**
 * Format grade for display
 */
export const formatGradeDisplay = (score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  return `${score}/${maxScore} (${percentage.toFixed(1)}%)`;
};

/**
 * Get grade color based on percentage
 */
export const getGradeColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-green-600 dark:text-green-400';
  if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
  if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

/**
 * Get grade background color based on percentage
 */
export const getGradeBgColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/20';
  if (percentage >= 80) return 'bg-blue-100 dark:bg-blue-900/20';
  if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
  if (percentage >= 60) return 'bg-orange-100 dark:bg-orange-900/20';
  return 'bg-red-100 dark:bg-red-900/20';
};

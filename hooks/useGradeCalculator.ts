import { useMemo } from 'react';

export interface GradeData {
  id: number;
  score: number;
  max_score: number;
  assignment_type?: string;
  exam_type?: string;
  percentage?: number;
}

export interface GradeCalculation {
  overallGrade: number | null;
  assignmentAverage: number | null;
  examAverage: number | null;
  assignmentCount: number;
  examCount: number;
}

const ASSIGNMENT_WEIGHT = 0.4;
const EXAM_WEIGHT = 0.6;

export const useGradeCalculator = (grades: GradeData[]): GradeCalculation => {
  return useMemo(() => {
    if (!grades || grades.length === 0) {
      return {
        overallGrade: null,
        assignmentAverage: null,
        examAverage: null,
        assignmentCount: 0,
        examCount: 0
      };
    }

    const assignmentGrades = grades.filter(g => g.assignment_type && !g.exam_type);
    const examGrades = grades.filter(g => g.exam_type);

    let assignmentAverage: number | null = null;
    let examAverage: number | null = null;

    if (assignmentGrades.length > 0) {
      const assignmentPercentages = assignmentGrades
        .map(g => (g.score / g.max_score) * 100)
        .filter(p => !isNaN(p));
      
      if (assignmentPercentages.length > 0) {
        assignmentAverage = assignmentPercentages.reduce((a, b) => a + b, 0) / assignmentPercentages.length;
      }
    }

    if (examGrades.length > 0) {
      const examPercentages = examGrades
        .map(g => (g.score / g.max_score) * 100)
        .filter(p => !isNaN(p));
      
      if (examPercentages.length > 0) {
        examAverage = examPercentages.reduce((a, b) => a + b, 0) / examPercentages.length;
      }
    }

    let overallGrade: number | null = null;
    if (assignmentAverage !== null && examAverage !== null) {
      overallGrade = (assignmentAverage * ASSIGNMENT_WEIGHT) + (examAverage * EXAM_WEIGHT);
    } else if (assignmentAverage !== null) {
      overallGrade = assignmentAverage;
    } else if (examAverage !== null) {
      overallGrade = examAverage;
    }

    return {
      overallGrade: overallGrade ? Math.round(overallGrade * 100) / 100 : null,
      assignmentAverage: assignmentAverage ? Math.round(assignmentAverage * 100) / 100 : null,
      examAverage: examAverage ? Math.round(examAverage * 100) / 100 : null,
      assignmentCount: assignmentGrades.length,
      examCount: examGrades.length
    };
  }, [grades]);
};

import { test, expect } from '@playwright/test';
import { getSubjectsForGrade, GRADE_LEVELS, STREAMS } from '../utils/curriculumData';

test.describe('Curriculum Data', () => {
  test('should export correct constants', () => {
    expect(GRADE_LEVELS).toContain('KG');
    expect(GRADE_LEVELS).toContain('Grade 1');
    expect(GRADE_LEVELS).toContain('Grade 12');
    expect(STREAMS).toEqual(['Natural Science', 'Social Science']);
  });

  test('should return correct subjects for KG', () => {
    const subjects = getSubjectsForGrade('KG');
    expect(subjects).toContain('Developing Literacy');
    expect(subjects).toContain('Developing Numeracy');
  });

  test('should return correct subjects for Grade 8', () => {
    const subjects = getSubjectsForGrade('Grade 8');
    expect(subjects).toContain('Biology');
    expect(subjects).toContain('Chemistry');
    expect(subjects).toContain('Physics');
    expect(subjects).toContain('Social Studies');
  });

  test('should return correct subjects for Grade 11 Natural Science', () => {
    const subjects = getSubjectsForGrade('Grade 11', 'Natural Science');
    expect(subjects).toContain('Physics');
    expect(subjects).toContain('Technical Drawing');
    expect(subjects).not.toContain('Geography'); // Geography is Social Science
  });

  test('should return correct subjects for Grade 11 Social Science', () => {
    const subjects = getSubjectsForGrade('Grade 11', 'Social Science');
    expect(subjects).toContain('Geography');
    expect(subjects).toContain('Economics');
    expect(subjects).not.toContain('Physics'); // Physics is Natural Science
  });

  test('should return empty array for invalid inputs', () => {
    expect(getSubjectsForGrade('')).toEqual([]);
    expect(getSubjectsForGrade('Grade 11', 'Invalid Stream')).toEqual([]);
  });

  test('should identify non-English subjects correctly', () => {
    const { isNonEnglishSubject } = require('../utils/curriculumData');
    expect(isNonEnglishSubject('Amharic')).toBe(true);
    expect(isNonEnglishSubject('Mother Tongue')).toBe(true);
    expect(isNonEnglishSubject('Physics')).toBe(false);
    expect(isNonEnglishSubject('Mathematics')).toBe(false);
    expect(isNonEnglishSubject('National Language/Mother Tongue')).toBe(true);
  });
});

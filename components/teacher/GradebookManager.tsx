import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { apiService } from '../../services/apiService';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';
import { useCurriculum } from '../../hooks/useCurriculum';
import { AcademicCapIcon, PencilIcon, CheckIcon, XMarkIcon } from '../icons/Icons';

interface Student {
  id: number;
  name: string;
  grade_level: string;
  stream?: string;
}

interface GradeEntry {
  id?: number;
  student_id: number;
  subject: string;
  grade_level: string;
  stream?: string;
  assignment_type: string;
  assignment_name: string;
  score: number | null;
  max_score: number;
  date_graded?: string;
}

interface GradebookFilters {
  region: string;
  grade_level: string;
  subject: string;
  stream: string;
  assignment_type: string;
}

const GradebookManager: React.FC = () => {
  const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [filters, setFilters] = useState<GradebookFilters>({
    region: 'Addis Ababa',
    grade_level: '',
    subject: '',
    stream: '',
    assignment_type: ''
  });
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();

  // Helper functions
  // Helper functions
  const isGrade11Or12 = (grade: string) => grade === 'Grade 11' || grade === 'Grade 12';

  // Fetch subjects when filters change
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!filters.grade_level) {
        setAvailableSubjects([]);
        return;
      }
      try {
        const subjects = await getSubjectsFor(
          filters.region || undefined,
          filters.grade_level,
          filters.stream || undefined
        );
        setAvailableSubjects(subjects || []);

        // Reset subject if not in new list
        if (filters.subject && subjects && !subjects.includes(filters.subject)) {
          setFilters(prev => ({ ...prev, subject: '' }));
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        setAvailableSubjects([]);
      }
    };
    fetchSubjects();
  }, [filters.region, filters.grade_level, filters.stream, getSubjectsFor]);
  const [editingCell, setEditingCell] = useState<{ studentId: number, assignmentName: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for now
  const mockStudents: Student[] = [
    { id: 1, name: 'Abebe Kebede', grade_level: 'Grade 10' },
    { id: 2, name: 'Tirunesh Dibaba', grade_level: 'Grade 10' },
    { id: 3, name: 'Haile Gebrselassie', grade_level: 'Grade 11', stream: 'Natural Science' },
    { id: 4, name: 'Derartu Tulu', grade_level: 'Grade 11', stream: 'Social Science' },
  ];

  const mockGrades: GradeEntry[] = [
    { student_id: 1, subject: 'Mathematics', grade_level: 'Grade 10', assignment_type: 'Quiz', assignment_name: 'Quadratic Equations Quiz', score: 95, max_score: 100 },
    { student_id: 1, subject: 'Mathematics', grade_level: 'Grade 10', assignment_type: 'Assignment', assignment_name: 'Linear Systems Assignment', score: 89, max_score: 100 },
    { student_id: 2, subject: 'Mathematics', grade_level: 'Grade 10', assignment_type: 'Quiz', assignment_name: 'Quadratic Equations Quiz', score: 87, max_score: 100 },
    { student_id: 3, subject: 'Physics', grade_level: 'Grade 11', stream: 'Natural Science', assignment_type: 'Lab Report', assignment_name: 'Mechanics Lab', score: 92, max_score: 100 },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls - only fetch students enrolled in teacher's approved courses
      // For now, filter mock data to simulate enrolled students
      const enrolledStudents = mockStudents.filter(student => {
        // Simulate: only show students enrolled in teacher's courses
        return !filters.grade_level || student.grade_level === filters.grade_level;
      });

      setStudents(enrolledStudents);
      setGrades(mockGrades.filter(grade =>
        enrolledStudents.some(student => student.id === grade.student_id) &&
        (!filters.subject || grade.subject === filters.subject) &&
        (!filters.stream || grade.stream === filters.stream) &&
        (!filters.assignment_type || grade.assignment_type === filters.assignment_type)
      ));
    } catch (error) {
      console.error('Error loading gradebook data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes with dependencies
  const handleGradeLevelChange = (value: string) => {
    const newFilters = { ...filters, grade_level: value };
    if (!isGrade11Or12(value)) {
      newFilters.stream = '';
      newFilters.subject = '';
    }
    setFilters(newFilters);
  };

  const handleStreamChange = (value: string) => {
    const newFilters = { ...filters, stream: value };
    // Reset subject when stream changes for grades 11-12
    if (isGrade11Or12(filters.grade_level)) {
      newFilters.subject = '';
    }
    setFilters(newFilters);
  };

  const getFilteredStudents = () => {
    return students.filter(student =>
      (!filters.grade_level || student.grade_level === filters.grade_level) &&
      (!filters.stream || student.stream === filters.stream)
    );
  };

  const getFilteredAssignments = () => {
    const assignments = new Set<string>();
    grades.forEach(grade => {
      if ((!filters.subject || grade.subject === filters.subject) &&
        (!filters.assignment_type || grade.assignment_type === filters.assignment_type)) {
        assignments.add(`${grade.assignment_name} (${grade.max_score})`);
      }
    });
    return Array.from(assignments);
  };

  const getStudentGrade = (studentId: number, assignmentName: string) => {
    const assignment = assignmentName.split(' (')[0];
    const grade = grades.find(g => g.student_id === studentId && g.assignment_name === assignment);
    return grade ? grade.score : null;
  };

  const handleEditStart = (studentId: number, assignmentName: string) => {
    const currentScore = getStudentGrade(studentId, assignmentName);
    setEditingCell({ studentId, assignmentName });
    setEditValue(currentScore?.toString() || '');
  };

  const handleEditSave = async () => {
    if (!editingCell) return;

    const score = parseFloat(editValue);
    if (isNaN(score) || score < 0) {
      alert('Please enter a valid score');
      return;
    }

    const assignment = editingCell.assignmentName.split(' (')[0];
    const maxScore = parseInt(editingCell.assignmentName.split('(')[1].replace(')', ''));

    if (score > maxScore) {
      alert(`Score cannot exceed maximum score of ${maxScore}`);
      return;
    }

    try {
      // TODO: API call to save grade
      const updatedGrades = grades.map(grade =>
        grade.student_id === editingCell.studentId && grade.assignment_name === assignment
          ? { ...grade, score }
          : grade
      );

      // If grade doesn't exist, add it
      const existingGrade = grades.find(g => g.student_id === editingCell.studentId && g.assignment_name === assignment);
      if (!existingGrade) {
        const newGrade: GradeEntry = {
          student_id: editingCell.studentId,
          subject: filters.subject || 'Mathematics', // TODO: Get from assignment
          grade_level: filters.grade_level || 'Grade 10',
          stream: filters.stream,
          assignment_type: filters.assignment_type || (assignmentTypes.length > 0 ? assignmentTypes[0].value : 'quiz'),
          assignment_name: assignment,
          score,
          max_score: maxScore
        };
        updatedGrades.push(newGrade);
      }

      setGrades(updatedGrades);
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade');
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const filteredStudents = getFilteredStudents();
  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="space-y-6">
      <Card title="Gradebook Manager">
        <div className="flex items-center mb-6">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gradebook Manager</h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grade Level
            </label>
            <select
              value={filters.grade_level}
              onChange={(e) => handleGradeLevelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {gradeLevels.map(level => (
                <option key={level.id} value={level.name}>{level.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stream
            </label>
            <select
              value={filters.stream}
              onChange={(e) => handleStreamChange(e.target.value)}
              disabled={!isGrade11Or12(filters.grade_level)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isGrade11Or12(filters.grade_level) ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">All Streams</option>
              {streams.map(stream => (
                <option key={stream.id} value={stream.name}>{stream.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={availableSubjects.length === 0}
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assignment Type
            </label>
            <select
              value={filters.assignment_type}
              onChange={(e) => setFilters({ ...filters, assignment_type: e.target.value })}
              disabled={isLoadingTypes}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{isLoadingTypes ? 'Loading...' : 'All Types'}</option>
              {assignmentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gradebook Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading gradebook...</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg">
            <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                    Student Name
                  </th>
                  {filteredAssignments.map(assignment => (
                    <th key={assignment} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b min-w-[120px]">
                      {assignment}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-b sticky left-0 bg-white dark:bg-gray-800">
                      {student.name}
                      <br />
                      <span className="text-xs text-gray-500">
                        Grade {student.grade_level}{student.stream ? ` - ${student.stream}` : ''}
                      </span>
                    </td>
                    {filteredAssignments.map(assignment => {
                      const score = getStudentGrade(student.id, assignment);
                      const isEditing = editingCell?.studentId === student.id && editingCell?.assignmentName === assignment;

                      return (
                        <td key={assignment} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0"
                                step="0.5"
                              />
                              <button
                                onClick={handleEditSave}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center justify-between"
                              onClick={() => handleEditStart(student.id, assignment)}
                            >
                              <span>{score !== null ? `${score}` : '-'}</span>
                              <PencilIcon className="h-3 w-3 text-gray-400 ml-1" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No students found matching the selected filters.
          </div>
        )}
      </Card>
    </div>
  );
};

export default GradebookManager;
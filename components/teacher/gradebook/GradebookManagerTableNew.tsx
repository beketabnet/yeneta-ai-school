import React, { useState, useMemo } from 'react';
import { PencilIcon, PlusIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../../icons/Icons';
import { StudentGradeRecord } from '../../../hooks/useGradebookManager';
import GradeTypeModal from './GradeTypeModal';

interface GradebookManagerTableProps {
  grades: StudentGradeRecord[];
  isLoading: boolean;
  onSaveGrade: (gradeData: any) => Promise<void>;
}

interface ModalState {
  isOpen: boolean;
  studentId: number;
  studentName: string;
  subject: string;
  gradeType: 'assignment' | 'quiz' | 'mid_exam' | 'final_exam' | null;
  currentScore?: number;
}

const GradebookManagerTableNew: React.FC<GradebookManagerTableProps> = ({
  grades,
  isLoading,
  onSaveGrade,
}) => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    studentId: 0,
    studentName: '',
    subject: '',
    gradeType: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const openModal = (
    studentId: number,
    studentName: string,
    subject: string,
    gradeType: 'assignment' | 'quiz' | 'mid_exam' | 'final_exam',
    currentScore?: number
  ) => {
    setModal({
      isOpen: true,
      studentId,
      studentName,
      subject,
      gradeType,
      currentScore: currentScore || 0,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      studentId: 0,
      studentName: '',
      subject: '',
      gradeType: null,
    });
  };

  const handleSaveGrade = async (gradeData: any) => {
    setIsSaving(true);
    try {
      // Transform modal data to API format
      const apiData = {
        student_id: modal.studentId,
        subject: modal.subject,
        grade_level: grades.find(g => g.student_id === modal.studentId)?.grade_level,
        stream: grades.find(g => g.student_id === modal.studentId)?.stream,
        score: gradeData.score,
        max_score: 100,
        feedback: gradeData.feedback,
      };

      // Add type based on gradeType
      if (modal.gradeType === 'assignment') {
        apiData['assignment_type'] = 'Assignment';
      } else if (modal.gradeType === 'quiz') {
        apiData['assignment_type'] = 'Quiz';
      } else if (modal.gradeType === 'mid_exam') {
        apiData['exam_type'] = 'Mid Exam';
      } else if (modal.gradeType === 'final_exam') {
        apiData['exam_type'] = 'Final Exam';
      }

      await onSaveGrade(apiData);
      closeModal();
    } catch (err) {
      console.error('Error saving grade:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedByStudent = useMemo(() => {
    const grouped: Record<number, StudentGradeRecord[]> = {};
    grades.forEach(grade => {
      if (!grouped[grade.student_id]) {
        grouped[grade.student_id] = [];
      }
      grouped[grade.student_id].push(grade);
    });
    return grouped;
  }, [grades]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading gradebook...</p>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No enrolled subjects found. Students will appear here once they enroll in your subjects.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Mid Exam
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Final Exam
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, idx) => (
                <tr
                  key={`${grade.student_id}_${grade.subject}_${idx}`}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {grade.student_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {grade.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    Grade {grade.grade_level}
                    {grade.stream && ` - ${grade.stream}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {grade.requested_at
                      ? new Date(grade.requested_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell
                      score={grade.assignment_score}
                      onClick={() =>
                        openModal(
                          grade.student_id,
                          grade.student_name,
                          grade.subject,
                          'assignment',
                          grade.assignment_score
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell
                      score={grade.quiz_score}
                      onClick={() =>
                        openModal(
                          grade.student_id,
                          grade.student_name,
                          grade.subject,
                          'quiz',
                          grade.quiz_score
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell
                      score={grade.mid_exam_score}
                      onClick={() =>
                        openModal(
                          grade.student_id,
                          grade.student_name,
                          grade.subject,
                          'mid_exam',
                          grade.mid_exam_score
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell
                      score={grade.final_exam_score}
                      onClick={() =>
                        openModal(
                          grade.student_id,
                          grade.student_name,
                          grade.subject,
                          'final_exam',
                          grade.final_exam_score
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      -
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {grade.overall_score !== undefined ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        {grade.overall_score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          openModal(
                            grade.student_id,
                            grade.student_name,
                            grade.subject,
                            'assignment'
                          )
                        }
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit grades"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GradeTypeModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onSave={handleSaveGrade}
        studentName={modal.studentName}
        subject={modal.subject}
        gradeType={modal.gradeType || 'assignment'}
        currentScore={modal.currentScore}
        isSaving={isSaving}
      />
    </>
  );
};

// Helper component for score cells
const ScoreCell: React.FC<{
  score?: number;
  onClick: () => void;
}> = ({ score, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100 transition-colors"
  >
    {score !== undefined && score !== null ? (
      <>
        <span>{score.toFixed(1)}</span>
        <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
      </>
    ) : (
      <>
        <PlusIcon className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Add</span>
      </>
    )}
  </button>
);

export default GradebookManagerTableNew;

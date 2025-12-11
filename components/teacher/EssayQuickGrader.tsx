import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { GradedSubmission, Assignment, Submission } from '../../types';
import { apiService } from '../../services/apiService';
import { ClipboardDocumentCheckIcon, SparklesIcon } from '../icons/Icons';
import RubricInput from './quickgrader/RubricInput';
import SubmissionTextInput from './quickgrader/SubmissionTextInput';

const EssayQuickGrader: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [result, setResult] = useState<GradedSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customRubric, setCustomRubric] = useState<string>('');
  const [useCustomRubric, setUseCustomRubric] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getAssignments();
        setAssignments(data);
        if (data.length > 0) {
          setSelectedAssignmentId(data[0].id.toString());
        }
      } catch (err) {
        setError('Failed to load assignments.');
      }
      setIsLoading(false);
    };
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (!selectedAssignmentId) {
        setSubmissions([]);
        setSelectedSubmission(null);
        return;
    };

    const fetchSubmissions = async () => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setSelectedSubmission(null);
      try {
        const data = await apiService.getSubmissions(parseInt(selectedAssignmentId));
        setSubmissions(data);
        if(data.length > 0) {
            setSelectedSubmission(data[0]);
        }
      } catch (err) {
        setError('Failed to load submissions for this assignment.');
      }
      setIsLoading(false);
    };
    fetchSubmissions();
  }, [selectedAssignmentId]);

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const gradedResult = await apiService.gradeSubmission(selectedSubmission.id);
      setResult(gradedResult);
      // Update submission in local state to reflect it's graded
      setSubmissions(subs => subs.map(s => s.id === selectedSubmission.id ? { ...s, grade: gradedResult.overallScore, feedback: gradedResult.overallFeedback } : s));
    } catch (err) {
      setError('An error occurred while grading the essay. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromGenerator = () => {
    // TODO: Open Rubric Generator modal or navigate to it
    alert('Rubric Generator integration coming soon!');
  };
  
  const currentAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);

  return (
    <Card title="AI-Powered Essay QuickGrader">
      <div className="mb-4">
        <label htmlFor="assignment-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Assignment</label>
        <select
          id="assignment-select"
          value={selectedAssignmentId}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isLoading || assignments.length === 0}
        >
          {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="md:col-span-1 h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-2 space-y-2">
            {isLoading && <p>Loading...</p>}
            {submissions.map(sub => (
                 <button key={sub.id} onClick={() => setSelectedSubmission(sub)} className={`w-full text-left p-3 rounded-md ${selectedSubmission?.id === sub.id ? 'bg-primary-light dark:bg-primary-dark/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{sub.student.username}</p>
                    <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-500 dark:text-gray-400">Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                        {sub.grade !== null ? (
                             <span className="px-2 py-1 bg-success text-white font-bold rounded-full">Graded: {sub.grade}</span>
                        ) : (
                             <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">Pending</span>
                        )}
                    </div>
                </button>
            ))}
        </div>

        {/* Grader Interface */}
        <div className="md:col-span-2">
            {selectedSubmission ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     <div className="space-y-4">
                         <h3 className="text-lg font-semibold">{selectedSubmission.student.username}'s Submission</h3>
                        {/* Rubric Toggle */}
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="use-custom-rubric"
                                checked={useCustomRubric}
                                onChange={(e) => {
                                    setUseCustomRubric(e.target.checked);
                                    if (e.target.checked && !customRubric) {
                                        setCustomRubric(currentAssignment?.rubric || '');
                                    }
                                }}
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="use-custom-rubric" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Use Custom Rubric
                            </label>
                        </div>

                        {/* Rubric Input */}
                        {useCustomRubric ? (
                            <RubricInput
                                value={customRubric}
                                onChange={setCustomRubric}
                                onImportFromGenerator={handleImportFromGenerator}
                            />
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grading Rubric (Assignment)</label>
                                <textarea value={currentAssignment?.rubric} readOnly rows={4} className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        )}

                        {/* Submission Text */}
                        <SubmissionTextInput
                            value={selectedSubmission.submitted_text}
                            onChange={() => {}} // Read-only
                            readOnly={true}
                            studentName={selectedSubmission.student.username}
                        />
                        <button onClick={handleGrade} disabled={isLoading} className="w-full flex justify-center items-center space-x-2 px-4 py-2 text-white font-semibold bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400">
                            <ClipboardDocumentCheckIcon />
                            <span>{isLoading ? 'Grading...' : 'Grade with AI'}</span>
                        </button>
                    </div>
                     <div className="space-y-4">
                        {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}
                        {result && (
                             <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 h-full">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Overall Score</p>
                                    <p className="text-5xl font-bold text-primary dark:text-secondary">{result.overallScore}<span className="text-2xl text-gray-400">/{(result as any).maxScore || 100}</span></p>
                                    {(result as any).grade_letter && (
                                        <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
                                            Grade: {(result as any).grade_letter} ({(result as any).performance_level})
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 bg-primary-light dark:bg-gray-800 rounded-md">
                                    <h4 className="font-semibold mb-1 text-primary-dark dark:text-gray-200">Overall Feedback</h4>
                                    <p className="text-sm">{result.overallFeedback}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Criteria Breakdown</h4>
                                    <div className="space-y-3">
                                    {result.criteriaFeedback.map((item, index) => (
                                        <div key={index}>
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-medium text-sm">{item.criterion}</p>
                                            <p className="font-bold text-sm text-primary dark:text-secondary">{item.score}/10</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-600">{item.feedback}</p>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Select a student submission to grade.</p>
                </div>
            )}
        </div>
      </div>
    </Card>
  );
};

export default EssayQuickGrader;
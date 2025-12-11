import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { AuthenticityResult, Assignment, Submission } from '../../types';
import { apiService } from '../../services/apiService';
import { useAssignmentTypes } from '../../hooks/useAssignmentTypes';
import { DocumentTextIcon, ClipboardDocumentCheckIcon, UploadCloudIcon, CheckCircleIcon, ScaleIcon } from '../icons/Icons';
import { isNonEnglishSubject } from '../../utils/curriculumData';
import AuthenticityAnimation from './AuthenticityAnimation';

const AuthenticityChecker: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [result, setResult] = useState<AuthenticityResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { types: assignmentTypes, isLoading: isLoadingTypes } = useAssignmentTypes();
    const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('');

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Refs for height alignment
    const leftPanelRef = React.useRef<HTMLDivElement>(null);
    const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        const updateHeight = () => {
            if (leftPanelRef.current) {
                setPanelHeight(leftPanelRef.current.offsetHeight);
            }
        };
        updateHeight();
        const timer = setTimeout(updateHeight, 100);
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [assignments, submissions, isLoading]); // Update when content changes



    useEffect(() => {
        const fetchAssignments = async () => {
            setIsLoading(true);
            try {
                console.log('Fetching assignments with type:', selectedAssignmentType);
                // Fetch both regular assignments and student assignment topics
                const [regularAssignments, studentAssignmentTopics] = await Promise.all([
                    apiService.getAssignments(selectedAssignmentType),
                    apiService.getTeacherStudentAssignmentTopics()
                ]);

                // Filter student assignment topics by type if selected
                const filteredTopics = selectedAssignmentType
                    ? studentAssignmentTopics.filter((t: any) => t.document_type === selectedAssignmentType)
                    : studentAssignmentTopics;

                console.log('Fetched regular assignments:', regularAssignments);
                console.log('Fetched student assignment topics:', filteredTopics);

                const allAssignments = [...regularAssignments, ...filteredTopics];
                setAssignments(allAssignments);

                if (allAssignments.length > 0) {
                    setSelectedAssignmentId(allAssignments[0].id.toString());
                } else {
                    setSelectedAssignmentId('');
                }
            } catch (err) {
                console.error('Error fetching assignments:', err);
                setError('Failed to load assignments.');
            }
            setIsLoading(false);
        };
        fetchAssignments();
    }, [selectedAssignmentType]);

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
                let data;
                if (selectedAssignmentId.toString().startsWith('sa_')) {
                    // It's a student assignment topic
                    const topic = selectedAssignmentId.toString().substring(3); // Remove 'sa_' prefix
                    data = await apiService.getTeacherStudentAssignmentSubmissions(topic);
                } else {
                    // It's a regular assignment
                    data = await apiService.getSubmissions(parseInt(selectedAssignmentId));
                }
                setSubmissions(data);
                if (data.length > 0) {
                    setSelectedSubmission(data[0]);
                }
            } catch (err) {
                setError('Failed to load submissions for this assignment.');
            }
            setIsLoading(false);
        };
        fetchSubmissions();

        // Polling for dynamic updates
        const intervalId = setInterval(async () => {
            if (!selectedAssignmentId) return;
            try {
                let data;
                if (selectedAssignmentId.toString().startsWith('sa_')) {
                    const topic = selectedAssignmentId.toString().substring(3);
                    data = await apiService.getTeacherStudentAssignmentSubmissions(topic);
                } else {
                    data = await apiService.getSubmissions(parseInt(selectedAssignmentId));
                }

                setSubmissions(prev => {
                    if (data.length !== prev.length) {
                        return data;
                    }
                    return prev;
                });
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(intervalId);
    }, [selectedAssignmentId]);

    const [extractedText, setExtractedText] = useState<string>('');

    // --- Persistence Logic ---

    // Load cached data on mount
    useEffect(() => {
        const cachedResult = localStorage.getItem('cached_authenticity_result');
        if (cachedResult) {
            try {
                setResult(JSON.parse(cachedResult));
            } catch (e) {
                console.error("Failed to parse cached authenticity result", e);
            }
        }

        const cachedConfig = localStorage.getItem('cached_authenticity_checker_config');
        if (cachedConfig) {
            try {
                const config = JSON.parse(cachedConfig);
                if (config.selectedAssignmentType) setSelectedAssignmentType(config.selectedAssignmentType);
                if (config.selectedAssignmentId) setSelectedAssignmentId(config.selectedAssignmentId);
                if (config.extractedText) setExtractedText(config.extractedText);
            } catch (e) {
                console.error("Failed to parse cached authenticity config", e);
            }
        }
    }, []);

    // Save result to cache
    useEffect(() => {
        if (result) {
            localStorage.setItem('cached_authenticity_result', JSON.stringify(result));
        }
    }, [result]);

    // Save config to cache
    useEffect(() => {
        const config = {
            selectedAssignmentType,
            selectedAssignmentId,
            extractedText
        };
        localStorage.setItem('cached_authenticity_checker_config', JSON.stringify(config));
    }, [selectedAssignmentType, selectedAssignmentId, extractedText]);

    // --- End Persistence Logic ---

    useEffect(() => {
        const loadContent = async () => {
            if (selectedSubmission) {
                if (selectedSubmission.submitted_text) {
                    setExtractedText(selectedSubmission.submitted_text);
                } else if ((selectedSubmission as any).submitted_file) {
                    setExtractedText('Loading file content...');
                    try {
                        const fileUrl = (selectedSubmission as any).submitted_file;
                        // Use apiService.get to handle baseURL and auth, and ensure we get a blob
                        const blob = await apiService.get(fileUrl, { responseType: 'blob' });

                        const fileName = fileUrl.split('/').pop() || 'submitted_file';
                        const fileExt = fileName.split('.').pop()?.toLowerCase();

                        if (fileExt === 'txt') {
                            const text = await blob.text();
                            setExtractedText(text);
                        } else if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc') {
                            const file = new File([blob], fileName, { type: blob.type });
                            const { text } = await apiService.extractFileText(file);
                            setExtractedText(text);
                        } else {
                            // Try to read as text for other formats, fallback to message
                            try {
                                const text = await blob.text();
                                setExtractedText(text);
                            } catch (e) {
                                setExtractedText(`[Binary file - Content could not be read]\n\nFile: ${fileName}\nSize: ${(blob.size / 1024).toFixed(2)} KB`);
                            }
                        }
                    } catch (e: any) {
                        console.error('Failed to load file content:', e);
                        setExtractedText(`Failed to load file content: ${e.message || 'Unknown error'}`);
                    }
                } else {
                    setExtractedText('');
                }
            } else if (!uploadedFile) {
                setExtractedText('');
            }
        };
        loadContent();
    }, [selectedSubmission, uploadedFile]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setUploadedFile(file);
            setSelectedSubmission(null); // Deselect submission when file is uploaded
            setResult(null);
            setError(null);
            setExtractedText('Extracting text from file...');

            try {
                const { text } = await apiService.extractFileText(file);
                setExtractedText(text);
            } catch (err) {
                console.error('Failed to extract text:', err);
                setExtractedText('Failed to extract text from file. The file will still be checked for authenticity.');
            }
        }
    };

    const handleCheck = async () => {
        if (!selectedSubmission && !uploadedFile) return;

        // Check if assignment subject is non-English (only if checking a submission linked to an assignment)
        if (selectedSubmission) {
            const assignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
            if (assignment && (assignment as any).subject && isNonEnglishSubject((assignment as any).subject)) {
                setError(`AI Authenticity Check is disabled for ${(assignment as any).subject} as it is optimized for English.`);
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            let authenticityResult;
            if (uploadedFile) {
                authenticityResult = await apiService.checkSubmissionAuthenticity(undefined, uploadedFile);
            } else if (selectedSubmission) {
                const isStudentAssignment = (selectedSubmission as any).is_student_assignment;
                authenticityResult = await apiService.checkSubmissionAuthenticity(selectedSubmission.id, undefined, isStudentAssignment);
                // Update submission in local state
                setSubmissions(subs => subs.map(s => s.id === selectedSubmission.id ? { ...s, authenticity_score: authenticityResult.originality_score, ai_likelihood: authenticityResult.ai_likelihood } : s));
            }
            setResult(authenticityResult);
        } catch (err) {
            setError('An error occurred while checking the text. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score > 85) return 'text-success';
        if (score > 60) return 'text-warning';
        return 'text-danger';
    };

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl shadow-inner">
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-300 dark:to-fuchsia-300">
                        AI & Plagiarism Detector
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Verify student work authenticity with advanced AI analysis</p>
                </div>
            </div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="assignment-type-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Assignment Type</label>
                    <select
                        id="assignment-type-select"
                        value={selectedAssignmentType}
                        onChange={(e) => setSelectedAssignmentType(e.target.value)}
                        className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
                        disabled={isLoadingTypes}
                    >
                        <option value="">All Types</option>
                        {assignmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="assignment-select-auth" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Assignment</label>
                    <select
                        id="assignment-select-auth"
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className="w-full p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
                        disabled={isLoading || assignments.length === 0}
                    >
                        <option value="">-- Select Assignment --</option>
                        {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submissions List */}
                <div ref={leftPanelRef} className="md:col-span-1 h-[60vh] overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 custom-scrollbar">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 transition-colors group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 cursor-pointer">
                            <UploadCloudIcon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                            Upload File to Check
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300 cursor-pointer"
                        />
                        {uploadedFile && <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Selected: {uploadedFile.name}</p>}
                    </div>
                    {isLoading && !submissions.length && <p className="text-center text-gray-500 py-4">Loading submissions...</p>}
                    {submissions.map(sub => (
                        <button key={sub.id} onClick={() => { setSelectedSubmission(sub); setUploadedFile(null); }} className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${selectedSubmission?.id === sub.id ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 shadow-md ring-1 ring-violet-500/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm'}`}>
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{sub.student.username}</p>
                                {sub.authenticity_score !== null ? (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">Checked</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600">Pending</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                <span>Submitted:</span>
                                <span className="font-medium">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                </div>
                {/* Checker Interface */}
                <div className="md:col-span-2">
                    {selectedSubmission || uploadedFile ? (
                        <div
                            className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar"
                            style={{ height: panelHeight ? `${panelHeight}px` : '60vh' }}
                        >
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {uploadedFile ? `Checking File: ${uploadedFile.name}` : `Submission Text for ${selectedSubmission?.student.username}`}
                                </label>
                                <textarea
                                    value={extractedText}
                                    readOnly
                                    rows={20}
                                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-sm font-mono shadow-inner focus:ring-0 resize-none"
                                />
                                <button
                                    onClick={handleCheck}
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center space-x-2 px-6 py-4 text-white font-bold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                                >
                                    <ClipboardDocumentCheckIcon className="w-6 h-6" />
                                    <span>{isLoading ? 'Running Analysis...' : 'Check Authenticity'}</span>
                                </button>
                                {selectedSubmission && assignments.find(a => a.id.toString() === selectedAssignmentId) && (assignments.find(a => a.id.toString() === selectedAssignmentId) as any).subject && isNonEnglishSubject((assignments.find(a => a.id.toString() === selectedAssignmentId) as any).subject) && (
                                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200 text-center">
                                        ⚠️ AI Detection is disabled for local language subjects.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}
                                {result && (
                                    <div className="space-y-6 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm h-full flex flex-col">
                                        <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">Analysis Report</h3>
                                        <div className="grid grid-cols-2 gap-4 text-center mb-6">
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Originality Score</p>
                                                <p className={`text-4xl font-black ${getScoreColor(result.originality_score)}`}>{result.originality_score}%</p>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">AI Likelihood</p>
                                                <p className={`text-4xl font-black ${getScoreColor(100 - (result.ai_likelihood === 'Very High' ? 95 : result.ai_likelihood === 'High' ? 75 : result.ai_likelihood === 'Medium' ? 50 : 10))}`}>{result.ai_likelihood}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                                <ScaleIcon className="w-4 h-4" /> Flagged Sections
                                            </h4>
                                            {result.flagged_sections && result.flagged_sections.length > 0 ? (
                                                <div className="space-y-3">
                                                    {result.flagged_sections.map((item: any, index: number) => (
                                                        <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-xl">
                                                            <p className="text-sm italic text-gray-800 dark:text-gray-200 mb-2 border-l-2 border-yellow-400 pl-2">"{item.text}"</p>
                                                            <div className="flex items-start gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                                                                <span className="font-bold uppercase tracking-wider">Reason:</span>
                                                                <span>{item.reason}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-8 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl text-center h-40">
                                                    <CheckCircleIcon className="w-10 h-10 text-green-500 mb-2" />
                                                    <p className="text-green-700 dark:text-green-300 font-medium">No significant issues detected.</p>
                                                    <p className="text-green-600/70 dark:text-green-400/70 text-sm">The content appears original.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: panelHeight ? `${panelHeight}px` : '60vh' }}>
                            <AuthenticityAnimation />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthenticityChecker;
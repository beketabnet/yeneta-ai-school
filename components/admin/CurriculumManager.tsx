import React, { useState, useEffect, useCallback } from 'react';
import { VectorStore } from '../../types';
import { apiService } from '../../services/apiService';
import {
    DatabaseIcon,
    UploadCloudIcon,
    TrashIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    MapPinIcon,
    AcademicCapIcon,
    BookOpenIcon
} from '../icons/Icons';
import { useCurriculum } from '../../hooks/useCurriculum';

// Moved outside component to avoid recreation and potential issues
const StatusBadge: React.FC<{ status: 'Active' | 'Processing' | 'Failed' | string }> = ({ status }) => {
    const styles: Record<string, string> = {
        Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse',
        Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    };

    // Fallback for unknown status
    const badgeStyle = styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200';

    return (
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${badgeStyle}`}>
            {status}
        </span>
    );
};

const CurriculumManager: React.FC = () => {
    const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [grade, setGrade] = useState('Grade 1');
    const [subject, setSubject] = useState('');
    const [region, setRegion] = useState('Addis Ababa');
    const [stream, setStream] = useState<'Natural Science' | 'Social Science' | 'N/A'>('N/A');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Curriculum configuration state
    const { regions, gradeLevels, streams, getSubjectsFor } = useCurriculum();
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [isStreamRequired, setIsStreamRequired] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Filter states
    const [filterRegion, setFilterRegion] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterStream, setFilterStream] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterAvailableSubjects, setFilterAvailableSubjects] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Safe access to arrays
    const safeRegions = Array.isArray(regions) ? regions : [];
    const safeGradeLevels = Array.isArray(gradeLevels) ? gradeLevels : [];
    const safeStreams = Array.isArray(streams) ? streams : [];

    // Fetch subjects for filters
    useEffect(() => {
        const fetchFilterSubjects = async () => {
            if (!filterGrade) {
                setFilterAvailableSubjects([]);
                return;
            }
            try {
                const subjects = await getSubjectsFor(
                    filterRegion || undefined,
                    filterGrade,
                    filterStream || undefined
                );
                setFilterAvailableSubjects(Array.isArray(subjects) ? subjects : []);
            } catch (err) {
                console.error('Failed to fetch filter subjects:', err);
                setFilterAvailableSubjects([]);
            }
        };
        fetchFilterSubjects();
    }, [filterRegion, filterGrade, filterStream, getSubjectsFor]);

    // Filtered vector stores
    const filteredVectorStores = Array.isArray(vectorStores) ? vectorStores.filter(vs => {
        const matchesRegion = filterRegion ? vs.region === filterRegion : true;
        const matchesGrade = filterGrade ? vs.grade === filterGrade : true;
        const matchesStream = filterStream ? vs.stream === filterStream : true;
        const matchesSubject = filterSubject ? vs.subject === filterSubject : true;
        return matchesRegion && matchesGrade && matchesStream && matchesSubject;
    }) : [];

    const activeFilterCount = [filterRegion, filterGrade, filterStream, filterSubject].filter(Boolean).length;

    const fetchVectorStores = useCallback(async () => {
        try {
            const data = await apiService.getVectorStores();
            if (Array.isArray(data)) {
                setVectorStores(data);
            } else {
                console.warn('API returned non-array for vector stores:', data);
                setVectorStores([]);
            }
        } catch (err) {
            setError('Failed to fetch curriculum data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSubjectsForGrade = useCallback(async (selectedGrade: string, selectedStream?: string) => {
        try {
            const subjects = await getSubjectsFor(region, selectedGrade, selectedStream);
            const safeSubjects = Array.isArray(subjects) ? subjects : [];
            setAvailableSubjects(safeSubjects);

            const requiresStream = selectedGrade === 'Grade 11' || selectedGrade === 'Grade 12';
            setIsStreamRequired(requiresStream);

            // Set first subject as default if current subject is not in the list
            if (safeSubjects.length > 0 && !safeSubjects.includes(subject)) {
                setSubject(safeSubjects[0]);
            }
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
            setAvailableSubjects([]);
        }
    }, [subject, region, getSubjectsFor]);

    useEffect(() => {
        fetchVectorStores();
    }, [fetchVectorStores]);

    useEffect(() => {
        if (grade) {
            const streamParam = (grade === 'Grade 11' || grade === 'Grade 12') && stream !== 'N/A' ? stream : undefined;
            fetchSubjectsForGrade(grade, streamParam);
        }
    }, [grade, stream, region, fetchSubjectsForGrade]);

    // Polling effect for processing stores
    useEffect(() => {
        if (!Array.isArray(vectorStores)) return;

        const hasProcessingStores = vectorStores.some(vs => vs.status === 'Processing');
        if (!hasProcessingStores) {
            return;
        }

        const interval = setInterval(() => {
            console.log("Polling for vector store status updates...");
            fetchVectorStores();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [vectorStores, fetchVectorStores]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const fileType = droppedFile.name.split('.').pop()?.toLowerCase();
            if (['pdf', 'docx', 'txt'].includes(fileType || '')) {
                setFile(droppedFile);
            } else {
                setError('Invalid file type. Please upload PDF, DOCX, or TXT.');
            }
        }
    };

    const handleProcessFile = async () => {
        if (!file) {
            setError('Please select a file to process.');
            return;
        }

        // Check file size (max 200MB)
        const maxSize = 200 * 1024 * 1024; // 200MB
        if (file.size > maxSize) {
            setError(`File size exceeds 200MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
            return;
        }

        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('grade', grade);
        formData.append('subject', subject);
        formData.append('region', region);
        const finalStream = (grade === 'Grade 11' || grade === 'Grade 12') ? stream : 'N/A';
        formData.append('stream', finalStream);

        try {
            const newStore = await apiService.createVectorStore(formData);
            setVectorStores(prev => [newStore, ...prev]);
        } catch (err) {
            const errorMessage = (err as any).response?.data?.file?.[0] || (err as any).response?.data?.detail || 'Failed to process the document. Please try again.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsProcessing(false);
            setFile(null);
        }
    };

    const handleDeleteStore = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this vector store? This action cannot be undone.")) {
            return;
        }

        // Optimistic UI update
        setVectorStores(prev => prev.map(vs => vs.id === id ? { ...vs, isDeleting: true } : vs));

        try {
            await apiService.deleteVectorStore(id);
            setVectorStores(prev => prev.filter(vs => vs.id !== id));
        } catch (err) {
            setError('Failed to delete the vector store.');
            // Revert optimistic update on failure
            setVectorStores(prev => prev.map(vs => vs.id === id ? { ...vs, isDeleting: false } : vs));
            console.error(err);
        }
    }

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-gray-800/50">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
                        <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Curriculum RAG Pipeline
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and index educational content for AI access.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                        Total Docs: {vectorStores.length}
                    </div>
                    <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800/50">
                        Active: {Array.isArray(vectorStores) ? vectorStores.filter(v => v.status === 'Active').length : 0}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Panel: Upload Form */}
                <div className="w-full lg:w-1/3 bg-gray-50/50 dark:bg-gray-900/30 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                            <UploadCloudIcon className="w-4 h-4 text-blue-500" />
                            Upload Document
                        </h3>

                        <div className="space-y-4">
                            {/* Drag & Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragOver
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                            >
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <label htmlFor="file-upload" className="block cursor-pointer">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">Click to upload</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">PDF, DOCX, TXT up to 200MB</p>
                                {file && (
                                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 font-medium flex items-center justify-center gap-2 animate-in fade-in zoom-in">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        {file.name}
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Region</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <select
                                            value={region}
                                            onChange={e => setRegion(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        >
                                            {safeRegions.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Grade</label>
                                        <div className="relative">
                                            <AcademicCapIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <select
                                                value={grade}
                                                onChange={e => {
                                                    setGrade(e.target.value);
                                                    setStream('N/A');
                                                }}
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                            >
                                                {safeGradeLevels.map(g => (
                                                    <option key={g.id} value={g.name}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Subject</label>
                                        <div className="relative">
                                            <BookOpenIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <select
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none disabled:opacity-50"
                                                disabled={availableSubjects.length === 0}
                                            >
                                                {availableSubjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {isStreamRequired && (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                            Stream <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={stream}
                                            onChange={e => setStream(e.target.value as any)}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            {safeStreams.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleProcessFile}
                                disabled={isProcessing || !file}
                                className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        <span>Indexing...</span>
                                    </>
                                ) : (
                                    <>
                                        <DatabaseIcon className="w-4 h-4" />
                                        <span>Create Index</span>
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: List */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showFilters || activeFilterCount > 0
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                <FunnelIcon className="w-3.5 h-3.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-0.5">{activeFilterCount}</span>
                                )}
                            </button>
                            {/* Quick filter badges/chips can go here if needed */}
                        </div>

                        <div className="relative w-full sm:w-64">
                            <MagnifyingGlassIcon className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Regions</option>
                                {safeRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Grades</option>
                                {safeGradeLevels.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                            </select>
                            <select value={filterStream} onChange={(e) => setFilterStream(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Streams</option>
                                {safeStreams.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Subjects</option>
                                {filterAvailableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-gray-900/50">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : filteredVectorStores.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                    <DatabaseIcon className="w-8 h-8" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No vector stores found.</p>
                                <p className="text-xs text-gray-400 mt-1">Upload a document to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredVectorStores.map(vs => (
                                    <div
                                        key={vs.id}
                                        className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group ${vs.isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                                                    <DocumentTextIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1" title={vs.file_name}>
                                                        {vs.file_name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                                            {vs.grade}
                                                        </span>
                                                        {vs.stream !== 'N/A' && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">
                                                                {vs.stream}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                                                            {vs.subject}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <StatusBadge status={vs.status} />
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(vs.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPinIcon className="w-3 h-3" />
                                                    {vs.region || 'Addis Ababa'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DatabaseIcon className="w-3 h-3" />
                                                    {vs.chunk_count ? `${vs.chunk_count} Chunks` : 'Processing...'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteStore(vs.id)}
                                                className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {vs.status === 'Failed' && (vs as any).error_message && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                                                <strong>Error:</strong> {(vs as any).error_message}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurriculumManager;
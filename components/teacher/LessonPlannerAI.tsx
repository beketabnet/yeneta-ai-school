import React, { useState, useEffect } from 'react';
import type { LessonPlan, LessonResult, UserStats } from '../../types';
import { generateLessonPlan } from '../../services/geminiService';
import { Loader2, Wand2, History, Trash2, BarChart, Flame, Star, TrendingUp, Globe, BookOpen, ArrowLeft } from 'lucide-react';
import { type AuthenticatedUser } from '../../types';
import ImageGenerationModeSelector from '@/components/VirtualClassroom/ImageGenerationModeSelector';
import { useImageGeneration } from '../../contexts/ImageGenerationContext';
import { useCurriculum } from '../../hooks/useCurriculum';

interface LessonPlannerProps {
    userStats: UserStats;
    userInfo: AuthenticatedUser | null;
    isGuest?: boolean;
    onLessonPlanGenerated: (plan: LessonPlan) => void;
    lessonHistory: LessonResult[];
    onViewReport: (result: LessonResult) => void;
    onClearHistory: () => void;
    onBack?: () => void;
}

const lessonLengths = [
    { value: '15', label: 'Short (~15 mins)' },
    { value: '30', label: 'Standard (~30 mins)' },
    { value: '45', label: 'Extended (~45 mins)' }
];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className={`flex items-center p-3 rounded-lg bg-opacity-10 ${color}`}>
        <div className={`p-2 rounded-full mr-3 ${color} bg-opacity-20`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

const LessonPlannerAI: React.FC<LessonPlannerProps> = ({ userStats, userInfo, isGuest = false, onLessonPlanGenerated, lessonHistory, onViewReport, onClearHistory, onBack }) => {
    const { regions, gradeLevels, streams, getSubjectsFor, loading: configLoading } = useCurriculum();

    // State
    const [isEthiopianCurriculum, setIsEthiopianCurriculum] = useState(false);
    const [region, setRegion] = useState('');
    const [grade, setGrade] = useState('');
    const [stream, setStream] = useState('');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [chapter, setChapter] = useState('');

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [isStreamVisible, setIsStreamVisible] = useState(false);

    const [lessonLength, setLessonLength] = useState(lessonLengths[1].value);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Web Search state
    const { webSearchEnabled, setWebSearchEnabled } = useImageGeneration();

    // Effect to determine if Stream should be visible based on Grade (e.g., Grade 11/12)
    useEffect(() => {
        if (grade) {
            // Check if grade implies stream (usually 11 and 12 in Eth curriculum, or generally configurable)
            // For now, simple check: if grade name contains "11" or "12"
            if (grade.includes('11') || grade.includes('12')) {
                setIsStreamVisible(true);
            } else {
                setIsStreamVisible(false);
                setStream('');
            }
        } else {
            setIsStreamVisible(false);
        }
    }, [grade]);

    // Fetch subjects when dependencies change
    useEffect(() => {
        const fetchSubjects = async () => {
            if (grade) {
                const fetchedSubjects = await getSubjectsFor(region, grade, stream, isEthiopianCurriculum); // Pass flag as useRAG/Context hint?
                setAvailableSubjects(fetchedSubjects);
                if (!fetchedSubjects.includes(subject)) {
                    setSubject('');
                }
            } else {
                setAvailableSubjects([]);
            }
        };
        fetchSubjects();
    }, [grade, stream, region, isEthiopianCurriculum, getSubjectsFor]);


    const isFormValid = grade &&
        (!isStreamVisible || stream) &&
        subject &&
        topic.trim() !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        setError(null);
        try {
            // Guest users should not use RAG - only use standard AI
            // If Ethiopian Curriculum is selected, we imply RAG usage or context-aware generation
            const useRag = !isGuest && isEthiopianCurriculum; // Or just !isGuest if we want RAG always available for authorized

            const plan = await generateLessonPlan(
                subject,
                grade,
                topic,
                lessonLength,
                isStreamVisible ? stream : undefined,
                useRag, // Use RAG?
                region, // Pass Region
                chapter // Pass Chapter
            );
            onLessonPlanGenerated(plan);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    console.log('Rendering LessonPlannerAI component');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column: Planner */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                                    title="Go Back"
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </button>
                            )}
                            <Wand2 className="h-8 w-8 text-indigo-500" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Lesson Planner</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Design custom lessons in seconds.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <ImageGenerationModeSelector />

                            {/* Web Search Toggle */}
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                                <Globe className={`h-4 w-4 ${webSearchEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    Web Search
                                </span>
                                <button
                                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${webSearchEnabled
                                        ? 'bg-green-600 dark:bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    role="switch"
                                    aria-label="Toggle web search enhancement"
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${webSearchEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Ethiopian Curriculum Toggle */}
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">Ethiopian Curriculum</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Align with MoE standards and local context</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEthiopianCurriculum(!isEthiopianCurriculum)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEthiopianCurriculum
                                ? 'bg-blue-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            role="switch"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEthiopianCurriculum ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {isGuest && (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                👤 Guest Mode: Advanced customization disabled.
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Region (Conditional) */}
                        {isEthiopianCurriculum && (
                            <div className="sm:col-span-2">
                                <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                                <select
                                    id="region"
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                >
                                    <option value="">Select Region...</option>
                                    {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade Level</label>
                            <select
                                id="grade"
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select Grade...</option>
                                {gradeLevels.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                {/* Fallback if hook empty */}
                                {gradeLevels.length === 0 && !configLoading && (
                                    <>
                                        <option value="Grade 1">Grade 1</option>
                                        <option value="Grade 2">Grade 2</option>
                                        {/* ... add more if needed or rely on hook */}
                                    </>
                                )}
                            </select>
                        </div>
                        {isStreamVisible && (
                            <div>
                                <label htmlFor="stream" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stream</label>
                                <select
                                    id="stream"
                                    value={stream}
                                    onChange={e => setStream(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                >
                                    <option value="">Select Stream...</option>
                                    {streams.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Subject */}
                        <div className={!isStreamVisible ? "sm:col-span-2" : ""}>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                            <select
                                id="subject"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                disabled={!grade}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                            >
                                <option value="">{availableSubjects.length > 0 ? "Select Subject..." : "No subjects available"}</option>
                                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Chapter / Unit */}
                    <div>
                        <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chapter / Unit</label>
                        <input
                            type="text"
                            id="chapter"
                            value={chapter}
                            onChange={e => setChapter(e.target.value)}
                            disabled={!grade}
                            placeholder={grade ? "e.g., Chapter 4: Photosynthesis" : "Select a grade first"}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                        />
                    </div>

                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                        <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            disabled={!grade}
                            placeholder={grade ? "e.g., Mechanism of Photosynthesis" : "Select a grade first"}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lesson Length</label>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                            {lessonLengths.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setLessonLength(option.value)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${lessonLength === option.value ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md text-sm">{error}</div>}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                <>
                                    <Wand2 className="-ml-1 mr-2 h-5 w-5" />
                                    Generate Lesson
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Column: Stats and History */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Your Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={<Star size={18} />} label="Level" value={userStats.level} color="bg-yellow-500 text-yellow-500" />
                        <StatCard icon={<TrendingUp size={18} />} label="Total XP" value={userStats.xp} color="bg-green-500 text-green-500" />
                        <StatCard icon={<Flame size={18} />} label="Streak" value={`${userStats.streak} day(s)`} color="bg-orange-500 text-orange-500" />
                        <StatCard icon={<BarChart size={18} />} label="Lessons" value={lessonHistory.length} color="bg-blue-500 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                            <History className="h-6 w-6 text-indigo-500" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Lesson History</h3>
                        </div>
                        {lessonHistory.length > 0 && (
                            <button onClick={onClearHistory} className="flex items-center space-x-1.5 px-2 py-1 text-xs font-semibold rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900">
                                <Trash2 size={12} />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {lessonHistory.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No lessons completed yet. Start creating!</p>
                        ) : (
                            lessonHistory.map((result) => (
                                <div key={result.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{result.topic}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.grade} • {result.subject}</p>
                                    </div>
                                    <button onClick={() => onViewReport(result)} className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors">
                                        Report
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonPlannerAI;

import React from 'react';

type RagStatus = 'success' | 'fallback' | 'disabled';

interface TutorConfigPanelProps {
    useRAG: boolean;
    onToggleRAG: () => void;
    ragStatus: RagStatus;
    ragMessage: string | null;
    regions: { id: number; name: string }[];
    selectedRegion: string;
    onRegionChange: (value: string) => void;
    gradeLevels: { id: number; name: string }[];
    selectedGrade: string;
    onGradeChange: (value: string) => void;
    streams: { id: number; name: string }[];
    streamRequired: boolean;
    selectedStream: string;
    onStreamChange: (value: string) => void;
    selectedSubject: string;
    onSubjectChange: (value: string) => void;
    availableSubjects: string[];
    isSubjectsLoading: boolean;
    chapterInput: string;
    onChapterChange: (value: string) => void;
    onSave?: () => void;
    isSaving?: boolean;
    saveSuccess?: boolean;
    hasConfigChanged?: boolean;
    extractedChapters?: { number: string | number; title: string; label?: string }[];
    isExtractingChapters?: boolean;
    onExtractChapters?: () => void;
}

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; label: string }> = ({ isEnabled, onToggle, label }) => (
    <div className="flex items-center group cursor-pointer" onClick={onToggle}>
        <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isEnabled ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`${isEnabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-gray-400 dark:bg-gray-300'} inline-block w-4 h-4 transform rounded-full transition-transform duration-300 shadow-sm`} />
        </div>
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
    </div>
);

const TutorConfigPanel: React.FC<TutorConfigPanelProps> = ({
    useRAG,
    onToggleRAG,
    ragStatus,
    ragMessage,
    regions,
    selectedRegion,
    onRegionChange,
    gradeLevels,
    selectedGrade,
    onGradeChange,
    streams,
    streamRequired,
    selectedStream,
    onStreamChange,
    selectedSubject,
    onSubjectChange,
    availableSubjects,
    isSubjectsLoading,
    chapterInput,
    onChapterChange,
    onSave,
    isSaving = false,
    saveSuccess = false,
    hasConfigChanged = false,
    extractedChapters = [],
    isExtractingChapters = false,
    onExtractChapters,
}) => {
    const getStatusText = () => {
        if (!useRAG) {
            return 'Curriculum alignment disabled';
        }
        if (ragStatus === 'success') {
            return 'Using Ethiopian curriculum textbooks';
        }
        if (ragStatus === 'fallback' && ragMessage) {
            return ragMessage;
        }
        return 'Ready to use curriculum resources';
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <ToggleSwitch isEnabled={useRAG} onToggle={onToggleRAG} label="Use Ethiopian Curriculum" />

                    {useRAG && (
                        <div className="flex items-center gap-2 pl-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Region:</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => onRegionChange(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm"
                            >
                                {regions.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {saveSuccess && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Saved</span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getStatusText()}</p>
                </div>
            </div>

            {useRAG && (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${streamRequired ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Grade Level</label>
                        <select
                            value={selectedGrade}
                            onChange={(e) => onGradeChange(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm"
                        >
                            <option value="">Select Grade</option>
                            {gradeLevels.map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    {streamRequired && (
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Stream</label>
                            <select
                                value={selectedStream}
                                onChange={(e) => onStreamChange(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm"
                            >
                                <option value="">Select Stream</option>
                                {streams.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedGrade || (streamRequired && !selectedStream)}
                        >
                            <option value="">
                                {!selectedGrade
                                    ? 'Select grade first'
                                    : (streamRequired && !selectedStream)
                                        ? 'Select stream first'
                                        : isSubjectsLoading
                                            ? 'Loading subjects...'
                                            : availableSubjects.length === 0
                                                ? 'No subjects found'
                                                : 'Select Subject (Optional)'}
                            </option>
                            {!isSubjectsLoading && availableSubjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Chapter / Unit</label>
                            {onExtractChapters && (
                                <button
                                    onClick={onExtractChapters}
                                    disabled={isExtractingChapters || !selectedSubject}
                                    className="text-[10px] text-primary hover:text-primary-dark disabled:text-gray-400 flex items-center gap-1"
                                >
                                    {isExtractingChapters ? (
                                        <span className="animate-spin">↻</span>
                                    ) : (
                                        <span>🔍</span>
                                    )}
                                    Scan
                                </button>
                            )}
                        </div>

                        {extractedChapters && extractedChapters.length > 0 ? (
                            <select
                                value={chapterInput}
                                onChange={(e) => onChapterChange(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm"
                            >
                                <option value="">Select Chapter</option>
                                {extractedChapters.map((chapter, index) => (
                                    <option key={index} value={chapter.title}>
                                        {chapter.label ? `${chapter.label} ${chapter.number}: ${chapter.title}` : `${chapter.number}. ${chapter.title}`}
                                    </option>
                                ))}
                                <option value="custom_input">-- Type Manually --</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={chapterInput}
                                onChange={(e) => onChapterChange(e.target.value)}
                                placeholder="e.g., Chapter 3: Photosynthesis"
                                className="w-full px-4 py-2.5 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white shadow-sm"
                            />
                        )}
                        <span className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                            {extractedChapters && extractedChapters.length > 0
                                ? "Select a chapter to auto-load topics."
                                : "Guides the tutor to extract the full chapter content."}
                        </span>
                    </div>
                </div>
            )}

            {useRAG && (isSaving || saveSuccess) && (
                <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-gray-500 dark:text-gray-400">Saving changes...</span>
                            </>
                        ) : saveSuccess ? (
                            <>
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-600 dark:text-green-400 font-medium">Configuration Saved</span>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorConfigPanel;


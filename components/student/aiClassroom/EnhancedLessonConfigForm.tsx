import React, { useEffect, useState } from 'react';
import { useCurriculum } from '../../../hooks/useCurriculum';
import { CheckCircleIcon, SparklesIcon } from '../../icons/Icons';

interface EnhancedLessonConfigFormProps {
  onConfigChange: (config: LessonConfig) => void;
  onGenerateLesson: (config: LessonConfig) => Promise<void>;
  isLoading?: boolean;
  onBack?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export interface LessonConfig {
  useEthiopianCurriculum: boolean;
  region?: string;
  gradeLevel: string;
  stream: string;
  subject: string;
  chapter: string;
  topic: string;
  duration: number;
  objectives: string[];
}

const ToggleSwitch: React.FC<{
  isEnabled: boolean;
  onToggle: () => void;
  label: string;
}> = ({ isEnabled, onToggle, label }) => (
  <div className="flex items-center gap-4 cursor-pointer" onClick={onToggle}>
    <div
      className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-gradient-to-r from-indigo-500 to-violet-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
    >
      <span
        className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300`}
      />
    </div>
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 select-none">
      {label}
    </span>
  </div>
);

const EnhancedLessonConfigForm: React.FC<EnhancedLessonConfigFormProps> = ({
  onConfigChange,
  onGenerateLesson,
  isLoading = false,
  onBack,
  theme,
  onToggleTheme,
}) => {
  const { regions, gradeLevels, streams, subjects: allSubjects, getSubjectsFor } = useCurriculum();
  const [config, setConfig] = useState<LessonConfig>({
    useEthiopianCurriculum: true,
    region: '',
    gradeLevel: '',
    stream: '',
    subject: '',
    chapter: '',
    topic: '',
    duration: 45,
    objectives: [''],
  });

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [streamRequired, setStreamRequired] = useState(false);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      // If Curriculum Toggle is OFF, show ALL global subjects
      if (!config.useEthiopianCurriculum) {
        setAvailableSubjects(allSubjects.map(s => s.name));
        return;
      }

      if (!config.gradeLevel) {
        setAvailableSubjects([]);
        setStreamRequired(false);
        return;
      }

      // Determine if stream is required based on grade name
      const selectedGrade = gradeLevels.find(g => g.id.toString() === config.gradeLevel || g.name === config.gradeLevel);
      const gradeName = selectedGrade ? selectedGrade.name : config.gradeLevel;

      const isStreamNeeded = gradeName === 'Grade 11' || gradeName === 'Grade 12';
      setStreamRequired(isStreamNeeded);

      if (isStreamNeeded && !config.stream) {
        setAvailableSubjects([]);
        return;
      }

      setIsSubjectsLoading(true);
      try {
        let regionParam = config.region || undefined;
        let gradeParam = config.gradeLevel;
        let streamParam = config.stream || undefined;

        // If using RAG (Ethiopian Curriculum), pass Names. Using standard, pass IDs.
        if (config.useEthiopianCurriculum) {
          const selectedRegion = regions.find(r => r.id.toString() === config.region);
          if (selectedRegion) regionParam = selectedRegion.name;

          const selectedGrade = gradeLevels.find(g => g.id.toString() === config.gradeLevel);
          if (selectedGrade) gradeParam = selectedGrade.name;

          const selectedStream = streams.find(s => s.id.toString() === config.stream);
          if (selectedStream) streamParam = selectedStream.name;
        }

        // Use region, grade, and stream to fetch subjects, including curriculum toggle state
        const subjects = await getSubjectsFor(
          regionParam,
          gradeParam,
          streamParam,
          config.useEthiopianCurriculum
        );

        // Map accordingly to avoid [object Object] or undefined.
        setAvailableSubjects(subjects.map((s: any) => s.name || s));

      } catch (err) {
        console.error('Failed to load subjects:', err);
        setAvailableSubjects([]);
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    loadSubjects();
  }, [config.gradeLevel, config.stream, config.region, config.useEthiopianCurriculum, gradeLevels, regions, streams, allSubjects, getSubjectsFor]);

  const handleConfigUpdate = (updates: Partial<LessonConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleAddObjective = () => {
    handleConfigUpdate({
      objectives: [...config.objectives, ''],
    });
  };

  const handleRemoveObjective = (index: number) => {
    handleConfigUpdate({
      objectives: config.objectives.filter((_, i) => i !== index),
    });
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...config.objectives];
    newObjectives[index] = value;
    handleConfigUpdate({ objectives: newObjectives });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.gradeLevel || !config.topic || !config.subject) {
      alert('Please fill in Grade Level, Topic, and Subject');
      return;
    }
    await onGenerateLesson(config);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Form Section - Spans 2 Columns */}
      <div className="lg:col-span-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden">

        {/* Helper Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-8 py-6 border-b border-indigo-100 dark:border-indigo-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
            Configurator
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Customize your AI-generated lesson content.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Ethiopian Curriculum Toggle */}
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 transition-all hover:shadow-md">
              <ToggleSwitch
                isEnabled={config.useEthiopianCurriculum}
                onToggle={() =>
                  handleConfigUpdate({
                    useEthiopianCurriculum: !config.useEthiopianCurriculum,
                  })
                }
                label="Use Ethiopian Curriculum"
              />
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-2 pl-16">
                Aligns content with national standards and textbooks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Region Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Region</label>
                <div className="relative">
                  <select
                    value={config.region}
                    onChange={(e) =>
                      handleConfigUpdate({
                        region: e.target.value,
                        subject: '',
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="">Select Region...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              {/* Grade Level */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Grade Level <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={config.gradeLevel}
                    onChange={(e) =>
                      handleConfigUpdate({
                        gradeLevel: e.target.value,
                        stream: '',
                        subject: '',
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="">Select Grade</option>
                    {gradeLevels.map((grade) => (
                      <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              {/* Stream */}
              {streamRequired && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Stream</label>
                  <div className="relative">
                    <select
                      value={config.stream}
                      onChange={(e) =>
                        handleConfigUpdate({ stream: e.target.value, subject: '' })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
                    >
                      <option value="">Select Stream</option>
                      {streams.map((stream) => (
                        <option key={stream.id} value={stream.id}>{stream.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className={`space-y-2 ${streamRequired ? '' : 'md:col-span-2'}`}>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Subject <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={config.subject}
                    onChange={(e) => handleConfigUpdate({ subject: e.target.value })}
                    disabled={
                      !config.gradeLevel ||
                      (streamRequired && !config.stream) ||
                      isSubjectsLoading
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!config.gradeLevel
                        ? 'Select grade first'
                        : streamRequired && !config.stream
                          ? 'Select stream first'
                          : isSubjectsLoading
                            ? 'Loading subjects...'
                            : availableSubjects.length === 0
                              ? 'No subjects found'
                              : 'Select Subjects'}
                    </option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-6"></div>

            {/* Topic & Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Topic/Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={config.topic}
                  onChange={(e) => handleConfigUpdate({ topic: e.target.value })}
                  placeholder="e.g. Photosynthesis"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Chapter (Optional)</label>
                <input
                  type="text"
                  value={config.chapter}
                  onChange={(e) => handleConfigUpdate({ chapter: e.target.value })}
                  placeholder="e.g. Chapter 3"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* Duration & Objectives */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 block">
                  Duration: <span className="text-indigo-600 dark:text-indigo-400">{config.duration} min</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="5"
                  value={config.duration}
                  onChange={(e) => handleConfigUpdate({ duration: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15m</span>
                  <span>180m</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Learning Objectives</label>
                {config.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 group">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                    {config.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(index)}
                        className="px-3 text-red-400 hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pl-1"
                >
                  + Add another objective
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !config.topic || !config.gradeLevel || !config.subject}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? 'Generating Note...' : 'Generate Note'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column - Social Proof & Tips */}
      <div className="space-y-6">
        {/* Pro Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>

          <h3 className="text-xl font-bold mb-2">Did you know?</h3>
          <p className="text-indigo-100 text-sm leading-relaxed mb-4">
            AI-generated lessons that use <strong>Ethiopian Curriculum</strong> alignment see a <strong>40% increase</strong> in student engagement scores.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg w-fit">
            <SparklesIcon className="w-4 h-4" /> Pro Tip
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700 shadow-lg">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Community Stats</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Active Teachers</span>
              <span className="font-bold text-gray-900 dark:text-white">5,204</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-[75%]"></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Lessons Generated</span>
              <span className="font-bold text-gray-900 dark:text-white">128k+</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[90%]"></div>
            </div>
          </div>
        </div>

        {/* Trusted By */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10 dark:border-common shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider text-center">Trusted By</h4>
          <div className="grid grid-cols-2 gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse delay-75"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse delay-150"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLessonConfigForm;

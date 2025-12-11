import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { GeneratedRubric } from '../../types';
// FIX: Changed import from deprecated geminiService to apiService.
import { apiService } from '../../services/apiService';
import { ScaleIcon } from '../icons/Icons';

const RubricGenerator: React.FC = () => {
    const [topic, setTopic] = useState("History Essay on the Axumite Kingdom");
    const [gradeLevel, setGradeLevel] = useState("Grade 9");
    const [rubric, setRubric] = useState<GeneratedRubric | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Persistence Logic ---

    // Load cached data on mount
    useEffect(() => {
        const cachedRubric = localStorage.getItem('cached_rubric');
        if (cachedRubric) {
            try {
                setRubric(JSON.parse(cachedRubric));
            } catch (e) {
                console.error("Failed to parse cached rubric", e);
            }
        }

        const cachedConfig = localStorage.getItem('cached_rubric_generator_config');
        if (cachedConfig) {
            try {
                const config = JSON.parse(cachedConfig);
                if (config.topic) setTopic(config.topic);
                if (config.gradeLevel) setGradeLevel(config.gradeLevel);
            } catch (e) {
                console.error("Failed to parse cached rubric config", e);
            }
        }
    }, []);

    // Save generated rubric to cache
    useEffect(() => {
        if (rubric) {
            localStorage.setItem('cached_rubric', JSON.stringify(rubric));
        }
    }, [rubric]);

    // Save config to cache
    useEffect(() => {
        const config = {
            topic,
            gradeLevel
        };
        localStorage.setItem('cached_rubric_generator_config', JSON.stringify(config));
    }, [topic, gradeLevel]);

    // --- End Persistence Logic ---

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRubric(null);
        try {
            // FIX: Updated function call to use apiService with correct params object.
            const result = await apiService.generateRubric({
                topic,
                grade_level: gradeLevel
            });
            setRubric(result);
        } catch (err) {
            setError("Failed to generate rubric. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="AI-Powered Rubric Generator">
            <div className="space-y-4">
                {/* Input Form */}
                <div className="flex flex-col sm:flex-row gap-4 items-end p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment Topic</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                        <input type="text" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center space-x-2 px-4 py-2 text-white font-semibold bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400"
                    >
                        <ScaleIcon />
                        <span>{isLoading ? 'Generating...' : 'Generate Rubric'}</span>
                    </button>
                </div>

                {/* Output Display */}
                <div className="mt-6">
                    {isLoading && <p className="text-center text-gray-500">Building your custom rubric...</p>}
                    {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>}
                    {rubric && (
                        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            <h3 className="text-xl font-bold text-center text-primary dark:text-secondary">{rubric.title}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max text-sm text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold w-1/4">Criterion</th>
                                            {rubric.criteria[0]?.performanceLevels.map(level => (
                                                <th key={level.level} className="px-4 py-2 font-semibold">{level.level}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 dark:text-gray-300">
                                        {rubric.criteria.map((crit, index) => (
                                            <tr key={index} className="border-b dark:border-gray-700">
                                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 align-top">{crit.criterion}</td>
                                                {crit.performanceLevels.map(level => (
                                                    <td key={level.level} className="px-4 py-3 align-top">{level.description}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default RubricGenerator;
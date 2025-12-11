import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';
import Card from '../Card';
import {
    DocumentTextIcon,
    CloudArrowUpIcon,
    SparklesIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';

const CreateAssignment: React.FC = () => {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'ai' | 'upload' | 'manual'>('ai');
    const [isLoading, setIsLoading] = useState(false);

    // AI Generation State
    const [aiParams, setAiParams] = useState({
        topic: '',
        grade_level: '',
        subject: '',
        assignment_type: 'Quiz',
        difficulty: 'Medium'
    });

    // File Upload State
    const [file, setFile] = useState<File | null>(null);

    // Editor State
    const [assignmentData, setAssignmentData] = useState({
        title: '',
        description: '',
        content: ''
    });

    const handleAiGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await apiService.generateAssignment(aiParams);
            setAssignmentData({
                title: data.title || `${aiParams.topic} Assignment`,
                description: data.description || '',
                content: data.content || ''
            });
            addNotification('Assignment generated successfully!', 'success');
        } catch (error) {
            addNotification(error instanceof Error ? error.message : 'Generation failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setIsLoading(true);
        try {
            const data = await apiService.parseAssignment(selectedFile);
            setAssignmentData(prev => ({
                ...prev,
                title: selectedFile.name.split('.')[0],
                content: data.content
            }));
            addNotification('File parsed successfully!', 'success');
        } catch (error) {
            addNotification(error instanceof Error ? error.message : 'Parsing failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        // TODO: Implement save logic to backend (create Assignment model)
        console.log('Saving assignment:', assignmentData);
        addNotification('Assignment saved (mock)!', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Assignment</h1>
                    <p className="text-gray-600 dark:text-gray-400">Create new assignments using AI, file upload, or manual entry</p>
                </div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Save Assignment
                </button>
            </div>

            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'ai'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <SparklesIcon className="h-5 w-5" />
                    AI Generator
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'upload'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <CloudArrowUpIcon className="h-5 w-5" />
                    Upload File
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'manual'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <PencilSquareIcon className="h-5 w-5" />
                    Manual Entry
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {activeTab === 'ai' && (
                        <Card>
                            <form onSubmit={handleAiGenerate} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Topic</label>
                                    <input
                                        type="text"
                                        required
                                        value={aiParams.topic}
                                        onChange={e => setAiParams({ ...aiParams, topic: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                        placeholder="e.g. Newton's Laws"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Grade Level</label>
                                    <select
                                        value={aiParams.grade_level}
                                        onChange={e => setAiParams({ ...aiParams, grade_level: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                    >
                                        <option value="">Select Grade</option>
                                        {[9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={aiParams.subject}
                                        onChange={e => setAiParams({ ...aiParams, subject: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                        placeholder="e.g. Physics"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Generating...' : 'Generate Content'}
                                </button>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'upload' && (
                        <Card>
                            <div className="p-4 space-y-4">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                    <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500 mb-4">Upload PDF, DOCX, or TXT</p>
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                {isLoading && <p className="text-center text-blue-600">Parsing file...</p>}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Panel: Editor */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={assignmentData.title}
                                    onChange={e => setAssignmentData({ ...assignmentData, title: e.target.value })}
                                    className="w-full px-4 py-2 text-lg font-semibold border-b border-gray-200 dark:border-gray-700 focus:outline-none bg-transparent"
                                    placeholder="Assignment Title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={assignmentData.description}
                                    onChange={e => setAssignmentData({ ...assignmentData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                    rows={2}
                                    placeholder="Brief description..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
                                <textarea
                                    value={assignmentData.content}
                                    onChange={e => setAssignmentData({ ...assignmentData, content: e.target.value })}
                                    className="w-full px-4 py-4 border rounded-lg dark:bg-gray-800 dark:border-gray-600 font-mono text-sm h-[500px]"
                                    placeholder="# Assignment Content..."
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateAssignment;

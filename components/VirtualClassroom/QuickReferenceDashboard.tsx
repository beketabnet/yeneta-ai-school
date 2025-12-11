import React from 'react';
import AIToolCard, { AITool } from './AIToolCard';
import {
    Wand2,
    MessageSquare,
    FileSearch,
    Shield,
    FileText,
    MessageCircle,
    ClipboardList,
    Sparkles,
    Brain,
    Zap
} from 'lucide-react';
import type { UserInfo } from '../services/apiService';

interface QuickReferenceDashboardProps {
    userInfo: UserInfo;
    onNavigate: (path: string) => void;
}

const QuickReferenceDashboard: React.FC<QuickReferenceDashboardProps> = ({ userInfo, onNavigate }) => {
    const aiTeachingAssistants: AITool[] = [
        {
            id: 'lesson-creator',
            name: 'AI Lesson Creator',
            description: 'Create engaging, standards-aligned lesson plans instantly with AI-powered content generation.',
            icon: Wand2,
            color: 'purple',
            category: 'assistant',
            path: '/ai-tools/lesson-planner',
            badge: 'Popular'
        },
        {
            id: 'chatpods',
            name: 'ChatPods',
            description: 'AI-powered discussion assistant for facilitating group conversations and student engagement.',
            icon: MessageSquare,
            color: 'blue',
            category: 'assistant',
            path: '/ai-tools/chatpods',
            badge: 'New'
        },
    ];

    const aiClassroomHelpers: AITool[] = [
        {
            id: 'plagiarism-checker',
            name: 'Plagiarism Checker',
            description: 'Instantly identify plagiarized student content with advanced similarity detection.',
            icon: FileSearch,
            color: 'orange',
            category: 'helper',
            path: '/ai-tools/plagiarism-checker',
        },
        {
            id: 'ai-content-detector',
            name: 'AI Content Detector',
            description: 'Detect AI-generated student work with high accuracy and detailed analysis.',
            icon: Shield,
            color: 'teal',
            category: 'helper',
            path: '/ai-tools/content-generator',
        },
    ];

    const aiInstantGenerators: AITool[] = [
        {
            id: 'lesson-plan',
            name: 'Lesson Plan Generator',
            description: 'Generate comprehensive, standards-aligned lesson plans in seconds.',
            icon: FileText,
            color: 'green',
            category: 'generator',
            path: '/ai-tools/lesson-planner',
        },
        {
            id: 'student-feedback',
            name: 'Study Guide Generator',
            description: 'Create comprehensive study guides with practice questions and key concepts.',
            icon: MessageCircle,
            color: 'pink',
            category: 'generator',
            path: '/ai-tools/study-guide',
        },
        {
            id: 'quiz-assessment',
            name: 'Quiz/Assessment Builder',
            description: 'Build quizzes and assessments with auto-generated questions and answer keys.',
            icon: ClipboardList,
            color: 'blue',
            category: 'generator',
            path: '/ai-tools/quiz-builder',
        },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                        <Sparkles size={32} className="text-yellow-300" />
                        <h1 className="text-3xl font-bold">
                            Your AI Quick Reference
                        </h1>
                    </div>
                    <p className="text-xl text-indigo-100 mb-2">
                        {getGreeting()}, {userInfo.username}!
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <Sparkles size={20} className="text-yellow-300" />
                            <span className="font-semibold">Instantly generate</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <Brain size={20} className="text-green-300" />
                            <span className="font-semibold">standards-aligned lessons</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <Zap size={20} className="text-orange-300" />
                            <span className="font-semibold">assessments</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <MessageCircle size={20} className="text-blue-300" />
                            <span className="font-semibold">personalized AI feedback</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <Shield size={20} className="text-red-300" />
                            <span className="font-semibold">automated grading and analytics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Teaching Assistants */}
            <section className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Wand2 size={24} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            AI Teaching Assistants
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Advanced AI agents that automate complex instructional and administrative workflows
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiTeachingAssistants.map(tool => (
                        <AIToolCard key={tool.id} tool={tool} onNavigate={onNavigate} />
                    ))}
                </div>
            </section>

            {/* AI Classroom Helpers */}
            <section className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <Shield size={24} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            AI Classroom Helpers
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            AI task completion agents that quickly create resources and perform routine classroom tasks
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiClassroomHelpers.map(tool => (
                        <AIToolCard key={tool.id} tool={tool} onNavigate={onNavigate} />
                    ))}
                </div>
            </section>

            {/* AI Instant Generators */}
            <section className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Sparkles size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            AI Instant Generators
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Prompt wrappers that instantly turn input into structured prompts and text outputs
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiInstantGenerators.map(tool => (
                        <AIToolCard key={tool.id} tool={tool} onNavigate={onNavigate} />
                    ))}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => onNavigate('/create/lesson')}
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 
                                 rounded-lg hover:shadow-md transition-shadow duration-200 group"
                    >
                        <Wand2 size={24} className="text-indigo-600 dark:text-indigo-400 mb-2 
                                                   group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Create Lesson
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigate('/evaluate/quickgrader')}
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 
                                 rounded-lg hover:shadow-md transition-shadow duration-200 group"
                    >
                        <ClipboardList size={24} className="text-green-600 dark:text-green-400 mb-2 
                                                          group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Grade Assignment
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigate('/library')}
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 
                                 rounded-lg hover:shadow-md transition-shadow duration-200 group"
                    >
                        <FileText size={24} className="text-purple-600 dark:text-purple-400 mb-2 
                                                      group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Browse Library
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigate('/manage/students')}
                        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 
                                 rounded-lg hover:shadow-md transition-shadow duration-200 group"
                    >
                        <MessageSquare size={24} className="text-blue-600 dark:text-blue-400 mb-2 
                                                          group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Manage Students
                        </span>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default QuickReferenceDashboard;

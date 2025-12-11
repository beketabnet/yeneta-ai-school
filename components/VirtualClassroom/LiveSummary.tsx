import React, { useState, useEffect } from 'react';
import {
    Radio,
    RefreshCw,
    TrendingUp,
    Users,
    MessageSquare,
    Brain,
    Smile,
    Target,
    Sparkles
} from 'lucide-react';

interface SummaryMetrics {
    participationRate: 'Low' | 'Moderate' | 'High';
    qualityOfInteraction: 'Low' | 'Moderate' | 'High';
    depthOfDiscussion: 'Low' | 'Moderate' | 'High';
    learningProgress: 'Weak' | 'Moderate' | 'Strong';
    easeOfAdoption: 'Difficult' | 'Moderate' | 'Intuitive';
    studentEnjoyment: 'Low' | 'Moderate' | 'High';
}

interface LiveSummaryProps {
    sessionId?: string;
}

const LiveSummary: React.FC<LiveSummaryProps> = ({ sessionId }) => {
    const [isLive, setIsLive] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<SummaryMetrics>({
        participationRate: 'High',
        qualityOfInteraction: 'High',
        depthOfDiscussion: 'Moderate',
        learningProgress: 'Strong',
        easeOfAdoption: 'Intuitive',
        studentEnjoyment: 'High'
    });
    const [summary, setSummary] = useState<string>(
        "The transcript shows a high level of engagement from multiple students as they work through solving systems of equations using the substitution method. Students actively participate by setting up equations, solving for variables, checking answers, and requesting new problems to solve. The assistants provide step-by-step guidance, corrective feedback, and encouragement, promoting a deep understanding and verification of solutions. While students engage mostly with procedural steps and some conceptual clarification, the interactions reflect strong learning progress with intuitive platform use and enthusiasm for the topic."
    );

    useEffect(() => {
        // Simulate live updates every 30 seconds
        if (isLive) {
            const interval = setInterval(() => {
                handleRefresh();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [isLive]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            // Randomly update metrics for demo
            const levels: Array<'Low' | 'Moderate' | 'High'> = ['Low', 'Moderate', 'High'];
            const progress: Array<'Weak' | 'Moderate' | 'Strong'> = ['Weak', 'Moderate', 'Strong'];
            const ease: Array<'Difficult' | 'Moderate' | 'Intuitive'> = ['Difficult', 'Moderate', 'Intuitive'];
            
            setMetrics({
                participationRate: levels[Math.floor(Math.random() * 3)],
                qualityOfInteraction: levels[Math.floor(Math.random() * 3)],
                depthOfDiscussion: levels[Math.floor(Math.random() * 3)],
                learningProgress: progress[Math.floor(Math.random() * 3)],
                easeOfAdoption: ease[Math.floor(Math.random() * 3)],
                studentEnjoyment: levels[Math.floor(Math.random() * 3)]
            });
            setIsRefreshing(false);
        }, 1500);
    };

    const getMetricColor = (value: string): string => {
        if (value === 'High' || value === 'Strong' || value === 'Intuitive') {
            return 'text-green-700 dark:text-green-400';
        } else if (value === 'Moderate') {
            return 'text-yellow-700 dark:text-yellow-400';
        } else {
            return 'text-red-700 dark:text-red-400';
        }
    };

    const getMetricBg = (value: string): string => {
        if (value === 'High' || value === 'Strong' || value === 'Intuitive') {
            return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        } else if (value === 'Moderate') {
            return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        } else {
            return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                            <Sparkles size={28} className="text-cyan-600" />
                            <span>Live Summary</span>
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            This summary is created by AI, based on the recent student engagement with the ChatPod.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                isLive
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <Radio size={18} className={isLive ? 'animate-pulse' : ''} />
                            <span className="font-medium">{isLive ? 'Live' : 'Paused'}</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh summary"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Participation Rate */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.participationRate)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Users size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Participation rate
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.participationRate)}`}>
                        {metrics.participationRate}
                    </p>
                </div>

                {/* Quality of Interaction */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.qualityOfInteraction)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Quality of interaction
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.qualityOfInteraction)}`}>
                        {metrics.qualityOfInteraction}
                    </p>
                </div>

                {/* Depth of Discussion */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.depthOfDiscussion)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Brain size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Depth of discussion
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.depthOfDiscussion)}`}>
                        {metrics.depthOfDiscussion}
                    </p>
                </div>

                {/* Learning Progress */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.learningProgress)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Learning progress
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.learningProgress)}`}>
                        {metrics.learningProgress}
                    </p>
                </div>

                {/* Ease of Student Adoption */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.easeOfAdoption)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Target size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ease of student adoption
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.easeOfAdoption)}`}>
                        {metrics.easeOfAdoption}
                    </p>
                </div>

                {/* Student Enjoyment */}
                <div className={`rounded-lg border p-6 ${getMetricBg(metrics.studentEnjoyment)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Smile size={20} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Student enjoyment
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${getMetricColor(metrics.studentEnjoyment)}`}>
                        {metrics.studentEnjoyment}
                    </p>
                </div>
            </div>

            {/* AI Summary Text */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Sparkles size={20} className="text-cyan-600" />
                    <span>AI-Generated Summary</span>
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {summary}
                    </p>
                </div>
            </div>

            {/* Insights & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                        Key Insights
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Students demonstrate strong procedural understanding</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>High engagement with step-by-step problem solving</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Active participation in requesting new challenges</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Positive response to corrective feedback</span>
                        </li>
                    </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                        Recommendations
                    </h3>
                    <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                        <li className="flex items-start space-x-2">
                            <span className="text-purple-600 mt-0.5">→</span>
                            <span>Introduce more conceptual discussion questions</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-purple-600 mt-0.5">→</span>
                            <span>Encourage peer-to-peer explanation opportunities</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-purple-600 mt-0.5">→</span>
                            <span>Provide real-world application examples</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-purple-600 mt-0.5">→</span>
                            <span>Continue current pacing and support level</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Session Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    <span>Session ID: {sessionId || 'DEMO-001'}</span>
                    <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>{isLive ? 'Monitoring active' : 'Monitoring paused'}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LiveSummary;

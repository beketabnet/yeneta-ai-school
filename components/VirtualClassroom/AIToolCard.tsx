import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface AITool {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    category: 'assistant' | 'helper' | 'generator';
    path: string;
    badge?: string;
}

interface AIToolCardProps {
    tool: AITool;
    onNavigate: (path: string) => void;
}

const AIToolCard: React.FC<AIToolCardProps> = ({ tool, onNavigate }) => {
    const Icon = tool.icon;

    const colorClasses = {
        purple: 'from-purple-500 to-indigo-600',
        blue: 'from-blue-500 to-cyan-600',
        green: 'from-green-500 to-emerald-600',
        orange: 'from-orange-500 to-amber-600',
        pink: 'from-pink-500 to-rose-600',
        teal: 'from-teal-500 to-cyan-600',
    };

    const getGradient = (color: string) => {
        return colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;
    };

    return (
        <div
            onClick={() => onNavigate(tool.path)}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl 
                       transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 
                       dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500"
        >
            {/* Badge */}
            {tool.badge && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 
                                   text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        {tool.badge}
                    </span>
                </div>
            )}

            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(tool.color)} 
                           opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

            <div className="relative p-6">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getGradient(tool.color)} 
                               flex items-center justify-center mb-4 group-hover:scale-110 
                               transition-transform duration-300`}>
                    <Icon size={28} className="text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 
                             group-hover:text-indigo-600 dark:group-hover:text-indigo-400 
                             transition-colors duration-200">
                    {tool.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {tool.description}
                </p>

                {/* Action Indicator */}
                <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-sm font-semibold">Try it now</span>
                    <svg 
                        className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default AIToolCard;

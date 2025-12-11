import React from 'react';
import { AcademicCapIcon, UserGroupIcon, ClockIcon, ShieldCheckIcon } from '../../icons/Icons';

const TrustedBy: React.FC = () => {
    const stats = [
        { label: 'Active Students', value: '2,000+', icon: <UserGroupIcon className="w-5 h-5" /> },
        { label: 'Curriculum Aligned', value: '100%', icon: <ShieldCheckIcon className="w-5 h-5" /> },
        { label: 'Availability', value: '24/7', icon: <ClockIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center md:text-left uppercase tracking-wider mb-2">
                        Trusted Verification
                    </h4>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white dark:border-gray-900 text-[10px] font-bold text-emerald-700">A</div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white dark:border-gray-900 text-[10px] font-bold text-blue-700">Y</div>
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border-2 border-white dark:border-gray-900 text-[10px] font-bold text-purple-700">S</div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                            Validated by <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yeneta Academy</span>
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full text-indigo-500 shadow-sm">
                                {stat.icon}
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrustedBy;

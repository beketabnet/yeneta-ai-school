import React, { useState, useCallback } from 'react';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '../icons/Icons';

interface AdminEnrollmentRequestsFiltersProps {
    onFilter: (filters: { status?: string; search?: string }) => void;
    isLoading: boolean;
}

const AdminEnrollmentRequestsFilters: React.FC<AdminEnrollmentRequestsFiltersProps> = ({ onFilter, isLoading }) => {
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    const handleStatusChange = useCallback((newStatus: string) => {
        setStatus(newStatus);
        onFilter({ status: newStatus, search });
    }, [search, onFilter]);

    const handleSearchChange = useCallback((newSearch: string) => {
        setSearch(newSearch);
        onFilter({ status, search: newSearch });
    }, [status, onFilter]);

    const handleReset = useCallback(() => {
        setStatus('');
        setSearch('');
        onFilter({ status: '', search: '' });
    }, [onFilter]);

    return (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                        Filter by Status
                    </label>
                    <div className="relative">
                        <FunnelIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="declined">Declined</option>
                            <option value="under_review">Under Review</option>
                        </select>
                    </div>
                </div>

                <div className="md:col-span-7">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                        Search Requests
                    </label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by student, teacher, email, subject..."
                            disabled={isLoading}
                            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 placeholder-gray-400"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <button
                        onClick={handleReset}
                        disabled={isLoading || (!status && !search)}
                        className="w-full py-2.5 px-4 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminEnrollmentRequestsFilters;

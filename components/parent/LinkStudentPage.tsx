import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { View } from '../../App';

interface LinkStudentPageProps {
    setView: (view: View) => void;
}

const REGIONS = [
    'Tigray', 'Afar', 'Amhara', 'Oromia', 'Somali', 'Benishangul-Gumuz',
    'SNNPR', 'Gambella', 'Harari', 'Sidama', 'South West Ethiopia Peoples',
    'Central Ethiopia', 'Addis Ababa', 'Dire Dawa'
];

const LinkStudentPage: React.FC<LinkStudentPageProps> = ({ setView }) => {
    const [studentId, setStudentId] = useState('');
    const [region, setRegion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // @ts-ignore - linkChild updated in backend but maybe not in frontend types yet
            await apiService.linkChild(studentId, region);
            setMessage({ type: 'success', text: 'Student linked successfully!' });
            setStudentId('');
            setRegion('');
            // Optionally redirect after a delay
            setTimeout(() => setView('dashboard'), 2000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to link student.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Link Your Child
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Enter your child's unique Student ID and Region to link them to your account.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {message && (
                            <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}

                        <div>
                            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Student Identification Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="studentId"
                                    name="studentId"
                                    type="text"
                                    required
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                            <select id="region" name="region" value={region} onChange={(e) => setRegion(e.target.value)} required
                                className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">Select Region</option>
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                            >
                                {isLoading ? 'Linking...' : 'Link Student'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <button onClick={() => setView('dashboard')} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkStudentPage;

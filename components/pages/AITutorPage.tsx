import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import AITutor from '../student/AITutor';
import { ArrowLeftIcon } from '../icons/Icons';

interface AITutorPageProps {
  onExit: () => void;
}

const AITutorPage: React.FC<AITutorPageProps> = ({ onExit }) => {
  const { user, logout } = useContext(AuthContext);

  const handleBackToHome = () => {
    logout();
    onExit();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleBackToHome}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Exit to home page and logout"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
          <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">24/7 AI Tutor</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Personalized learning support</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user?.first_name || user?.username}!</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <AITutor />
      </main>
    </div>
  );
};

export default AITutorPage;

import React, { useContext, useState } from 'react';
import { View } from '../../App';
import { LessonContext } from '../../contexts/LessonContext';
import { AuthContext } from '../../contexts/AuthContext';
import LessonCreator from '../student/aiClassroom/LessonCreator';
import { ArrowLeftIcon, XMarkIcon, MoonIcon, SunIcon } from '../icons/Icons';
import { ThemeContext } from '../../contexts/ThemeContext';

interface LessonCreatorPageProps {
  onLessonCreated: () => void;
  onExit: () => void;
  setView: (view: View) => void;
}

const LessonCreatorPage: React.FC<LessonCreatorPageProps> = ({ onLessonCreated, onExit, setView }) => {
  const { clearLesson } = useContext(LessonContext) || {};
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExit = () => {
    clearLesson?.();
    logout();
    onExit();
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-300">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl opacity-40 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl opacity-40 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">

          {/* Logo / Title Area */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300"
              title="Exit and return to login"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Lesson Creator
              </h1>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-yellow-400 transition-colors"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI Active</span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-yellow-400 transition-colors"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button onClick={toggleMenu} className="p-2 text-gray-600 dark:text-gray-300 focus:outline-none">
              {isMenuOpen ? (
                <XMarkIcon className="w-7 h-7" />
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
              <span className="font-medium text-indigo-900 dark:text-indigo-200">System Status</span>
              <span className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
              </span>
            </div>
            <button
              onClick={handleExit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" /> Back to Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 md:px-6 py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <LessonCreator
            onLessonCreated={onLessonCreated}
            onCancel={handleExit}
            variant="embedded"
          />
        </div>
      </main>
    </div>
  );
};

export default LessonCreatorPage;

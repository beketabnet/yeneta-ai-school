import React, { useContext } from 'react';
import { YenetaLogoIcon, ArrowLeftIcon, MoonIcon, SunIcon } from '../icons/Icons';
import { View } from '../../App';
import Footer from '../common/Footer';
import { ThemeContext } from '../../contexts/ThemeContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string; // Added subtitle support
  setView: (view: View) => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, setView }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="relative flex flex-col min-h-screen font-sans selection:bg-primary/30 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background Elements (Same as Landing Page) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-40 dark:opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] opacity-40 dark:opacity-20"></div>
      </div>

      {/* Header */}
      <div className="relative z-20 w-full p-6 flex justify-between items-center">
        <button
          onClick={() => setView('landing')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 group-hover:bg-primary/10 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Home</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-lg">

          <div className="text-center mb-8">
            <div className="inline-block cursor-pointer transform hover:scale-105 transition-transform duration-300" onClick={() => setView('landing')}>
              <div className="flex items-center justify-center gap-3">
                <YenetaLogoIcon className="h-12 w-12" />
                <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                  YENETA
                </span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 relative overflow-hidden">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary opacity-50"></div>

            {children}
          </div>

        </div>
      </div>

      <div className="relative z-10">
        <Footer setView={setView} />
      </div>
    </div>
  );
};

export default AuthLayout;
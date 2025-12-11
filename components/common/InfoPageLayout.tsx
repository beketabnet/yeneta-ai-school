import React, { useContext } from 'react';
import { View } from '../../App';
import Footer from './Footer';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ArrowLeftIcon, MoonIcon, SunIcon } from '../icons/Icons';

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  setView: (view: View) => void;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children, title, setView }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => setView('landing')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light font-semibold transition-colors"
            aria-label="Go back to landing page"
          >
            <ArrowLeftIcon className="w-5 h-5"/>
            <span>Back to Home</span>
          </button>
           <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-slate-900"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-md">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">{title}</h1>
            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                 {children}
            </div>
        </div>
      </main>
      <Footer setView={setView} />
    </div>
  );
};

export default InfoPageLayout;
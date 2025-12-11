import React, { useState, useContext } from 'react';
import { View } from '../../App';
import { YenetaLogoIcon, CheckboxIcon, ArrowLeftIcon, MoonIcon, SunIcon } from '../icons/Icons';
import Footer from '../common/Footer';
import { ThemeContext } from '../../contexts/ThemeContext';

interface GetADemoPageProps {
  setView: (view: View) => void;
}

const GetADemoPage: React.FC<GetADemoPageProps> = ({ setView }) => {
  const [submitted, setSubmitted] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would typically handle form submission, e.g., send data to an API
    setSubmitted(true);
  };

  const FeatureItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start">
      <CheckboxIcon className="w-6 h-6 mr-3 mt-1 text-primary flex-shrink-0" />
      <span className="text-lg text-gray-700 dark:text-gray-300">{children}</span>
    </li>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
       <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
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
      <main className="container mx-auto px-6 py-24 flex items-center justify-center min-h-screen">
        <div className="flex flex-col lg:flex-row bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-6xl w-full">
          {/* Left Side */}
          <div className="w-full lg:w-5/12 p-8 md:p-12 bg-gradient-to-br from-violet-50 to-fuchsia-100 dark:from-slate-800 dark:to-gray-900 relative">
             <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-violet-200/50 dark:bg-violet-900/30 rounded-full blur-2xl"></div>
             <div className="absolute top-10 left-10 w-20 h-20 bg-fuchsia-200/50 dark:bg-fuchsia-900/30 rounded-full blur-2xl"></div>
            <div className="relative z-10">
                <div className="flex items-center">
                  <YenetaLogoIcon className="h-14" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white ml-3">YENETA</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-6">
                    Future-proof your school with AI
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                    Get a demo to see how YENETA's AI-native platform can transform teaching and learning.
                </p>
                <ul className="mt-8 space-y-4">
                    <FeatureItem>Automate lesson planning, grading, and student feedback</FeatureItem>
                    <FeatureItem>Empower educators with AI-driven insights and tools</FeatureItem>
                    <FeatureItem>Engage students with adaptive, personalized learning</FeatureItem>
                    <FeatureItem>Save teachers 5-10 hours per week</FeatureItem>
                    <FeatureItem>Replace 3-5 products and cut IT and EdTech spend by up to 30%</FeatureItem>
                </ul>
                <p className="mt-8 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Trusted by 500+ schools worldwide
                </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-7/12 p-8 md:p-12">
            {!submitted ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Connect with an expert</h2>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name*</label>
                            <input type="text" id="first-name" required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name*</label>
                            <input type="text" id="last-name" required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="work-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work email*</label>
                        <input type="email" id="work-email" required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tell us a little about what you're looking for?</label>
                        <textarea id="message" rows={4} className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                    </div>
                    <div className="flex items-start">
                        <input id="consent" name="consent" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded mt-1" />
                        <label htmlFor="consent" className="ml-2 block text-sm text-gray-700 dark:text-gray-400">I consent to receive marketing communications and agree to YENETA's Terms of Service and Privacy Policy.</label>
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">
                            Send message
                        </button>
                    </div>
                </form>
              </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Thank You!</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Your request for a demo has been received. Our team will get in touch with you shortly.
                    </p>
                    <button
                        onClick={() => setView('landing')}
                        className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-full text-lg hover:bg-primary-dark"
                    >
                        Back to Home
                    </button>
                </div>
            )}
          </div>
        </div>
      </main>
      <Footer setView={setView} />
    </div>
  );
};

export default GetADemoPage;
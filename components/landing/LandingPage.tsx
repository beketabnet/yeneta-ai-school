import React, { useContext, useState, useEffect } from 'react';
import { View } from '../../App';
import {
  YenetaLogoIcon, TeacherIcon, StudentIcon, AdminIcon, MoonIcon, SunIcon,
  XMarkIcon, CheckCircleIcon, ArrowPathIcon
} from '../icons/Icons';
import Footer from '../common/Footer';
import { ThemeContext } from '../../contexts/ThemeContext';
import BookAnimation from './BookAnimation';
import EthiopianRegionsCard from './EthiopianRegionsCard';

interface LandingPageProps {
  setView: (view: View) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Testimonials', href: '#testimonials' }, // Added placeholder
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 min-h-screen font-sans selection:bg-primary/30 selection:text-primary-dark">

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || isMenuOpen
          ? 'bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'
          : 'bg-transparent py-2'
          }`}
      >
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => setView('landing')}>
            <div className="transform group-hover:rotate-12 transition-transform duration-300">
              <YenetaLogoIcon className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 ml-2 tracking-tight">
              YENETA
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">


            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-4"></div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-yellow-400">
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setView('login')}
              className="px-5 py-2.5 rounded-full text-gray-700 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              Log in
            </button>
            <button
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300"
              onClick={() => { }} // Placeholder
            >
              Pymetrics
            </button>
            <button
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300"
              onClick={() => setView('lessonGenerator')}
            >
              AI Teacher
            </button>
            <button
              onClick={() => setView('signup')}
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Start for free
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-yellow-400">
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button onClick={toggleMenu} className="text-gray-700 dark:text-white p-2 focus:outline-none">
              {isMenuOpen ? (
                <XMarkIcon className="w-8 h-8" />
              ) : (
                // Hamburger Icon (Inline)
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 ease-in-out transform origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
          <div className="flex flex-col p-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-4 flex flex-col gap-3">
              <button
                onClick={() => { setView('login'); setIsMenuOpen(false); }}
                className="w-full py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Log in
              </button>
              <button
                onClick={() => { setView('signup'); setIsMenuOpen(false); }}
                className="w-full py-3 rounded-lg bg-primary text-white font-bold shadow-md active:bg-primary-dark"
              >
                Start for free
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20">

        {/* Dynamic Hero Section */}
        <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl opacity-30 dark:opacity-10" style={{ animationDelay: '2s' }}></div>

          <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">

            {/* Text Content */}
            <div className="text-left space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light font-medium text-sm">
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: AI Lesson Planner 2.0
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                The AI <br />
                Co-Teacher for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
                  Every Educator
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
                YENETA scales personalization across classrooms. Your complete AI-powered teaching partner for planning, grading, and engaging.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setView('signup')} className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-violet-700 text-white font-bold text-lg shadow-xl shadow-primary/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                  Start Teaching Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <button onClick={() => setView('getDemo')} className="px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 mr-2">▶</span>
                  Watch Demo
                </button>
              </div>

              <div className="pt-4 flex items-center text-sm text-gray-500 dark:text-gray-400 gap-6">
                <div className="flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-500" /> No credit card required</div>
                <div className="flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-500" /> Free forever plan</div>
              </div>
            </div>

            {/* Graphic Content (Book Animation) */}
            <div className="flex justify-center md:justify-end relative">
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {/* Glow behind book */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-[80px]"></div>
                <BookAnimation />
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By / Social Proof */}
        <section className="py-12 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-8">Trusted by Forward-Thinking Schools</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholder text logos for now */}
              <span className="text-2xl font-bold font-serif text-gray-400">Addis<span className="text-primary">Academy</span></span>
              <span className="text-2xl font-bold font-sans text-gray-400">Future<span className="text-secondary">School</span></span>
              <span className="text-2xl font-bold font-mono text-gray-400">STEM<span className="text-accent">Ethiopia</span></span>
              <span className="text-2xl font-bold font-serif text-gray-400">Global<span className="text-red-500">Learn</span></span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {[
                { label: 'Teachers', value: '5,000+' },
                { label: 'Students', value: '120k+' },
                { label: 'Lesson Plans', value: '1M+' },
                { label: 'Time Saved', value: '50k hrs' },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{stat.value}</span>
                  <span className="text-sm text-gray-500 uppercase tracking-wide mt-2">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Features</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Daily Tools for the Modern Classroom</h3>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything you need to manage your classroom, engage students, and track progress — all in one AI-powered platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <TeacherIcon className="w-10 h-10 text-white" />,
                  title: "For Teachers",
                  desc: "Automate lesson planning, grading, and feedback to save 5-10 hours per week and focus on teaching.",
                  color: "bg-primary"
                },
                {
                  icon: <StudentIcon className="w-10 h-10 text-white" />,
                  title: "For Students",
                  desc: "Provide students with 24/7 adaptive support that guides them to mastery at their own pace.",
                  color: "bg-secondary"
                },
                {
                  icon: <AdminIcon className="w-10 h-10 text-white" />,
                  title: "For Administrators",
                  desc: "Gain real-time insights into student progress and engagement for data-driven school-wide decisions.",
                  color: "bg-accent"
                }
              ].map((feature, idx) => (
                <div key={idx} className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 ${feature.color} opacity-5 rounded-bl-[100px] transition-transform group-hover:scale-150 duration-500`}></div>

                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {feature.desc}
                  </p>

                  <a href="#" className="inline-flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                    Learn more <span className="ml-2">→</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Tutor Highlight */}
        <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-semibold mb-6 border border-white/20">
                🚀 Coming Soon
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Meet Your New <br />AI Teaching Assistant</h2>
              <p className="text-xl text-gray-300 mb-8">
                Upload any textbook or curriculum PDF, and our AI instantly generates quizzes, flashcards, and interactive lessons tailored to your students' needs.
              </p>
              <ul className="space-y-4 mb-10">
                {['Instant Quiz Generation', 'Smart Lesson Planning', 'Auto-Grading & Feedback'].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setView('aiTutor')} className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-xl">
                Try AI Tutor Beta
              </button>
            </div>
            <div className="relative">
              {/* Ethiopian Regions Card Integration */}
              <EthiopianRegionsCard />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">Our Mission</h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-light">
              "To leverage the power of artificial intelligence to create a resilient and high-quality educational ecosystem in Ethiopia. We aim to bridge the gaps in access and quality, providing tools that empower teachers, engage students, and support administrators, ultimately transforming education for millions."
            </p>
            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Join the revolution</p>
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => setView('signup')} className="text-primary font-bold hover:text-primary-dark hover:underline">Sign up as Teacher</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setView('signup')} className="text-primary font-bold hover:text-primary-dark hover:underline">Sign up as Student</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer setView={setView} />
    </div>
  );
};

export default LandingPage;
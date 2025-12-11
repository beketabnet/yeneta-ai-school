import React, { useContext, useState, useEffect, createContext } from 'react';

// --- Types ---
export type View = 'landing' | 'login' | 'signup' | 'aiTutor' | 'getDemo';

// --- Icons (Inlined for self-containment) ---
const YenetaLogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TeacherIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const StudentIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const AdminIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// --- Contexts (Inlined) ---
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

// --- Components (Inlined) ---
const Footer: React.FC<{ setView: (view: View) => void }> = ({ setView }) => (
  <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 pt-16 pb-8">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center mb-4">
            <YenetaLogoIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold ml-2 text-gray-900 dark:text-white">YENETA</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Empowering every learner and educator with AI-driven personalization and insights.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><button onClick={() => setView('aiTutor')} className="hover:text-primary transition-colors">AI Tutor</button></li>
            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
            <li><button className="hover:text-primary transition-colors">Pricing</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><button className="hover:text-primary transition-colors">About Us</button></li>
            <li><button className="hover:text-primary transition-colors">Careers</button></li>
            <li><button className="hover:text-primary transition-colors">Contact</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><button className="hover:text-primary transition-colors">Privacy Policy</button></li>
            <li><button className="hover:text-primary transition-colors">Terms of Service</button></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-slate-800 pt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} YENETA. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// --- Main Landing Page Component ---
interface LandingPageProps {
  setView: (view: View) => void;
}

const LandingPageContent: React.FC<LandingPageProps> = ({ setView }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      
      {/* Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => setView('landing')}
          >
            <div className="transform group-hover:scale-105 transition-transform duration-300">
              <YenetaLogoIcon className="h-10 w-auto text-primary" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight ml-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-white dark:to-blue-200">
              YENETA
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => setView('aiTutor')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors">AI Tutor</button>
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors">About</button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

            <button onClick={() => setView('login')} className="text-sm font-semibold hover:text-primary transition-colors">Log in</button>
            <button 
              onClick={() => setView('signup')} 
              // FIX 1: Ensure text is white in dark mode explicitly
              className="bg-primary hover:bg-primary-dark text-white dark:text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Start for free
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl p-4 flex flex-col space-y-4 animate-fadeIn">
            <button onClick={() => {setView('aiTutor'); setIsMobileMenuOpen(false);}} className="text-left py-2 px-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium">AI Tutor</button>
            <button onClick={() => scrollToSection('features')} className="text-left py-2 px-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium">Features</button>
            <button onClick={() => scrollToSection('about')} className="text-left py-2 px-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium">About</button>
            <hr className="border-gray-100 dark:border-slate-800" />
            <button onClick={() => {setView('login'); setIsMobileMenuOpen(false);}} className="text-left py-2 px-4 font-semibold">Log in</button>
            {/* FIX 1: Ensure text is white in dark mode explicitly */}
            <button onClick={() => {setView('signup'); setIsMobileMenuOpen(false);}} className="bg-primary text-white dark:text-white py-3 rounded-lg font-bold text-center shadow-md">Start for free</button>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          
           <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

           <div className="relative z-10 container mx-auto px-6 text-center">
            
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm animate-fade-in-up">
              🚀 Revolutionizing Education in Ethiopia
            </div>
            
            {/* START: Enhanced Block - The "Scrolling Book/Parchment" Aesthetic */}
            <div className="p-8 md:p-12 bg-white dark:bg-slate-800/80 rounded-[3rem] shadow-2xl shadow-primary/10 dark:shadow-slate-800/50 border border-gray-200 dark:border-slate-700 max-w-5xl mx-auto mb-12 animate-fade-in-up animation-delay-200 backdrop-blur-sm transition-all duration-300 hover:shadow-primary/30 dark:hover:shadow-slate-700/70">
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                  The AI Co-Teacher for <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">Every Classroom</span>
                </h1>
                
                <p className="md:text-xl text-gray-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed pt-6 border-t border-gray-200 dark:border-slate-700">
                  YENETA is the first AI platform scaling personalization. Empowering teachers, engaging students, and simplifying administration—all in one place.
                </p>
            </div>
            {/* END: Enhanced Block */}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
                <button 
                  onClick={() => setView('signup')} 
                  // FIX 2: Ensure text is white in dark mode explicitly
                  className="w-full sm:w-auto bg-primary text-white dark:text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl shadow-primary/25 hover:bg-primary-dark hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <button 
                  onClick={() => setView('getDemo')} 
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 transition-all duration-300 shadow-sm"
                >
                  Book a Demo
                </button>
            </div>

            {/* Stats / Social Proof */}
            <div className="mt-20 pt-10 border-t border-gray-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-80">
                <div>
                    <h4 className="text-3xl font-bold text-gray-900 dark:text-white">10k+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students Learning</p>
                </div>
                <div>
                    <h4 className="text-3xl font-bold text-gray-900 dark:text-white">500+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Teachers Empowered</p>
                </div>
                <div>
                    <h4 className="text-3xl font-bold text-gray-900 dark:text-white">50+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Partner Schools</p>
                </div>
                <div>
                    <h4 className="text-3xl font-bold text-gray-900 dark:text-white">24/7</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI Support</p>
                </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">One Platform, <span className="text-primary">Three Solutions</span></h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comprehensive AI tools tailored to support the entire educational ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Teacher Card */}
              <div className="group p-8 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TeacherIcon className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TeacherIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">For Teachers</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    Automate lesson planning, grading, and feedback. Save 5-10 hours every week to focus on what matters most—mentoring students.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>Instant Lesson Generation</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>Automated Grading</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>Personalized Feedback</li>
                  </ul>
                </div>
              </div>

              {/* Student Card */}
              <div className="group p-8 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <StudentIcon className="w-32 h-32 text-blue-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform duration-300">
                    <StudentIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">For Students</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    A personalized AI tutor available 24/7. Adaptive learning paths that guide every student from confusion to mastery at their own pace.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>24/7 Homework Help</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>Adaptive Quizzes</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>Gamified Learning</li>
                  </ul>
                </div>
              </div>

              {/* Admin Card */}
              <div className="group p-8 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <AdminIcon className="w-32 h-32 text-purple-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform duration-300">
                    <AdminIcon className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">For Admins</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    Gain bird's-eye visibility into school performance. Data-driven insights to support teachers and intervene early for students.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>Real-time Dashboards</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>Curriculum Analytics</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>Resource Management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 px-6">
            <div className="container mx-auto bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl"></div>
                
                <h2 className="relative z-10 text-3xl md:text-5xl font-bold mb-6">Ready to transform your classroom?</h2>
                <p className="relative z-10 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                    Join thousands of educators and students using Yeneta to make learning smarter, faster, and more personal.
                </p>
                <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => setView('signup')} 
                            // FIX 3: Ensure text is dark in dark mode to contrast the white background.
                            className="bg-white text-primary dark:text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg">
                        Start Learning Now
                    </button>
                    <button onClick={() => setView('getDemo')} className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-all">
                        Schedule Demo
                    </button>
                </div>
            </div>
        </section>
        
        {/* Mission / About Section */}
        <section id="about" className="py-20 bg-gray-50 dark:bg-slate-950">
             <div className="container mx-auto px-6">
                 <div className="max-w-4xl mx-auto text-center">
                    <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-4 block">Our Mission</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">Building a Resilient Educational Ecosystem</h2>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        "We aim to bridge the gaps in access and quality, providing tools that empower teachers, engage students, and support administrators, ultimately transforming education for millions in Ethiopia and beyond."
                    </p>
                    <div className="mt-8 flex justify-center items-center space-x-2">
                        <div className="h-1 w-12 bg-primary rounded-full"></div>
                        <div className="h-1 w-2 bg-primary/50 rounded-full"></div>
                        <div className="h-1 w-2 bg-primary/30 rounded-full"></div>
                    </div>
                 </div>
             </div>
        </section>
      </main>

      <Footer setView={setView} />
    </div>
  );
};

// --- App Wrapper (The Runnable Entry Point) ---
const App = () => {
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [view, setView] = useState<View>('landing');

  // Handle dark mode class on body/html
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Render logic based on view
  // Note: For this preview, if the user navigates away from 'landing',
  // we show a placeholder to allow them to go back.
  if (view !== 'landing') {
     return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
             <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300">
                <h1 className="text-3xl font-bold mb-4">View: {view}</h1>
                <p className="mb-8 text-gray-600 dark:text-gray-400">This view is a placeholder for the preview.</p>
                <button 
                  onClick={() => setView('landing')} 
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  Back to Landing Page
                </button>
             </div>
        </ThemeContext.Provider>
     )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LandingPageContent setView={setView} />
    </ThemeContext.Provider>
  );
};

export default App;
import React from 'react';

const BookAnimation: React.FC = () => {
    return (
        <div className="flex justify-center items-center py-20 perspective-1500 scale-125 md:scale-100 origin-center">
            <style>{`
        .book-container {
           perspective: 1500px;
           width: 380px;
           height: 540px;
           position: relative;
        }

        .book {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        
        .page {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          transform-origin: left center;
          border-radius: 4px 16px 16px 4px;
          box-shadow: 
            inset 5px 0 10px rgba(0,0,0,0.05), /* Inner spine shadow */
            2px 0 5px rgba(0,0,0,0.05); /* Page depth */
          background: white;
          padding: 40px;
          overflow: hidden;
          backface-visibility: hidden;
          transform: rotateY(0deg);
        }

        /* Dark mode paper */
        .dark .page {
            background: #1e293b;
            color: #e2e8f0;
            box-shadow: 
                inset 5px 0 10px rgba(255,255,255,0.02),
                2px 0 5px rgba(0,0,0,0.2);
            border-left: 1px solid #334155;
        }

        .cover-back {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #6d28d9; /* Violet-700 */
            border-radius: 4px 16px 16px 4px;
            transform: translateZ(-2px);
            box-shadow: 10px 10px 30px rgba(0,0,0,0.3);
        }
        
        .spine {
             position: absolute;
             left: -16px;
             top: 0;
             width: 32px;
             height: 100%;
             background: #5b21b6; /* Violet-800 */
             transform: rotateY(-90deg) translateZ(10px);
             border-radius: 2px;
        }

        /* Animation Keyframes */
        /* We have N pages. Each page flips from 0 to -180. 
           To loop infinitely, we need a stack.
           Let's use a staggered animation loop.
        */
        
        .flipping-page {
            animation: flip-infinite 12s infinite ease-in-out;
            z-index: 5;
            background: linear-gradient(to right, #f8f8f8 0%, #fff 5%, #fff 95%, #f0f0f0 100%);
        }
        
        .dark .flipping-page {
            background: linear-gradient(to right, #1e293b 0%, #1e293b 100%);
        }

        .flipping-page:nth-child(2) { animation-delay: 0s; z-index: 5; }
        .flipping-page:nth-child(3) { animation-delay: 4s; z-index: 4; }
        .flipping-page:nth-child(4) { animation-delay: 8s; z-index: 3; }
        
        /* Base page stays at the bottom */
        .static-page-right {
           z-index: 1;
        }
        .static-page-left {
           z-index: 1;
           transform: rotateY(-180deg);
           background: #fdfdfd;
        }
        .dark .static-page-left {
           background: #1e293b;
        }

        @keyframes flip-infinite {
            0% { transform: rotateY(0deg); z-index: 5; }
            5% { transform: rotateY(0deg); } /* Hold briefly */
            30% { transform: rotateY(-180deg); z-index: 5; }
            35% { transform: rotateY(-180deg); z-index: 1; } /* Drop z-index to allow reset */
            40% { transform: rotateY(0deg); z-index: 1; opacity: 0; } /* Reset invisibly */
            100% { transform: rotateY(0deg); z-index: 5; opacity: 1; } /* Ready for next cycle */
        }
        
        /* Custom realistic content styles */
        .paper-lines {
           background-image: repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px);
           line-height: 32px;
        }
        .dark .paper-lines {
           background-image: repeating-linear-gradient(transparent, transparent 31px, #334155 31px, #334155 32px);
        }

      `}</style>

            <div className="book-container">
                <div className="book">
                    <div className="cover-back"></div>
                    <div className="spine"></div>

                    {/* Left Static Page (what we see after a page flips) */}
                    <div className="page static-page-left flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                        <div className="w-full h-full p-6 border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center opacity-50">
                            <div className="text-4xl text-gray-300 dark:text-gray-600 font-bold mb-4">NOTES</div>
                            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 mb-2"></div>
                            <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 mb-2"></div>
                            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    </div>

                    {/* Right Static Page (Base) */}
                    <div className="page static-page-right paper-lines">
                        <h3 className="text-2xl font-bold font-serif text-gray-800 dark:text-gray-100 mb-4 border-b-2 border-red-500 pb-2 inline-block">Conclusion</h3>
                        <p className="font-serif text-lg leading-loose text-gray-700 dark:text-gray-300">
                            By integrating AI into the classroom, teachers can reduce administrative tasks by 40% and focus more on student engagement.
                        </p>
                        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r">
                            <p className="text-sm italic text-gray-600 dark:text-yellow-100">"Technology is best when it brings people together." - Matt Mullenweg</p>
                        </div>
                    </div>

                    {/* Flipping Page 3: Physics/Math */}
                    <div className="page flipping-page paper-lines">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Physics</h2>
                            <span className="text-xs font-mono text-gray-400">Chapter 4</span>
                        </div>

                        <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-6">Newton's Laws</h3>

                        <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg mb-6 flex items-center justify-center">
                            {/* Mock Graph/Diagram */}
                            <svg width="200" height="120" viewBox="0 0 200 120" className="opacity-80">
                                <path d="M10,110 L190,110" stroke="currentColor" strokeWidth="2" className="text-gray-800 dark:text-white" />
                                <path d="M10,10 L10,110" stroke="currentColor" strokeWidth="2" className="text-gray-800 dark:text-white" />
                                <path d="M10,110 Q100,10 190,110" fill="none" stroke="#2563eb" strokeWidth="3" />
                                <circle cx="100" cy="60" r="5" fill="#ef4444" />
                                <text x="110" y="55" className="text-xs" fill="currentColor">F = ma</text>
                            </svg>
                        </div>

                        <p className="font-serif text-lg text-gray-700 dark:text-gray-300">
                            An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.
                        </p>
                    </div>

                    {/* Flipping Page 2: Biology */}
                    <div className="page flipping-page">
                        <div className="w-full h-48 bg-green-100 dark:bg-green-900/30 rounded-lg mb-6 overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl">🌿</span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-white mb-2">Plant Biology</h2>
                        <h4 className="text-md text-green-600 dark:text-green-400 font-medium mb-6">Photosynthesis & Growth</h4>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Light Dependent Reactions occur in the thylakoid membranes.</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">The Calvin Cycle takes place in the stroma.</p>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <div className="text-xs text-gray-400 font-mono">Page 42</div>
                        </div>
                    </div>

                    {/* Flipping Page 1: Introduction (Cover-like) */}
                    <div className="page flipping-page bg-gradient-to-br from-violet-50 to-white dark:from-slate-800 dark:to-slate-900">
                        <div className="h-full flex flex-col justify-between border-4 border-double border-violet-200 dark:border-slate-600 p-4">
                            <div className="text-center mt-10">
                                <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-bold tracking-widest uppercase rounded-full mb-4">
                                    2025 Edition
                                </span>
                                <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                                    THE <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">AI TUTOR</span>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-serif italic">A Guide to Modern Education</p>
                            </div>

                            <div className="flex justify-center my-8">
                                <div className="w-32 h-32 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <span className="text-5xl text-white font-serif font-bold">Y</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-center mb-8">
                                <div className="h-1 w-16 mx-auto bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Yeneta School Platform</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookAnimation;

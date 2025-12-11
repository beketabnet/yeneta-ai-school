import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { CodeBracketIcon, PlayIcon, ArrowPathIcon } from '../icons/Icons';

const initialCodeSamples = {
    python: 'print("Hello, World!")\n\n# Calculate fibonacci\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint(f"Fibonacci of 10 is: {fib(10)}")',
    javascript: 'console.log("Hello, Yeneta!");\n\n// Calculate factorial\nfunction factorial(n) {\n    if (n === 0 || n === 1) return 1;\n    return n * factorial(n - 1);\n}\n\nconsole.log(`Factorial of 5 is: ${factorial(5)}`);',
    html: '<!-- HTML Playground -->\n<div style="color: blue;">\n    <h1>Welcome to the Code Editor</h1>\n    <p>You can write and "run" HTML here.</p>\n</div>'
};

type Language = 'python' | 'javascript' | 'html';

const CodeEditor: React.FC = () => {
    const [language, setLanguage] = useState<Language>('python');
    const [code, setCode] = useState(initialCodeSamples.python);
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setCode(initialCodeSamples[lang]);
        setOutput('');
        setError(null);
    };

    const handleRunCode = async () => {
        setIsLoading(true);
        setError(null);
        setOutput('');
        try {
            const result = await apiService.runCodeOnBackend(code, language);
            setOutput(result.output);
        } catch (err: any) {
            setError(err.message || "An error occurred while running the code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setCode(initialCodeSamples[language]);
        setOutput('');
        setError(null);
    };

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100vh-12rem)] min-h-[600px] flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CodeBracketIcon className="w-5 h-5 text-indigo-500" />
                        <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Editor</span>
                    </div>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Reset Code"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRunCode}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] font-bold text-sm"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <PlayIcon className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Running...' : 'Run Code'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Editor Pane */}
                <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-[#1e1e1e]">
                    <div className="flex-1 relative">
                        {/* Line Numbers Sidebar (Visual Mockup) */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] flex flex-col items-end pt-4 pr-2 text-gray-600 font-mono text-sm select-none pointer-events-none">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                            className="w-full h-full pl-14 p-4 bg-[#1e1e1e] text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-0 leading-6"
                            placeholder="Write your code here..."
                        />
                    </div>
                </div>

                {/* Output Pane */}
                <div className="h-64 lg:h-auto lg:w-1/3 flex flex-col bg-[#0d1117] text-gray-300">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Terminal</span>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-yellow-500">
                                <span className="animate-pulse">❯ Executing script...</span>
                            </div>
                        ) : error ? (
                            <div className="text-red-400 whitespace-pre-wrap">
                                <span className="text-red-500 font-bold">Error:</span>
                                <br />
                                {error}
                            </div>
                        ) : output ? (
                            <div className="text-green-400 whitespace-pre-wrap">
                                <span className="text-gray-500 select-none">$ python script.py</span>
                                <br />
                                {output}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">
                                Ready to run. Click the "Run Code" button to see output.
                            </div>
                        )}

                        {/* Blinking Cursor */}
                        {!isLoading && (
                            <div className="mt-2 inline-block w-2 h-4 bg-gray-500 animate-pulse align-middle"></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
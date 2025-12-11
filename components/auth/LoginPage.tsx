import React, { useState, useContext } from 'react';
import { View } from '../../App';
import { UserRole } from '../../types';
import AuthLayout from './AuthLayout';
import { EyeIcon, EyeSlashIcon, TeacherIcon, StudentIcon, AdminIcon } from '../icons/Icons'; // Assuming generic icons exist, or reuse existing ones
import { AuthContext } from '../../contexts/AuthContext';

interface LoginPageProps {
  setView: (view: View) => void;
  redirectTo?: View;
}

const LoginPage: React.FC<LoginPageProps> = ({ setView, redirectTo }) => {
  const [email, setEmail] = useState('student@yeneta.com');
  const [password, setPassword] = useState('student123');
  const [role, setRole] = useState<UserRole>('Student'); // Demo purposes
  const [showPassword, setShowPassword] = useState(false);

  const { login, error, isLoading } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, role, () => {
      if (redirectTo) {
        setView(redirectTo);
      }
    });
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to access your dashboard"
      setView={setView}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center animate-pulse">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 mb-1">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all placeholder-gray-400"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
              Password
            </label>
            <button type="button" onClick={() => setView('forgotPassword')} className="text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light">
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all placeholder-gray-400"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Demo Role Selector - Styled nicely */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Select Role
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['Admin', 'Teacher', 'Student', 'Parent'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`
                            px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                            ${role === r
                    ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }
                        `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary to-violet-600 hover:from-primary-dark hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          New to Yeneta?{' '}
          <button onClick={() => setView('signup')} className="font-bold text-primary hover:text-primary-dark dark:text-primary-light transition-colors">
            Create an account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
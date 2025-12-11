import React, { useState } from 'react';
import { View } from '../../App';
import AuthLayout from './AuthLayout';

interface ForgotPasswordPageProps {
  setView: (view: View) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send a reset link here.
    setSubmitted(true);
  };

  return (
    <AuthLayout title="Reset your password" setView={setView}>
      {!submitted ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email address and we will send you a link to reset your password.
          </p>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            >
              Send reset link
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Check your email</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            If an account with that email exists, we've sent a password reset link to <span className="font-semibold">{email}</span>.
          </p>
          <button
            onClick={() => setView('login')}
            className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
          >
            Back to Login
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;

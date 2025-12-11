import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, UserRole } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role: UserRole, onLoginSuccess?: () => void) => Promise<void>;
  signup: (userData: { email: string, username: string, password: string, role: UserRole, gradeLevel?: string, firstName?: string, lastName?: string, region?: string, mobileNumber?: string, stream?: 'Natural' | 'Social', gender?: 'Male' | 'Female' | 'Other', age?: number }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<AuthenticatedUser>) => void;
  setUser: (user: AuthenticatedUser | null) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser({
            ...currentUser,
            avatarUrl: `https://i.pravatar.cc/100?u=${currentUser.email}` // Mock avatar
          });
        } catch (err) {
          console.error("Session check failed:", err);
          apiService.logout(); // Token is invalid, so log out
        }
      }
      setIsLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string, role: UserRole, onLoginSuccess?: () => void) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiService.login(email, password);
      const currentUser = await apiService.getCurrentUser();

      // Validate that selected role matches backend role
      if (currentUser.role !== role) {
        setError(`Invalid role. Your account is registered as ${currentUser.role}, not ${role}.`);
        apiService.logout();
        setIsLoading(false);
        return;
      }

      setUser({
        ...currentUser,
        role: currentUser.role,
        avatarUrl: `https://i.pravatar.cc/100?u=${currentUser.email}`
      });
      // Call the callback after successful login
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: { email: string, username: string, password: string, role: UserRole, gradeLevel?: string, firstName?: string, lastName?: string, region?: string, mobileNumber?: string, stream?: 'Natural' | 'Social', gender?: 'Male' | 'Female' | 'Other', age?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await apiService.signup(userData);
      setUser({
        ...newUser,
        avatarUrl: `https://i.pravatar.cc/100?u=${newUser.email}`
      });
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw to allow component to know about the failure
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    // Clear cached quiz data
    localStorage.removeItem('cached_generated_quiz');
    localStorage.removeItem('cached_quiz_config');

    // Clear cached Lesson Planner data
    localStorage.removeItem('cached_lesson_planner_config');
    localStorage.removeItem('cached_lesson_plan');

    // Clear cached Rubric Generator data
    localStorage.removeItem('cached_rubric_generator_config');
    localStorage.removeItem('cached_rubric');

    // Clear cached Quick Grader data
    localStorage.removeItem('cached_quick_grader_config');
    localStorage.removeItem('cached_quick_grader_result');

    // Clear cached Authenticity Checker data
    localStorage.removeItem('cached_authenticity_checker_config');
    localStorage.removeItem('cached_authenticity_result');

    setUser(null);
  };

  const updateUser = (updatedData: Partial<AuthenticatedUser>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...updatedData };
    });
  };

  const contextValue = {
    isAuthenticated: !!user,
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateUser,
    setUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
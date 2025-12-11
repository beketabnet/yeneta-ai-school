import React, { useState, useContext, useRef, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthenticatedUser } from '../types';
import { SunIcon, MoonIcon, LogoutIcon, UserCircleIcon, ChevronDownIcon } from './icons/Icons';
import { AuthContext } from '../contexts/AuthContext';
import { BookOpen, User, Shield, UserCheck, Heart, Briefcase } from 'lucide-react';

interface HeaderProps {
  user: AuthenticatedUser;
  onLogout: () => void;
  onOpenProfile: () => void;
  title?: string;
  showStats?: boolean;
  showSidebar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onOpenProfile, title, showStats, showSidebar = true }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = useContext(AuthContext);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    onOpenProfile();
    setIsDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    auth.logout();
    setIsDropdownOpen(false);
  };

  const isGuest = user.role === 'Guest';
  // Mock stats if not available in context yet
  const userStats = { level: 1, xp: 0, streak: 0 };
  const currentLevelXp = 0;
  const xpForNextLevel = 100;

  return (
    <header className={`h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-800 shadow-md relative z-[100] ${!showSidebar ? 'sticky top-0' : ''}`}>
      <div className="flex items-center space-x-4">
        {title ? (
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          </div>
        ) : null}
      </div>

      <div className="flex items-center space-x-4">
        {showStats && (
          <div className="hidden md:flex items-center space-x-3 text-sm font-semibold">
            {isGuest && (
              <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 rounded-full">
                <User size={14} />
                <span>Guest Mode</span>
              </div>
            )}
            {!isGuest && (
              <div className="text-gray-600 dark:text-gray-300">Level {userStats.level}</div>
            )}
            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(currentLevelXp / xpForNextLevel) * 100}%` }}></div>
            </div>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <img className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" src={user.avatarUrl || `https://i.pravatar.cc/100?u=${user.email}`} alt="user avatar" />
            <span className="text-right text-gray-800 dark:text-gray-200 hidden sm:block">
              <div className="font-semibold text-sm md:text-base">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role} Dashboard</div>
            </span>
            <ChevronDownIcon className="text-gray-500 dark:text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              <a href="#" onClick={(e) => { e.preventDefault(); handleProfileClick(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <UserCircleIcon className="mr-3" />
                Profile Settings
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogoutClick(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <LogoutIcon className="mr-3" />
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
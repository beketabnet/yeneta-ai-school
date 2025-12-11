import React, { useState, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthenticatedUser } from '../types';
import ProfileSettingsModal from './common/ProfileSettingsModal';
import { AuthContext } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  user: AuthenticatedUser;
  onUserUpdate: (updatedUser: Partial<AuthenticatedUser>) => void;
  showSidebar?: boolean;
  title?: string;
  showStats?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  onUserUpdate,
  showSidebar = true,
  title,
  showStats,
  className
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { logout } = useContext(AuthContext);

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {showSidebar && <Sidebar user={user} />}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            user={user}
            onLogout={logout}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            title={title}
            showStats={showStats}
            showSidebar={showSidebar}
          />
          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${className || 'p-4 sm:p-6 md:p-8'}`}>
            {children}
          </main>
        </div>
      </div>
      {isProfileModalOpen && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={onUserUpdate}
        />
      )}
    </>
  );
};

export default Layout;
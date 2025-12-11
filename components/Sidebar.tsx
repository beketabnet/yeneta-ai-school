import React from 'react';
import { AuthenticatedUser, UserRole } from '../types';
import { AdminIcon, TeacherIcon, StudentIcon, ParentIcon, YenetaLogoIcon } from './icons/Icons';
import { useDashboard } from '../contexts/DashboardContext';

interface SidebarProps {
  user: AuthenticatedUser;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const { activeTab, setActiveTab, tabs } = useDashboard();

  const roleIcons: Record<UserRole, React.ReactElement> = {
    'Admin': <AdminIcon />,
    'Teacher': <TeacherIcon />,
    'Student': <StudentIcon />,
    'Parent': <ParentIcon />
  };

  const currentRole = user.role;
  const currentRoleIcon = roleIcons[currentRole] || <AdminIcon />;

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg h-full">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 shadow-md flex-shrink-0">
        <YenetaLogoIcon className="h-12" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">YENETA</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Active Dashboard Header */}
        <div className="px-4 mb-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-primary dark:text-primary-light">
              {currentRoleIcon}
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {currentRole} Dashboard
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-2 mx-4"></div>

        {/* Feature Buttons (Tabs) */}
        <ul className="flex flex-col space-y-1 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200
                                ${isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                            `}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tab.icon}
                  </span>
                  <span className="ml-3 font-medium text-sm">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
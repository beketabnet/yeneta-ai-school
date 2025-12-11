import React, { useState, useMemo, useEffect } from 'react';
import { ThemeContext, Theme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { EngagementProvider } from './contexts/EngagementContext';
import { LessonProvider } from './contexts/LessonContext';
import { AIClassroomProvider } from './contexts/AIClassroomContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';
import Routes from './components/Routes';
import NotificationDisplay from './components/NotificationDisplay';

export type View = 'landing' | 'login' | 'signup' | 'dashboard' | 'forgotPassword' | 'getDemo' | 'privacyPolicy' | 'termsOfService' | 'aiClassroom' | 'aiTutor' | 'linkStudent' | 'lessonPlanner' | 'lessonGenerator';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <EngagementProvider>
              <LessonProvider>
                <ImageGenerationProvider>
                  <AIClassroomProvider>
                    <DashboardProvider>
                      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                        <Routes />
                        <NotificationDisplay />
                      </div>
                    </DashboardProvider>
                  </AIClassroomProvider>
                </ImageGenerationProvider>
              </LessonProvider>
            </EngagementProvider>
          </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
};

export default App;
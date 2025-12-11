import React, { useContext, useState, Suspense, lazy } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { View } from '../App';
import Layout from './Layout';
import Spinner from './common/Spinner';
import { AuthenticatedUser } from '../types';

// Lazy load components
const AdminDashboard = lazy(() => import('./dashboards/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./dashboards/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./dashboards/StudentDashboard'));
const ParentDashboard = lazy(() => import('./dashboards/ParentDashboard'));
const LandingPage = lazy(() => import('./landing/LandingPage'));
const LoginPage = lazy(() => import('./auth/LoginPage'));
const SignUpPage = lazy(() => import('./auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./auth/ForgotPasswordPage'));
const GetADemoPage = lazy(() => import('./auth/GetADemoPage'));
const PrivacyPolicyPage = lazy(() => import('./common/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./common/TermsOfServicePage'));
const AIClassroomManager = lazy(() => import('./student/aiClassroom/AIClassroomManager'));
const AITutorPage = lazy(() => import('./pages/AITutorPage'));


const LinkStudentPage = lazy(() => import('./parent/LinkStudentPage'));
const LessonCreatorPage = lazy(() => import('./pages/LessonCreatorPage'));

const Routes: React.FC = () => {
  const { isAuthenticated, user, isLoading, updateUser } = useContext(AuthContext);
  const [view, setView] = useState<View>('landing');

  const handleUserUpdate = (updatedUser: Partial<AuthenticatedUser>) => {
    updateUser(updatedUser);
  };

  const renderDashboard = () => {
    if (!user) return <AdminDashboard />; // Fallback
    switch (user.role) {
      case 'Admin': return <AdminDashboard />;
      case 'Teacher': return <TeacherDashboard setView={setView} />;
      case 'Student': return <StudentDashboard setView={setView} />;
      case 'Parent': return <ParentDashboard setView={setView} />;
      default: return <AdminDashboard />;
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner /></div>}>
      {(() => {
        if (view === 'aiClassroom' && isAuthenticated && user) {
          return (
            <AIClassroomManager
              onExit={() => setView('landing')}
              setView={setView}
            />
          );
        }

        if (view === 'aiTutor' && isAuthenticated && user) {
          return (
            <AITutorPage
              onExit={() => {
                setView('landing');
              }}
            />
          );
        }

        if (view === 'lessonGenerator') {
          if (isAuthenticated && user) {
            return (
              <LessonCreatorPage
                onLessonCreated={() => setView('aiClassroom')}
                onExit={() => setView('landing')}
                setView={setView}
              />
            );
          } else {
            return <LoginPage setView={setView} redirectTo="lessonGenerator" />;
          }
        }

        if (isAuthenticated && user && view !== 'landing' && view !== 'aiTutor') {
          if (view === 'linkStudent' && user.role === 'Parent') {
            return <LinkStudentPage setView={setView} />;
          }
          return (
            <Layout user={user} onUserUpdate={handleUserUpdate}>
              {renderDashboard()}
            </Layout>
          );
        }

        // Public views
        switch (view) {
          case 'login':
            return <LoginPage setView={setView} redirectTo={undefined} />;
          case 'signup':
            return <SignUpPage setView={setView} />;
          case 'forgotPassword':
            return <ForgotPasswordPage setView={setView} />;
          case 'getDemo':
            return <GetADemoPage setView={setView} />;
          case 'privacyPolicy':
            return <PrivacyPolicyPage setView={setView} />;
          case 'termsOfService':
            return <TermsOfServicePage setView={setView} />;
          case 'aiClassroom':
            return <LoginPage setView={setView} />;
          case 'aiTutor':
            return <LoginPage setView={setView} redirectTo="aiTutor" />;
          case 'landing':
          default:
            return <LandingPage setView={setView} />;
        }
      })()}
    </Suspense>
  );
};

export default Routes;

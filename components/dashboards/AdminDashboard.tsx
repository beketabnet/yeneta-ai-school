import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboardOverview from './AdminDashboardOverview';
import UserManagement from '../admin/UserManagement';
import AnalyticsDashboard from '../admin/AnalyticsDashboard';
import SmartAlertsEnhanced from '../admin/SmartAlertsEnhanced';
import LiveEngagementMonitorEnhanced from '../admin/LiveEngagementMonitorEnhanced';
import AdminCommunicationLog from '../admin/AdminCommunicationLog';
import {
  UsersIcon,
  ChartBarIcon,
  BellAlertIcon,
  EyeIcon,
  DocumentTextIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  PresentationChartLineIcon,
  Bars3Icon,
  XMarkIcon,
  YenetaLogoIcon
} from '../icons/Icons';
import CurriculumManager from '../admin/CurriculumManager';
import ExamManager from '../admin/ExamManager';
import AdminCourseManagement from '../admin/AdminCourseManagement';
import AdminCourseApprovalManager from '../admin/AdminCourseApprovalManager';
import AdminEnrollmentApprovalManager from '../admin/AdminEnrollmentApprovalManager';
import AdminEnrollmentRequestsList from '../admin/AdminEnrollmentRequestsList';
import AdminEnrollmentRequestsStats from '../admin/AdminEnrollmentRequestsStats';
import AdminEnrollmentRequestsFilters from '../admin/AdminEnrollmentRequestsFilters';
import GradeAnalyticsWidget from '../admin/GradeAnalyticsWidget';
import APIKeyManager from '../admin/APIKeyManager';
import { apiService } from '../../services/apiService';
import { useAdminEnrollmentRequests } from '../../hooks/useAdminEnrollmentRequests';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useDashboard } from '../../contexts/DashboardContext';

interface DashboardStats {
  totalUsers: number;
  avgEngagement: number;
  activeAlerts: number;
  needsAttention: number;
}

const AdminDashboard: React.FC = () => {
  const { activeTab, setActiveTab, setTabs } = useDashboard();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    avgEngagement: 0,
    activeAlerts: 0,
    needsAttention: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enrollment Hooks for Tab 10 & 11
  const { enrollments, stats: enrollmentStats, isLoading: isEnrollmentLoading, error: enrollmentError, refetch: refetchEnrollments } = useAdminEnrollmentRequests();
  const [enrollmentFilters, setEnrollmentFilters] = useState({ status: '', search: '' });
  const [autoRefreshEnrollments, setAutoRefreshEnrollments] = useState(true);

  // Define tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <PresentationChartLineIcon /> },
    { id: 'smart_alerts', label: 'Alerts', icon: <BellAlertIcon /> },
    { id: 'communication', label: 'Comms', icon: <EnvelopeIcon /> },
    { id: 'grade_analytics', label: 'Analytics', icon: <ChartBarIcon /> },
    { id: 'curriculum', label: 'Curriculum', icon: <BookOpenIcon /> },
    { id: 'exams', label: 'Exams', icon: <DocumentTextIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'courses', label: 'Courses', icon: <AcademicCapIcon /> },
    { id: 'course_approvals', label: 'Approvals', icon: <CheckCircleIcon /> },
    { id: 'enrollment_requests', label: 'Enrollments', icon: <DocumentTextIcon /> },
    { id: 'system_settings', label: 'Settings', icon: <KeyIcon /> },
  ];

  useAutoRefresh({
    interval: 10000,
    enabled: autoRefreshEnrollments && (activeTab === 'enrollment_approvals' || activeTab === 'enrollment_requests'),
    onRefresh: () => refetchEnrollments(enrollmentFilters)
  });

  const handleEnrollmentFilter = useCallback((newFilters: { status: string; search: string }) => {
    setEnrollmentFilters(newFilters);
    refetchEnrollments(newFilters);
  }, [refetchEnrollments]);

  const filteredEnrollments = enrollments.filter(e => {
    if (enrollmentFilters.status && e.status !== enrollmentFilters.status) return false;
    if (enrollmentFilters.search) {
      const search = enrollmentFilters.search.toLowerCase();
      const studentName = `${e.student.first_name} ${e.student.last_name}`.toLowerCase();
      const teacherName = `${e.teacher.first_name} ${e.teacher.last_name}`.toLowerCase();
      if (!studentName.includes(search) && !teacherName.includes(search) && !e.subject.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });


  const fetchDashboardStats = useCallback(async () => {
    try {
      const [users, alertStats, engagementData] = await Promise.all([
        apiService.getUsers(),
        apiService.getSmartAlertStatistics(),
        apiService.getEngagementTrendsEnhanced(7)
      ]);

      // Calculate average engagement from last 7 days
      const avgEngagement = engagementData.length > 0
        ? Math.round(engagementData.reduce((sum, day) => sum + day.average_engagement_score, 0) / engagementData.length)
        : 0;

      setStats({
        totalUsers: users.length,
        avgEngagement,
        activeAlerts: alertStats.total - (alertStats.by_status?.['Resolved'] || 0) - (alertStats.by_status?.['Dismissed'] || 0),
        needsAttention: alertStats.requires_attention || 0
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  useEffect(() => {
    setTabs([
      { id: 'overview', label: 'Overview', icon: <PresentationChartLineIcon /> },
      { id: 'smart_alerts', label: 'Smart Alerts', icon: <BellAlertIcon /> },
      { id: 'communication', label: 'Communication', icon: <EnvelopeIcon /> },
      { id: 'grade_analytics', label: 'Grade Analytics', icon: <ChartBarIcon /> },
      { id: 'curriculum', label: 'Curriculum', icon: <BookOpenIcon /> },
      { id: 'exams', label: 'Exams', icon: <DocumentTextIcon /> },
      { id: 'users', label: 'Users', icon: <UsersIcon /> },
      { id: 'courses', label: 'Courses', icon: <AcademicCapIcon /> },
      { id: 'course_approvals', label: 'Approvals', icon: <CheckCircleIcon /> },
      { id: 'enrollment_requests', label: 'Enrollments', icon: <DocumentTextIcon /> },
      { id: 'system_settings', label: 'Settings', icon: <KeyIcon /> },
    ]);
  }, [setTabs]);

  // Set default tab to 'overview' if current tab is invalid
  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, setActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminDashboardOverview stats={stats} isLoading={isLoading} setActiveTab={setActiveTab} />;
      case 'smart_alerts':
        return <SmartAlertsEnhanced />;
      case 'communication':
        return <AdminCommunicationLog />;
      case 'grade_analytics':
        return <GradeAnalyticsWidget />;
      case 'curriculum':
        return <CurriculumManager />;
      case 'exams':
        return <ExamManager />;
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <AdminCourseManagement />;
      case 'course_approvals':
        return <AdminCourseApprovalManager />;
      case 'enrollment_requests':
        return <AdminEnrollmentApprovalManager />;
      case 'system_settings':
        return <APIKeyManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B1120] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
        <div className="flex items-center gap-2">
          <YenetaLogoIcon className="w-8 h-8" />
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">Admin Console</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <YenetaLogoIcon className="w-8 h-8" /> Menu
              </span>
              <button
                type="button"
                className="-m-2.5 rounded-xl p-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-x-3 rounded-xl px-4 py-3 text-base font-semibold leading-7 transition-all duration-200
                                            ${activeTab === tab.id
                          ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                                        `}
                    >
                      <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hidden lg:flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <YenetaLogoIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Admin Console
              </h1>
              <p className="mt-0.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs - Glassmorphic */}
        <div className="hidden lg:block mb-8 sticky top-4 z-40">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto custom-scrollbar">
            <nav className="flex space-x-1" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                                        group flex items-center px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200
                                        ${isActive
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                      }
                                    `}
                  >
                    <span className={`mr-2 transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                      {React.cloneElement(tab.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="transition-all duration-500 ease-in-out min-h-[600px]">
          <div className="backdrop-blur-none">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
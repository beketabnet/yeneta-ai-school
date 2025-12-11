import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SmartAlert, Sentiment, AlertStatus, AlertPriority, AlertCategory, User } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import FeedbackManagementPanel from './FeedbackManagementPanel';
import {
  BellAlertIcon, CheckCircleIcon, ExclamationTriangleIcon,
  InformationCircleIcon, EyeIcon, XMarkIcon, CheckIcon,
  UsersIcon, PaperAirplaneIcon, FunnelIcon, ArrowPathIcon,
  ChartBarIcon, ChatBubbleLeftEllipsisIcon
} from '../icons/Icons';

const SentimentIcon: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  switch (sentiment) {
    case 'Positive':
      return <CheckCircleIcon className="text-green-500 w-5 h-5" />;
    case 'Negative':
      return <ExclamationTriangleIcon className="text-red-500 w-5 h-5" />;
    case 'Neutral':
      return <InformationCircleIcon className="text-blue-500 w-5 h-5" />;
    default:
      return <BellAlertIcon className="text-gray-400 w-5 h-5" />;
  }
};

const PriorityBadge: React.FC<{ priority: AlertPriority }> = ({ priority }) => {
  const styles = {
    'Low': 'bg-gray-100/50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    'Medium': 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'High': 'bg-orange-100/50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'Critical': 'bg-red-100/50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-sm ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const StatusBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const styles = {
    'New': 'bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    'In Progress': 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'Reviewed': 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'Resolved': 'bg-green-100/50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    'Dismissed': 'bg-gray-100/50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 border-gray-200 dark:border-gray-600'
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

interface AlertDetailModalProps {
  alert: SmartAlert;
  onClose: () => void;
  onUpdate: (alert: SmartAlert) => void;
  users: User[];
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose, onUpdate, users }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(alert.status);
  const [selectedAssignee, setSelectedAssignee] = useState(alert.assigned_to?.id || '');
  const [actionTaken, setActionTaken] = useState(alert.action_taken || '');
  const [resolutionNotes, setResolutionNotes] = useState(alert.resolution_notes || '');
  const [localUsers, setLocalUsers] = useState(users);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  // Update local users when prop changes
  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const refreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const updatedUsers = await apiService.getUsers();
      setLocalUsers(updatedUsers);
    } catch (error) {
      console.error('Failed to refresh users:', error);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const updated = await apiService.updateSmartAlertStatus(
        alert.id,
        selectedStatus,
        { action_taken: actionTaken, resolution_notes: resolutionNotes }
      );
      onUpdate(updated);
      onClose();
    } catch (error) {
      console.error('Failed to update alert status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;

    setIsUpdating(true);
    try {
      const updated = await apiService.assignSmartAlert(alert.id, Number(selectedAssignee));
      onUpdate(updated);
    } catch (error) {
      console.error('Failed to assign alert:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const teachersAndAdmins = useMemo(
    () => localUsers.filter(u => u.role === 'Admin' || u.role === 'Teacher'),
    [localUsers]
  );

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Alert Details
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-500">#{alert.id}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage and resolve system alerts</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-500"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Info */}
              <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{alert.student.username}</h3>
                    <p className="text-xs text-gray-500">Student Profile</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority={alert.priority} />
                  <StatusBadge status={alert.status} />
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                    {alert.category}
                  </span>
                  {alert.requires_immediate_attention && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse">
                      ⚠️ Immediate Attention
                    </span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-gray-400" />
                  Original Message
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 italic leading-relaxed relative">
                  <span className="absolute top-2 left-2 text-4xl text-gray-200 dark:text-gray-700 font-serif select-none">"</span>
                  <div className="relative z-10 px-4">
                    {alert.message_content}
                  </div>
                  <span className="absolute bottom-[-10px] right-4 text-4xl text-gray-200 dark:text-gray-700 font-serif select-none">"</span>
                </div>
              </div>

              {/* AI Analysis */}
              {alert.analysis && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-blue-500" />
                    AI Analysis
                  </h3>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {alert.analysis}
                  </div>
                </div>
              )}

              {/* Recommendations & Suggested Response */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {alert.recommended_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="min-w-[4px] h-[4px] rounded-full bg-blue-500 mt-2"></div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {alert.suggested_response && (
                  <div className="p-4 border border-green-200 dark:border-green-900/30 rounded-2xl bg-green-50/30 dark:bg-green-900/10">
                    <h4 className="font-bold text-green-800 dark:text-green-300 mb-3 text-sm">Suggested Response</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{alert.suggested_response}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="space-y-6">
              {/* Assignment */}
              <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Assignment</h3>
                  <button onClick={refreshUsers} disabled={isRefreshingUsers} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ArrowPathIcon className={`w-3 h-3 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {teachersAndAdmins.map(user => (
                        <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  <button
                    onClick={handleAssign}
                    disabled={isUpdating || !selectedAssignee}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Update Asignee
                  </button>

                  {alert.assigned_to && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mt-2">
                      <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-bold">
                        {alert.assigned_to.username[0].toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-500 dark:text-gray-400">Assigned to</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{alert.assigned_to.username}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Resolution */}
              <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resolution</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as AlertStatus)}
                      className="w-full pl-3 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  <textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Action taken..."
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                    rows={3}
                  />

                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Private resolution notes..."
                    className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                    rows={3}
                  />

                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {isUpdating ? 'Saving...' : 'Mark as Resolved'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1"><InformationCircleIcon className="w-4 h-4" /> Source: {alert.source}</span>
            <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(alert.updated_at).toLocaleString()}</span>
            {alert.resolved_at && <span className="text-green-600 font-medium">Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const SmartAlertsEnhanced: React.FC = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SmartAlert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SmartAlert | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'feedback'>('alerts');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [alertsData, usersData, statsData, currentUser] = await Promise.all([
        apiService.getSmartAlerts(),
        apiService.getUsers(),
        apiService.getSmartAlertStatistics(),
        apiService.getCurrentUser()
      ]);
      setAlerts(alertsData);
      setFilteredAlerts(alertsData);
      setUsers(usersData);
      setStatistics(statsData);
      setCurrentUserId(currentUser.id);
    } catch (err) {
      setError("Failed to load smart alerts.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Apply filters
    let filtered = [...alerts];

    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    if (sentimentFilter) {
      filtered = filtered.filter(a => a.sentiment === sentimentFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, statusFilter, priorityFilter, categoryFilter, sentimentFilter]);

  const handleAnalyze = useCallback(async (alertId: number) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(a => a.id === alertId ? { ...a, isAnalyzing: true } : a)
    );

    try {
      const updatedAlert = await apiService.analyzeSmartAlert(alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(a => a.id === alertId ? { ...updatedAlert, isAnalyzing: false } : a)
      );
      const statsData = await apiService.getSmartAlertStatistics();
      setStatistics(statsData);
    } catch (err) {
      console.error("Failed to analyze alert:", err);
      setAlerts(prevAlerts =>
        prevAlerts.map(a => a.id === alertId ? { ...a, isAnalyzing: false } : a)
      );
    }
  }, []);

  const handleAlertUpdate = useCallback((updatedAlert: SmartAlert) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a)
    );
  }, []);

  // Calculate statistics dynamically from current alerts
  const dynamicStatistics = useMemo(() => {
    if (alerts.length === 0) return statistics;

    const total = alerts.length;
    const requiresAttention = alerts.filter(a => a.requires_immediate_attention).length;
    const unassigned = alerts.filter(a => !a.assigned_to).length;
    const assignedToMe = currentUserId ? alerts.filter(a => a.assigned_to?.id === currentUserId).length : 0;

    return {
      total,
      requires_attention: requiresAttention,
      unassigned,
      assigned_to_me: assignedToMe,
      by_status: alerts.reduce((acc, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_priority: alerts.reduce((acc, alert) => {
        acc[alert.priority] = (acc[alert.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_sentiment: alerts.reduce((acc, alert) => {
        acc[alert.sentiment] = (acc[alert.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_category: alerts.reduce((acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [alerts, currentUserId, statistics]);

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSentimentFilter('');
  };

  const activeFiltersCount = [statusFilter, priorityFilter, categoryFilter, sentimentFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Main Stats HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Alerts</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <BellAlertIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dynamicStatistics?.total || 0}</p>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Monitoring
          </div>
        </div>

        <div className="bg-red-50/80 dark:bg-red-900/10 backdrop-blur-xl p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-300">Requires Attention</p>
            <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-700 dark:text-red-400">{dynamicStatistics?.requires_attention || 0}</p>
          <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/70">
            High Priority Events
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned</p>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dynamicStatistics?.unassigned || 0}</p>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${dynamicStatistics?.total > 0 ? (dynamicStatistics.unassigned / dynamicStatistics.total * 100) : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To Me</p>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dynamicStatistics?.assigned_to_me || 0}</p>
          <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">View My Tasks &rarr;</p>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative ${activeTab === 'alerts'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <BellAlertIcon className="w-5 h-5" />
            Active Alerts
            {activeTab === 'alerts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative ${activeTab === 'feedback'
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            Student Feedback
            {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === 'alerts' ? (
          <div className="p-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  Filters {activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{activeFiltersCount}</span>}
                </button>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  title="Refresh Feed"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All Filters</button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2.5 text-sm bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-blue-500">
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="p-2.5 text-sm bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-blue-500">
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2.5 text-sm bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Academic">Academic</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Emotional">Emotional</option>
                </select>
                <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)} className="p-2.5 text-sm bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-blue-500">
                  <option value="">All Sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            )}

            <ScrollableListContainer className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading alert feed...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <BellAlertIcon className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No alerts found</p>
                  <p className="text-sm">{activeFiltersCount > 0 ? 'Try adjusting your filters.' : 'Everything looks good so far!'}</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`group relative bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-blue-400 cursor-pointer ${alert.requires_immediate_attention
                        ? 'border-red-200 dark:border-red-900 ring-1 ring-red-100 dark:ring-red-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    {alert.requires_immediate_attention && (
                      <div className="absolute -top-3 -right-3 animate-bounce">
                        <span className="flex h-6 w-6 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center">
                            <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="mt-1">
                        <SentimentIcon sentiment={alert.sentiment} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100">{alert.student.username}</h4>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={alert.priority} />
                            <StatusBadge status={alert.status} />
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 italic">
                          "{alert.message_content}"
                        </p>

                        {alert.analysis && (
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20 mb-3">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                              <span className="uppercase tracking-wider text-[10px] opacity-70 block mb-1">AI Insight</span>
                              {alert.analysis}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {alert.assigned_to ? alert.assigned_to.username : 'Unassigned'}</span>
                            <span className="flex items-center gap-1.5"><InformationCircleIcon className="w-3.5 h-3.5" /> {alert.category}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyze(alert.id);
                            }}
                            disabled={alert.isAnalyzing || alert.sentiment !== 'Unknown'}
                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {alert.isAnalyzing ? 'Analyzing...' : <><ChartBarIcon className="w-4 h-4" /> Deep Analysis</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollableListContainer>
          </div>
        ) : (
          <FeedbackManagementPanel />
        )}
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onUpdate={handleAlertUpdate}
          users={users}
        />
      )}
    </div>
  );
};

export default SmartAlertsEnhanced;

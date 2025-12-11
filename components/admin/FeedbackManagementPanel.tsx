import React, { useState, useCallback, useMemo } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useStudentFeedback } from '../../hooks/useStudentFeedback';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/apiService';
import { PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon, UsersIcon } from '../icons/Icons';

interface FeedbackDetailModalProps {
  feedback: any;
  onClose: () => void;
  onUpdate: (feedback: any) => void;
  users: any[];
}

const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({ feedback, onClose, onUpdate, users }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(feedback.status);
  const [selectedAssignee, setSelectedAssignee] = useState(feedback.assigned_to?.id || '');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const { addNotification } = useNotification();

  const refreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const updatedUsers = await apiService.getUsers();
      // This would need to be passed back to parent, but for now just refresh
    } catch (error) {
      console.error('Failed to refresh users:', error);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const updated = await apiService.updateStudentFeedback(feedback.id, { status: selectedStatus });
      onUpdate(updated);
      addNotification('Feedback status updated', 'success');
      onClose();
    } catch (error) {
      addNotification('Failed to update feedback status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;

    setIsUpdating(true);
    try {
      const updated = await apiService.assignStudentFeedback(feedback.id, Number(selectedAssignee));
      onUpdate(updated);
      addNotification('Feedback assigned successfully', 'success');
    } catch (error) {
      addNotification('Failed to assign feedback', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const teachersAndAdmins = useMemo(
    () => users.filter(u => u.role === 'Admin' || u.role === 'Teacher'),
    [users]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Feedback Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: #{feedback.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Student Info */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">{feedback.student.username}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {feedback.status}
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {feedback.priority}
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {feedback.category}
              </span>
            </div>
          </div>

          {/* Message Content */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Feedback Message</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700 p-3 rounded">
              "{feedback.message_content}"
            </p>
          </div>

          {/* Assignment */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assign To</h3>
              <button
                onClick={refreshUsers}
                disabled={isRefreshingUsers}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                title="Refresh user list"
              >
                {isRefreshingUsers ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                title="Assign feedback to user"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <option value="">Unassigned</option>
                {teachersAndAdmins.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={isUpdating || !selectedAssignee}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Assign feedback"
              >
                Assign
              </button>
            </div>
            {feedback.assigned_to && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Currently assigned to: <span className="font-semibold">{feedback.assigned_to.username}</span>
              </p>
            )}
          </div>

          {/* Status Update */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Status</h3>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              title="Update feedback status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-2"
            >
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>

            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Update Feedback'}
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p>Submitted: {new Date(feedback.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(feedback.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackManagementPanel: React.FC = () => {
  const { addNotification } = useNotification();
  const { feedbacks, isLoading, error, refetch } = useStudentFeedback(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getStudentFeedbackStatistics(),
        ]);
        setUsers(usersData);
        setStatistics(statsData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      if (statusFilter && f.status !== statusFilter) return false;
      if (priorityFilter && f.priority !== priorityFilter) return false;
      if (categoryFilter && f.category !== categoryFilter) return false;
      return true;
    });
  }, [feedbacks, statusFilter, priorityFilter, categoryFilter]);

  const handleFeedbackUpdate = useCallback((updated: any) => {
    setSelectedFeedback(null);
    refetch();
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Acknowledged':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'High':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 font-medium">Error Loading Feedbacks</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Student Feedback Management">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Feedback Statistics</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time feedback from students</p>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          title="Refresh feedback list"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedbacks</p>
            <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">In Review</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.by_status?.['In Review'] || 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Unassigned</p>
            <p className="text-2xl font-bold text-purple-600">{statistics.unassigned}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{statistics.by_status?.['Resolved'] || 0}</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                title="Filter by status"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="">All</option>
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                title="Filter by priority"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                title="Filter by category"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="">All</option>
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Student feedback for administrative review and action.
      </p>

      {/* Feedback List */}
      <ScrollableListContainer className="space-y-4">
        {filteredFeedbacks.length === 0 && (
          <p className="text-center text-gray-500 pt-8">
            {feedbacks.length === 0 ? 'No feedback received yet.' : 'No feedback matches the selected filters.'}
          </p>
        )}

        <div className="space-y-4 pr-2">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 rounded-lg border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{feedback.student.username}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                      {feedback.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(feedback.priority)}`}>
                      {feedback.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {feedback.message_content.substring(0, 150)}{feedback.message_content.length > 150 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>{new Date(feedback.created_at).toLocaleString()}</span>
                    {feedback.assigned_to && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        {feedback.assigned_to.username}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600">
                      {feedback.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollableListContainer>

      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onUpdate={handleFeedbackUpdate}
          users={users}
        />
      )}
    </Card>
  );
};

export default FeedbackManagementPanel;

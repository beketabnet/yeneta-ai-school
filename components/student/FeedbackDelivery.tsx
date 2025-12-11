import React, { useState, useMemo } from 'react';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { useStudentFeedback } from '../../hooks/useStudentFeedback';
import { useNotification } from '../../contexts/NotificationContext';
import { PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, TrashIcon } from '../icons/Icons';

const FeedbackDelivery: React.FC = () => {
  const { addNotification } = useNotification();
  const { feedbacks, isLoading, error, createFeedback, deleteFeedback, refetch } = useStudentFeedback(false);

  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      addNotification('Please enter your feedback message', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedback({
        message_content: message.trim(),
        category,
        priority,
      });
      setMessage('');
      setCategory('General');
      setPriority('Medium');
      addNotification('Feedback submitted successfully!', 'success');
      await refetch();
    } catch (err) {
      addNotification('Failed to submit feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteFeedback(id);
        addNotification('Feedback deleted', 'success');
      } catch (err) {
        addNotification('Failed to delete feedback', 'error');
      }
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      if (statusFilter && f.status !== statusFilter) return false;
      if (categoryFilter && f.category !== categoryFilter) return false;
      return true;
    });
  }, [feedbacks, statusFilter, categoryFilter]);

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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Academic':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
      case 'Technical':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
      case 'Behavioral':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'General':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 font-medium">Error Loading Feedback</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card>
        <div className="flex items-center mb-6">
          <PaperAirplaneIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Send Feedback</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Share your thoughts with administrators</p>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Feedback
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your feedback, suggestions, or concerns..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.length} / 5000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                title="Select feedback category"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                title="Select feedback priority"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Card>

      {/* Feedback History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feedback History</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track the status of your submitted feedback</p>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            title="Refresh feedback list"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter feedback by status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              title="Filter feedback by category"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Technical">Technical</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading feedback...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <InformationCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-500">No feedback yet</p>
            <p className="text-sm text-gray-400 mt-1">Your submitted feedback will appear here</p>
          </div>
        ) : (
          <ScrollableListContainer maxHeight="max-h-[600px]">
            <div className="space-y-4 pr-2">
              {filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {new Date(feedback.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 mb-3">{feedback.message_content}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(feedback.priority)}`}>
                          {feedback.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(feedback.category)}`}>
                          {feedback.category}
                        </span>
                        {feedback.assigned_to && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Assigned to {feedback.assigned_to.first_name || feedback.assigned_to.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete feedback"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollableListContainer>
        )}
      </Card>
    </div>
  );
};

export default FeedbackDelivery;

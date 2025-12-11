import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  CpuChipIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '../icons/Icons';
import { useNotification } from '../../contexts/NotificationContext';

const API_BASE_URL = 'http://localhost:8000/api/';

interface APIKeyData {
  id: number;
  provider: string;
  provider_display: string;
  model_name: string;
  status: string;
  is_active: boolean;
  key_preview: string;
  key_value?: string;
  tier: string;
  max_tokens_per_minute: number;
  max_tokens_per_day: number;
  tokens_used_today: number;
  tokens_used_this_minute: number;
  usage_percentage_day: number;
  usage_percentage_minute: number;
  created_at: string;
}

interface AddKeyFormData {
  provider: string;
  key_value: string;
  model_name: string;
  tier: 'free' | 'paid';
  max_tokens_per_minute: number;
  max_tokens_per_day: number;
}

const APIKeyManager: React.FC = () => {
  const { addNotification } = useNotification();
  const [keys, setKeys] = useState<APIKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddKeyFormData>({
    provider: 'gemini',
    key_value: '',
    model_name: 'gemini-flash-latest',
    tier: 'free',
    max_tokens_per_minute: 60000,
    max_tokens_per_day: 1000000,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}academics/admin/api-keys/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(response.data.keys || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setKeys([]);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        addNotification('You do not have permission to manage API keys. Admin access required.', 'error');
      } else {
        addNotification('Failed to load API keys', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}academics/admin/api-keys/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      addNotification('API key added successfully', 'success');
      setFormData({
        provider: 'gemini',
        key_value: '',
        model_name: 'gemini-flash-latest',
        tier: 'free',
        max_tokens_per_minute: 60000,
        max_tokens_per_day: 1000000,
      });
      setShowAddForm(false);
      fetchKeys();
    } catch (err) {
      console.error('Add key error:', err);
      let errorMsg = 'Failed to add API key';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          errorMsg = 'You do not have permission to add API keys. Admin access required.';
        } else if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err.response?.status === 400) {
          errorMsg = 'Invalid API key data. Please check your inputs.';
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      addNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (keyId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}academics/admin/api-keys/${keyId}/deactivate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('API key deactivated', 'success');
      fetchKeys();
    } catch (err) {
      addNotification('Failed to deactivate API key', 'error');
    }
  };

  const handleReactivate = async (keyId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}academics/admin/api-keys/${keyId}/reactivate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('API key reactivated', 'success');
      fetchKeys();
    } catch (err) {
      addNotification('Failed to reactivate API key', 'error');
    }
  };

  const handleDelete = async (keyId: number) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}academics/admin/api-keys/${keyId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification('API key deleted', 'success');
      fetchKeys();
    } catch (err) {
      addNotification('Failed to delete API key', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Active</span>;
      case 'rate_limited':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">Rate Limited</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Inactive</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">{status}</span>;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getKeySuffix = (keyValue: string | undefined): string => {
    if (!keyValue) return '***';
    if (keyValue.length <= 20) return keyValue;
    return keyValue.slice(-20);
  };

  const handleCopyKey = (keyValue: string | undefined) => {
    if (!keyValue) {
      addNotification('API key not available', 'error');
      return;
    }
    navigator.clipboard.writeText(keyValue).then(() => {
      addNotification('API key copied to clipboard', 'success');
    }).catch(() => {
      addNotification('Failed to copy API key', 'error');
    });
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden h-full flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
            <KeyIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            API Key Manager
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage LLM provider keys and usage limits.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 shadow-sm"
            title="Refresh API keys"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Add Key
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {showAddForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-900/50 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-lg shadow-blue-500/5 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PlusIcon className="w-4 h-4 text-blue-500" />
                Configure New API Key
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Provider</label>
                  <div className="relative">
                    <CpuChipIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="serp">SERP API</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Tier</label>
                  <div className="relative">
                    <ShieldCheckIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.tier}
                      onChange={(e) => {
                        const tier = e.target.value as 'free' | 'paid';
                        setFormData({
                          ...formData,
                          tier,
                          max_tokens_per_minute: tier === 'free' ? 60000 : 90000,
                          max_tokens_per_day: tier === 'free' ? 1000000 : 2000000,
                        });
                      }}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="free">Free Tier</option>
                      <option value="paid">Paid Tier</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Model Name</label>
                  <div className="relative">
                    <CpuChipIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.model_name}
                      onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                      placeholder="e.g., gemini-flash-latest"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">API Key Secret</label>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.key_value}
                      onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                      placeholder="Paste your API key here"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Max Tokens / Min</label>
                  <div className="relative">
                    <ChartBarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.max_tokens_per_minute}
                      onChange={(e) => setFormData({ ...formData, max_tokens_per_minute: parseInt(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Max Tokens / Day</label>
                  <div className="relative">
                    <ChartBarIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.max_tokens_per_day}
                      onChange={(e) => setFormData({ ...formData, max_tokens_per_day: parseInt(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Save Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading API keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <KeyIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No API Keys Configured</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">Add your first API key to enable LLM capabilities for the application.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Add Key Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div key={key.id} className="bg-white/80 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${key.provider === 'openai' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                        key.provider === 'gemini' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'
                      }`}>
                      <CpuChipIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{key.provider_display}</h3>
                        {getStatusBadge(key.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {key.model_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${key.tier === 'paid' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                          {key.tier === 'paid' ? 'Paid Tier' : 'Free Tier'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        •••• {getKeySuffix(key.key_value)}
                      </code>
                      <button
                        onClick={() => handleCopyKey(key.key_value)}
                        className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title="Copy full key"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-1 ml-2">
                      {key.is_active ? (
                        <button
                          onClick={() => handleDeactivate(key.id)}
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(key.id)}
                          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Reactivate"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Daily Limit Usage</span>
                      <span className={`font-bold ${key.usage_percentage_day > 80 ? 'text-red-500' :
                          key.usage_percentage_day > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>{key.usage_percentage_day.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getUsageColor(key.usage_percentage_day)}`}
                        style={{ width: `${Math.min(key.usage_percentage_day, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Minute Limit Usage</span>
                      <span className={`font-bold ${key.usage_percentage_minute > 80 ? 'text-red-500' :
                          key.usage_percentage_minute > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>{key.usage_percentage_minute.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getUsageColor(key.usage_percentage_minute)}`}
                        style={{ width: `${Math.min(key.usage_percentage_minute, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeyManager;

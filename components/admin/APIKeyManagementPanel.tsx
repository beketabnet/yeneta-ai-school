import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '../icons/Icons';

interface APIKeyStatus {
  provider: string;
  total_keys: number;
  active_keys: number;
  stats: Array<{
    key: string;
    model: string;
    is_active: boolean;
    usage: {
      minute_usage: number;
      day_usage: number;
    };
    tokens_today: number;
    tokens_this_minute: number;
  }>;
}

interface APIKeyManagementPanelProps {
  onRefresh?: () => void;
}

const APIKeyManagementPanel: React.FC<APIKeyManagementPanelProps> = ({ onRefresh }) => {
  const [status, setStatus] = useState<Record<string, APIKeyStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/api-key-status/');
      if (!response.ok) throw new Error('Failed to fetch API key status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStatus();
    onRefresh?.();
  };

  if (loading) {
    return <div className="text-center py-8">Loading API key status...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Key Management</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          title="Refresh API key status"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(status).map(([provider, data]: [string, any]) => (
            <div key={provider} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {provider}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.active_keys > 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                  {data.active_keys}/{data.total_keys} Active
                </span>
              </div>

              <div className="space-y-3">
                {data.stats.map((stat, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {stat.key}
                      </span>
                      {stat.is_active ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    {stat.model && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Model: {stat.model}
                      </p>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Day Usage:</span>
                        <span className="font-medium">{stat.usage.day_usage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stat.usage.day_usage > 80
                              ? 'bg-red-500'
                              : stat.usage.day_usage > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stat.usage.day_usage, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Minute Usage:</span>
                        <span className="font-medium">{stat.usage.minute_usage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stat.usage.minute_usage > 80
                              ? 'bg-red-500'
                              : stat.usage.minute_usage > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stat.usage.minute_usage, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs mt-2 text-gray-500 dark:text-gray-400">
                        <span>Tokens today: {stat.tokens_today.toLocaleString()}</span>
                        <span>This min: {stat.tokens_this_minute}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Multi-API Key Strategy</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• System automatically rotates between available API keys</li>
          <li>• When a key reaches rate limits, it's temporarily deactivated</li>
          <li>• Requests are automatically routed to available keys</li>
          <li>• Monitor usage percentages to prevent service interruptions</li>
          <li>• Add more keys in .env to increase capacity</li>
        </ul>
      </div>
    </div>
  );
};

export default APIKeyManagementPanel;

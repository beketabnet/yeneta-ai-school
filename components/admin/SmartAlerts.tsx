import React, { useState, useEffect, useCallback } from 'react';
import { SmartAlert, Sentiment } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import { BellAlertIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, EyeIcon } from '../icons/Icons';

const SentimentIcon: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  switch (sentiment) {
    case 'Positive':
      return <CheckCircleIcon className="text-success" />;
    case 'Negative':
      return <ExclamationTriangleIcon className="text-danger" />;
    case 'Neutral':
      return <InformationCircleIcon className="text-blue-500" />;
    default:
      return <BellAlertIcon className="text-gray-400" />;
  }
};

const SmartAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getSmartAlerts();
            setAlerts(data);
        } catch (err) {
            setError("Failed to load smart alerts.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchAlerts();
  }, []);


  const handleAnalyze = useCallback(async (alertId: number) => {
    setAlerts(prevAlerts => 
        prevAlerts.map(a => a.id === alertId ? { ...a, isAnalyzing: true } : a)
    );

    try {
        const updatedAlert = await apiService.analyzeSmartAlert(alertId);
        setAlerts(prevAlerts =>
            prevAlerts.map(a => a.id === alertId ? { ...updatedAlert, isAnalyzing: false } : a)
        );
    } catch(err) {
        console.error("Failed to analyze alert:", err);
        // Revert UI state on failure
         setAlerts(prevAlerts => 
            prevAlerts.map(a => a.id === alertId ? { ...a, isAnalyzing: false } : a)
        );
    }
  }, []);

  if(isLoading) {
    return <Card title="Control Center with Smart Alerts"><p>Loading alerts...</p></Card>
  }

  if(error) {
    return <Card title="Control Center with Smart Alerts"><p className="text-danger">{error}</p></Card>
  }

  return (
    <Card title="Control Center with Smart Alerts">
      <p className="mb-4 text-sm">Real-time monitoring of student communications for potential issues. Alerts are automatically generated from AI Tutor interactions.</p>
      <div className="space-y-4 h-96 overflow-y-auto">
        {alerts.length === 0 && <p className="text-center text-gray-500 pt-8">No alerts have been generated yet.</p>}
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">
                <SentimentIcon sentiment={alert.sentiment} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{alert.student.username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{alert.message_content}"</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
              <button
                onClick={() => handleAnalyze(alert.id)}
                disabled={alert.isAnalyzing || alert.sentiment !== 'Unknown'}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {alert.isAnalyzing ? 'Analyzing...' : (alert.sentiment !== 'Unknown' ? 'Analyzed' : 'Analyze')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SmartAlerts;
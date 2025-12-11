import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';
import { useEngagementMonitorHybrid } from '../../../hooks/useEngagementMonitorHybrid';
import { AuthContext } from '../../../contexts/AuthContext';
import { EngagementContext } from '../../../contexts/EngagementContext';
import { VideoCameraIcon, VideoCameraSlashIcon } from '../../icons/Icons';
import { ChatMessage, Expression } from '../../../types';

interface EngagementMonitorProps {
  lessonId: string;
}

interface EngagementLog {
  timestamp: string;
  message: string;
  color: string;
}

const expressionEmojiMap: Record<Expression, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😮',
  disgusted: '🤢',
  fearful: '😨',
  unknown: '❓',
};

const getExpressionStyle = (
  expression: Expression
): Omit<EngagementLog, 'timestamp'> => {
  switch (expression) {
    case 'happy':
      return {
        message: 'Highly engaged and enjoying the lesson!',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'surprised':
      return {
        message: 'Surprised but interested in the content.',
        color: 'text-blue-600 dark:text-blue-400',
      };
    case 'neutral':
      return {
        message: 'Focused on the lesson.',
        color: 'text-gray-600 dark:text-gray-400',
      };
    case 'sad':
      return {
        message: 'May need additional support or clarification.',
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    case 'fearful':
      return {
        message: 'Seems anxious. Consider taking a break.',
        color: 'text-orange-600 dark:text-orange-400',
      };
    case 'angry':
      return {
        message: 'Frustrated. Try adjusting the lesson difficulty.',
        color: 'text-red-600 dark:text-red-400',
      };
    case 'disgusted':
      return {
        message: 'Seems unhappy with the content.',
        color: 'text-red-600 dark:text-red-400',
      };
    default:
      return {
        message: 'Engagement status is unknown.',
        color: 'text-gray-500 dark:text-gray-400',
      };
  }
};

const EngagementMonitor: React.FC<EngagementMonitorProps> = ({
  lessonId,
}) => {
  const aiClassroom = useContext(AIClassroomContext);
  const { user } = useContext(AuthContext);
  const { updateStudentEngagement } = useContext(EngagementContext);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const prevExpressionRef = useRef<Expression>('unknown');

  const [isMonitorEnabled, setIsMonitorEnabled] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<Expression>(
    'unknown'
  );
  const [engagementLogs, setEngagementLogs] = useState<EngagementLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop =
        logContainerRef.current.scrollHeight;
    }
  }, [engagementLogs]);

  useCallback(() => {
    if (user && isMonitorEnabled) {
      updateStudentEngagement(user.id.toString(), currentExpression);
    }

    if (
      isMonitorEnabled &&
      currentExpression !== prevExpressionRef.current
    ) {
      prevExpressionRef.current = currentExpression;
      const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const { message, color } = getExpressionStyle(currentExpression);
      setEngagementLogs((prev) =>
        [{ timestamp, message, color }, ...prev.slice(0, 99)]
      );
    }
  }, [user, isMonitorEnabled, currentExpression, updateStudentEngagement]);

  const { startMonitoring, stopMonitoring } = useEngagementMonitorHybrid({
    videoRef,
    canvasRef,
    isMonitorEnabled,
    onExpressionDetected: setCurrentExpression,
  });

  const handleToggleMonitor = async () => {
    if (!isMonitorEnabled) {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsMonitorEnabled(true);
          aiClassroom?.updateClassroomState({ webcamActive: true });
          await startMonitoring();
        }
      } catch (err: any) {
        setError(
          err.message ||
            'Failed to access webcam. Please check permissions.'
        );
        console.error('Webcam error:', err);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      setIsMonitorEnabled(false);
      aiClassroom?.updateClassroomState({ webcamActive: false });
      await stopMonitoring();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 border-b border-orange-700">
        <h2 className="text-lg font-bold">Engagement Monitor</h2>
        <p className="text-sm text-orange-100">
          Real-time emotion & engagement tracking
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg mb-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Video Feed */}
        <div className="relative w-full h-56 flex-shrink-0 bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform transition-transform ${
              isMonitorEnabled ? 'scale-x-[-1]' : 'scale-0'
            }`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full transform transition-transform ${
              isMonitorEnabled ? 'scale-x-[-1]' : 'scale-0'
            }`}
          />
          {!isMonitorEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <VideoCameraSlashIcon className="w-16 h-16" />
              <p className="mt-2 text-sm">Monitor is off</p>
            </div>
          )}
          {isMonitorEnabled && (
            <div className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-2xl">
              {expressionEmojiMap[currentExpression]}
            </div>
          )}
        </div>

        {/* Current Status */}
        {isMonitorEnabled && currentExpression && (
          <div className="mb-3 p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border-2 border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl animate-pulse">
                  {expressionEmojiMap[currentExpression]}
                </span>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Current Status
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      getExpressionStyle(currentExpression).color
                    }`}
                  >
                    {getExpressionStyle(currentExpression).message}
                  </p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Engagement Logs */}
        <div className="flex-1 min-h-0 flex flex-col mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              History
            </p>
            {engagementLogs.length > 0 && (
              <p className="text-xs text-gray-500">
                {engagementLogs.length} events
              </p>
            )}
          </div>
          <div
            ref={logContainerRef}
            className="flex-1 bg-black rounded-lg p-3 font-mono text-xs text-white overflow-y-auto"
          >
            {engagementLogs.length === 0 && isMonitorEnabled && (
              <p className="text-gray-500 animate-pulse">
                Calibrating engagement sensors...
              </p>
            )}
            {engagementLogs.length === 0 && !isMonitorEnabled && (
              <p className="text-gray-500">
                Enable monitor to see live analysis.
              </p>
            )}
            {engagementLogs.map((log, index) => (
              <p key={index} className="mb-1">
                <span className="text-gray-500">{log.timestamp}</span>
                <span className={`ml-2 ${log.color}`}>{log.message}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Control Button */}
      <div className="flex-shrink-0 border-t border-gray-300 dark:border-gray-700 p-4">
        <button
          onClick={handleToggleMonitor}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 font-semibold rounded-md text-white transition-colors ${
            isMonitorEnabled
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isMonitorEnabled ? (
            <VideoCameraSlashIcon className="w-5 h-5" />
          ) : (
            <VideoCameraIcon className="w-5 h-5" />
          )}
          <span>
            {isMonitorEnabled ? 'Disable Monitor' : 'Enable Monitor'}
          </span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Your video is processed on this device and is not stored.
        </p>
      </div>
    </div>
  );
};

export default EngagementMonitor;


import React, { useRef, useState, useEffect } from 'react';
import Card from '../Card';
import { VideoCameraIcon, VideoCameraSlashIcon } from '../icons/Icons';

const StudentCameraMonitor: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
        setError(null);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access the camera. Please check permissions and try again.");
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card title="Student Engagement Monitor">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md bg-black rounded-lg overflow-hidden shadow-lg mb-4">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-auto transform transition-transform ${isCameraOn ? 'scale-100' : 'scale-0'}`} />
          {!isCameraOn && (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <VideoCameraSlashIcon className="w-16 h-16" />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="flex flex-col items-center space-y-2">
           <button
            onClick={handleToggleCamera}
            className={`flex items-center space-x-2 px-6 py-2 text-white font-semibold rounded-md transition-colors ${isCameraOn ? 'bg-danger hover:bg-red-700' : 'bg-success hover:bg-green-700'}`}
          >
            {isCameraOn ? <VideoCameraSlashIcon /> : <VideoCameraIcon />}
            <span>{isCameraOn ? 'Stop Monitoring' : 'Start Monitoring'}</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md text-center">
            This tool uses the camera to gather real-time behavioral data for AI-powered adaptive learning and engagement analysis. All data processing is handled securely on the backend.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default StudentCameraMonitor;

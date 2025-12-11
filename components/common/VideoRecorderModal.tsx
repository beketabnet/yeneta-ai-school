import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoCameraIcon, VideoCameraSlashIcon, XMarkIcon } from '../icons/Icons';
import { Attachment } from '../../types';

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect: (attachment: Attachment) => void;
}

const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({ isOpen, onClose, onVideoSelect }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access camera. Please check permissions.");
      onClose();
    }
  }, [onClose]);

  const stopCamera = useCallback(() => {
    // This function ensures the webcam is completely shut down.
    // It gets all tracks from the stream and stops them, which releases the camera hardware
    // and turns off the indicator light.
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // The cleanup function returned by useEffect ensures that if the component unmounts
    // (e.g., user navigates away or logs out) while the modal is open,
    // the camera will be stopped properly. This is crucial for resource management and privacy.
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setVideoUrl(null);
    setVideoBlob(null);
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };
    recorder.start();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleUseVideo = () => {
    if (videoBlob && videoUrl) {
      onVideoSelect({
        url: videoUrl,
        type: 'video',
        name: `video-${Date.now()}.webm`,
      });
      handleClose();
    }
  };

  const handleDiscard = () => {
    setVideoUrl(null);
    setVideoBlob(null);
  };

  const handleClose = () => {
    setIsRecording(false);
    setVideoUrl(null);
    setVideoBlob(null);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Record Video Message</h3>
          <button 
              onClick={handleClose} 
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Close video recorder"
          >
              <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="bg-black rounded-md overflow-hidden aspect-video">
            <video ref={videoRef} muted={!videoUrl} controls={!!videoUrl} src={videoUrl || ''} className="w-full h-full" />
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!videoUrl ? (
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`px-6 py-3 text-white font-semibold rounded-full flex items-center justify-center space-x-2 w-full sm:w-auto ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-primary hover:bg-primary-dark'}`}
            >
              {isRecording ? <VideoCameraSlashIcon /> : <VideoCameraIcon />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleDiscard}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-md w-full sm:w-auto"
              >
                Discard
              </button>
              <button
                onClick={handleUseVideo}
                className="px-6 py-3 bg-success text-white font-semibold rounded-md w-full sm:w-auto"
              >
                Use Video
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorderModal;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MicrophoneIcon, XCircleIcon, XMarkIcon } from '../icons/Icons';
import { Attachment } from '../../types';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioSelect: (attachment: Attachment) => void;
}

const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isOpen, onClose, onAudioSelect }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
      onClose();
    }
  }, [onClose]);

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startMicrophone();
    } else {
      stopMicrophone();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      stopMicrophone();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, startMicrophone, stopMicrophone]);

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };

    recorder.start();

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleUseAudio = () => {
    if (audioBlob && audioUrl) {
      onAudioSelect({
        url: audioUrl,
        type: 'audio',
        name: `audio-${Date.now()}.webm`,
      });
      handleClose();
    }
  };

  const handleDiscard = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleClose = () => {
    setIsRecording(false);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Record Audio Message</h3>
          <button 
            onClick={handleClose} 
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Close audio recorder"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Recording Indicator */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <MicrophoneIcon className={`w-16 h-16 ${isRecording ? 'text-red-600' : 'text-gray-400'}`} />
            </div>

            {/* Timer */}
            <div className="text-3xl font-mono font-bold text-gray-800 dark:text-white">
              {formatTime(recordingTime)}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="w-full">
                <audio src={audioUrl} controls className="w-full" />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!audioUrl ? (
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`px-6 py-3 text-white font-semibold rounded-full flex items-center justify-center space-x-2 w-full sm:w-auto ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'}`}
            >
              {isRecording ? <XCircleIcon /> : <MicrophoneIcon />}
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
                onClick={handleUseAudio}
                className="px-6 py-3 bg-success text-white font-semibold rounded-md w-full sm:w-auto"
              >
                Use Audio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderModal;

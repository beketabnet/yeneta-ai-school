// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useRef, useCallback } from 'react';
import { Expression } from '../types';

declare const faceapi: any;

interface EngagementMonitorProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isMonitorEnabled: boolean;
    onExpressionChange: (expression: Expression) => void;
}

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const useEngagementMonitor = ({
    videoRef,
    canvasRef,
    isMonitorEnabled,
    onExpressionChange,
}: EngagementMonitorProps) => {
    const intervalRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isApiLoaded = useRef(false);

    const loadModels = useCallback(async () => {
        if (isApiLoaded.current || typeof faceapi === 'undefined') return;
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
            isApiLoaded.current = true;
        } catch (error) {
            console.error('Failed to load face-api models:', error);
        }
    }, []);

    const startVideo = useCallback(async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing webcam:', err);
        }
    }, [videoRef]);

    const stopVideo = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject = null;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            context?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [videoRef, canvasRef]);

    const handleDetections = useCallback(async () => {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        if (videoElement && !videoElement.paused && isApiLoaded.current && canvasElement) {
             const displaySize = { width: videoElement.clientWidth, height: videoElement.clientHeight };
            faceapi.matchDimensions(canvasElement, displaySize);
            
            const detections = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvasElement.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
            
            if (resizedDetections) {
                const { box } = resizedDetections.detection;
                 if (ctx) {
                    ctx.strokeStyle = '#8B5CF6'; // primary color
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                }

                const expressions = resizedDetections.expressions;
                const primaryExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b) as Expression;
                onExpressionChange(primaryExpression);
            } else {
                 onExpressionChange('unknown');
            }
        }
    }, [videoRef, canvasRef, onExpressionChange]);

    useEffect(() => {
        if (isMonitorEnabled) {
            loadModels().then(() => {
                startVideo();
            });
        } else {
            stopVideo();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            stopVideo();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isMonitorEnabled, loadModels, startVideo, stopVideo]);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        const playListener = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(handleDetections, 200); // Increased frequency for smoother tracking
        };
        
        if (isMonitorEnabled && isApiLoaded.current && videoElement) {
            videoElement.addEventListener('play', playListener);
        }

        return () => {
            if (videoElement) {
                videoElement.removeEventListener('play', playListener);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [isMonitorEnabled, videoRef, handleDetections]);
};

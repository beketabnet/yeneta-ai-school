/**
 * Engagement Monitor Hook with TensorFlow Lite (BlazeFace)
 * 
 * Features:
 * - Real-time face detection using TensorFlow.js BlazeFace model
 * - Draws bounding boxes around detected faces
 * - Processes everything client-side (no data sent to backend)
 * - Automatic webcam cleanup on disable/unmount
 * - Expression detection using face-api.js (fallback)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Expression } from '../types';

// Declare TensorFlow and face-api types
declare const tf: any;
declare const faceapi: any;

interface EngagementMonitorProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isMonitorEnabled: boolean;
    onExpressionChange: (expression: Expression) => void;
}

const FACE_API_MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const useEngagementMonitorTFLite = ({
    videoRef,
    canvasRef,
    isMonitorEnabled,
    onExpressionChange,
}: EngagementMonitorProps) => {
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const blazeFaceModelRef = useRef<any>(null);
    const faceApiLoadedRef = useRef(false);
    const isInitializedRef = useRef(false);

    /**
     * Load TensorFlow.js BlazeFace model for face detection
     */
    const loadBlazeFaceModel = useCallback(async () => {
        if (blazeFaceModelRef.current) return;
        
        try {
            console.log('Loading BlazeFace model...');
            
            // Check if blazeface is available (from CDN)
            if (typeof (window as any).blazeface !== 'undefined') {
                const model = await (window as any).blazeface.load();
                blazeFaceModelRef.current = model;
                console.log('BlazeFace model loaded successfully from CDN');
            } else {
                console.warn('BlazeFace not available, will use face-api.js for detection');
            }
        } catch (error) {
            console.error('Failed to load BlazeFace model:', error);
            console.log('Will use face-api.js for face detection');
        }
    }, []);

    /**
     * Load face-api.js models for expression detection
     */
    const loadFaceApiModels = useCallback(async () => {
        if (faceApiLoadedRef.current || typeof faceapi === 'undefined') return;
        
        try {
            console.log('Loading face-api.js models...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URL),
            ]);
            faceApiLoadedRef.current = true;
            console.log('face-api.js models loaded successfully');
        } catch (error) {
            console.error('Failed to load face-api.js models:', error);
        }
    }, []);

    /**
     * Start webcam with proper error handling
     */
    const startWebcam = useCallback(async () => {
        if (!videoRef.current || streamRef.current) return;

        try {
            console.log('Requesting webcam access...');
            
            // Request webcam with specific constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // Wait for video to be ready
                await new Promise<void>((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play().then(() => {
                                console.log('Webcam started successfully');
                                resolve();
                            }).catch((err) => {
                                console.error('Error playing video:', err);
                                resolve();
                            });
                        };
                    }
                });
            }
        } catch (error: any) {
            console.error('Error accessing webcam:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'NotAllowedError') {
                alert('Camera access denied. Please allow camera permissions and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera found. Please connect a camera and try again.');
            } else {
                alert(`Camera error: ${error.message}`);
            }
        }
    }, [videoRef]);

    /**
     * Stop webcam and cleanup
     */
    const stopWebcam = useCallback(() => {
        console.log('Stopping webcam...');
        
        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped track: ${track.kind}`);
            });
            streamRef.current = null;
        }

        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.pause();
        }

        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Cancel animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        console.log('Webcam stopped successfully');
    }, [videoRef, canvasRef]);

    /**
     * Detect faces using BlazeFace or face-api.js
     */
    const detectFacesWithBlazeFace = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;
        if (video.readyState !== 4) return; // Not ready

        try {
            // Setup canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Match canvas size to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let predictions: any[] = [];
            
            // Try BlazeFace first
            if (blazeFaceModelRef.current) {
                try {
                    predictions = await blazeFaceModelRef.current.estimateFaces(video, false);
                    if (predictions && predictions.length > 0) {
                        console.log('BlazeFace detected', predictions.length, 'face(s)');
                    }
                } catch (blazeError) {
                    console.error('BlazeFace detection error:', blazeError);
                    predictions = [];
                }
            }
            // Fallback to face-api.js if BlazeFace not available or failed
            if (predictions.length === 0 && faceApiLoadedRef.current && typeof faceapi !== 'undefined') {
                try {
                    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
                    if (detection) {
                        console.log('face-api.js detected face (fallback)');
                        // Convert face-api.js detection to BlazeFace format
                        const box = detection.box;
                        predictions = [{
                            topLeft: [box.x, box.y],
                            bottomRight: [box.x + box.width, box.y + box.height],
                            landmarks: null
                        }];
                    }
                } catch (faceApiError) {
                    console.error('face-api.js detection error:', faceApiError);
                    predictions = [];
                }
            }

            if (predictions && predictions.length > 0) {
                // Draw bounding boxes for each detected face
                predictions.forEach((prediction: any) => {
                    const start = prediction.topLeft;
                    const end = prediction.bottomRight;
                    const size = [end[0] - start[0], end[1] - start[1]];

                    // Draw bounding box
                    ctx.strokeStyle = '#8B5CF6'; // Primary color (violet)
                    ctx.lineWidth = 3;
                    ctx.strokeRect(start[0], start[1], size[0], size[1]);

                    // Draw corner markers for better visibility
                    const cornerLength = 20;
                    ctx.strokeStyle = '#FFD700'; // Secondary color (gold)
                    ctx.lineWidth = 4;

                    // Top-left corner
                    ctx.beginPath();
                    ctx.moveTo(start[0], start[1] + cornerLength);
                    ctx.lineTo(start[0], start[1]);
                    ctx.lineTo(start[0] + cornerLength, start[1]);
                    ctx.stroke();

                    // Top-right corner
                    ctx.beginPath();
                    ctx.moveTo(end[0] - cornerLength, start[1]);
                    ctx.lineTo(end[0], start[1]);
                    ctx.lineTo(end[0], start[1] + cornerLength);
                    ctx.stroke();

                    // Bottom-left corner
                    ctx.beginPath();
                    ctx.moveTo(start[0], end[1] - cornerLength);
                    ctx.lineTo(start[0], end[1]);
                    ctx.lineTo(start[0] + cornerLength, end[1]);
                    ctx.stroke();

                    // Bottom-right corner
                    ctx.beginPath();
                    ctx.moveTo(end[0] - cornerLength, end[1]);
                    ctx.lineTo(end[0], end[1]);
                    ctx.lineTo(end[0], end[1] - cornerLength);
                    ctx.stroke();

                    // Draw keypoints (eyes, nose, mouth, ears)
                    if (prediction.landmarks) {
                        ctx.fillStyle = '#00A99D'; // Accent color
                        prediction.landmarks.forEach((landmark: number[]) => {
                            ctx.beginPath();
                            ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
                            ctx.fill();
                        });
                    }
                });

                // Detect expression using face-api.js if available
                if (faceApiLoadedRef.current && typeof faceapi !== 'undefined') {
                    try {
                        const detection = await faceapi
                            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                            .withFaceExpressions();

                        if (detection) {
                            const expressions = detection.expressions;
                            const primaryExpression = Object.keys(expressions).reduce(
                                (a, b) => expressions[a] > expressions[b] ? a : b
                            ) as Expression;
                            onExpressionChange(primaryExpression);
                        } else {
                            onExpressionChange('neutral');
                        }
                    } catch (error) {
                        // Silently fail expression detection
                        onExpressionChange('neutral');
                    }
                } else {
                    // Default to neutral if expression detection not available
                    onExpressionChange('neutral');
                }
            } else {
                // No face detected
                onExpressionChange('unknown');
            }
        } catch (error) {
            console.error('Error detecting faces:', error);
            // Don't crash - just continue
            onExpressionChange('unknown');
        }

        // Continue detection loop - ALWAYS continue if monitor is enabled
        if (isMonitorEnabled && videoRef.current && videoRef.current.srcObject) {
            animationFrameRef.current = requestAnimationFrame(detectFacesWithBlazeFace);
        } else if (!isMonitorEnabled) {
            console.log('Monitor disabled, stopping detection loop');
        } else if (!videoRef.current || !videoRef.current.srcObject) {
            console.warn('Video element lost, stopping detection loop');
        }
    }, [videoRef, canvasRef, isMonitorEnabled, onExpressionChange]);

    /**
     * Start the detection loop
     */
    const startDetectionLoop = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        console.log('Starting detection loop...');
        detectFacesWithBlazeFace();
    }, [detectFacesWithBlazeFace]);

    /**
     * Initialize models and start detection
     */
    const initialize = useCallback(async () => {
        if (isInitializedRef.current) return;
        
        console.log('Initializing engagement monitor...');
        isInitializedRef.current = true;

        // Load models in parallel
        console.log('Loading models...');
        await Promise.all([
            loadBlazeFaceModel(),
            loadFaceApiModels()
        ]);
        console.log('Models loaded. BlazeFace:', !!blazeFaceModelRef.current, 'FaceAPI:', faceApiLoadedRef.current);

        // Start webcam
        console.log('Starting webcam...');
        await startWebcam();
        console.log('Webcam started, waiting for video to be ready...');

        // Wait a bit for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Start detection loop
        startDetectionLoop();
    }, [loadBlazeFaceModel, loadFaceApiModels, startWebcam, startDetectionLoop]);

    /**
     * Main effect: Handle enable/disable
     */
    useEffect(() => {
        if (isMonitorEnabled) {
            isInitializedRef.current = false;
            initialize();
        } else {
            stopWebcam();
            isInitializedRef.current = false;
        }

        // Cleanup on unmount
        return () => {
            stopWebcam();
            isInitializedRef.current = false;
        };
    }, [isMonitorEnabled, initialize, stopWebcam]);

    /**
     * Cleanup on page navigation/unmount
     */
    useEffect(() => {
        return () => {
            console.log('Component unmounting, cleaning up webcam...');
            stopWebcam();
        };
    }, [stopWebcam]);
};

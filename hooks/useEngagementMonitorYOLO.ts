/**
 * Engagement Monitor Hook with YOLOv11 Object Detection
 * 
 * Features:
 * - Real-time person detection using YOLOv11n ONNX model
 * - Detects 80 COCO dataset classes (person, chair, laptop, etc.)
 * - Draws bounding boxes around detected persons
 * - Client-side processing with ONNX Runtime Web
 * - Can be extended for other object detection analytics
 * - Automatic webcam cleanup on disable/unmount
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Expression } from '../types';

// ONNX Runtime types
declare const ort: any;

// COCO dataset class names (80 classes)
const COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

interface EngagementMonitorProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isMonitorEnabled: boolean;
    onExpressionChange: (expression: Expression) => void;
}

interface Detection {
    class: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
}

export const useEngagementMonitorYOLO = ({
    videoRef,
    canvasRef,
    isMonitorEnabled,
    onExpressionChange
}: EngagementMonitorProps) => {
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    const isInitializedRef = useRef(false);
    const lastDetectionTimeRef = useRef<number>(0);

    // YOLOv11n model configuration
    const MODEL_INPUT_SIZE = 640; // YOLOv11n uses 640x640 input
    const CONFIDENCE_THRESHOLD = 0.5; // Minimum confidence for detection
    const IOU_THRESHOLD = 0.45; // Non-maximum suppression threshold
    const MODEL_URL = '/models/yolov11n.onnx'; // We'll need to download this

    /**
     * Load YOLOv11 ONNX model
     */
    const loadYOLOModel = useCallback(async () => {
        if (sessionRef.current || typeof ort === 'undefined') return;

        try {
            console.log('Loading YOLOv11n ONNX model...');
            
            // Create ONNX Runtime session
            sessionRef.current = await ort.InferenceSession.create(MODEL_URL, {
                executionProviders: ['wasm'], // Use WebAssembly for better performance
                graphOptimizationLevel: 'all'
            });
            
            console.log('YOLOv11n model loaded successfully');
            console.log('Model inputs:', sessionRef.current.inputNames);
            console.log('Model outputs:', sessionRef.current.outputNames);
        } catch (error) {
            console.error('Failed to load YOLOv11 model:', error);
            console.log('Make sure yolov11n.onnx is in the /public/models/ directory');
        }
    }, [MODEL_URL]);

    /**
     * Start webcam
     */
    const startWebcam = useCallback(async () => {
        if (!videoRef.current || streamRef.current) return;

        try {
            console.log('Requesting webcam access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;

            // Wait for video to be ready
            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        console.log('Webcam started successfully');
                        resolve();
                    });
                };
            });
        } catch (error) {
            console.error('Error accessing webcam:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('Camera permission denied. Please allow camera access to use the engagement monitor.');
                } else if (error.name === 'NotFoundError') {
                    alert('No camera found. Please connect a camera to use the engagement monitor.');
                } else {
                    alert(`Camera error: ${error.message}`);
                }
            }
        }
    }, [videoRef]);

    /**
     * Stop webcam
     */
    const stopWebcam = useCallback(() => {
        console.log('Stopping webcam...');

        // Stop all video tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            streamRef.current = null;
        }

        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
     * Preprocess video frame for YOLO input
     */
    const preprocessFrame = useCallback((video: HTMLVideoElement): Float32Array => {
        // Create temporary canvas for preprocessing
        const canvas = document.createElement('canvas');
        canvas.width = MODEL_INPUT_SIZE;
        canvas.height = MODEL_INPUT_SIZE;
        const ctx = canvas.getContext('2d')!;

        // Draw video frame to canvas (resize to 640x640)
        ctx.drawImage(video, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

        // Get image data
        const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
        const pixels = imageData.data;

        // Convert to float32 array and normalize (RGB format, CHW layout)
        const input = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
        
        for (let i = 0; i < pixels.length; i += 4) {
            const pixelIndex = i / 4;
            const r = pixels[i] / 255.0;
            const g = pixels[i + 1] / 255.0;
            const b = pixels[i + 2] / 255.0;

            // CHW format: [R channel, G channel, B channel]
            input[pixelIndex] = r;
            input[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + pixelIndex] = g;
            input[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + pixelIndex] = b;
        }

        return input;
    }, [MODEL_INPUT_SIZE]);

    /**
     * Non-maximum suppression to remove overlapping boxes
     */
    const nonMaxSuppression = useCallback((detections: Detection[]): Detection[] => {
        // Sort by confidence (descending)
        detections.sort((a, b) => b.confidence - a.confidence);

        const keep: Detection[] = [];

        while (detections.length > 0) {
            const current = detections[0];
            keep.push(current);
            detections = detections.slice(1);

            // Remove overlapping boxes
            detections = detections.filter(det => {
                const iou = calculateIoU(current.bbox, det.bbox);
                return iou < IOU_THRESHOLD;
            });
        }

        return keep;
    }, [IOU_THRESHOLD]);

    /**
     * Calculate Intersection over Union (IoU)
     */
    const calculateIoU = (box1: number[], box2: number[]): number => {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const x1_max = x1 + w1;
        const y1_max = y1 + h1;
        const x2_max = x2 + w2;
        const y2_max = y2 + h2;

        const inter_x1 = Math.max(x1, x2);
        const inter_y1 = Math.max(y1, y2);
        const inter_x2 = Math.min(x1_max, x2_max);
        const inter_y2 = Math.min(y1_max, y2_max);

        const inter_area = Math.max(0, inter_x2 - inter_x1) * Math.max(0, inter_y2 - inter_y1);
        const box1_area = w1 * h1;
        const box2_area = w2 * h2;
        const union_area = box1_area + box2_area - inter_area;

        return union_area > 0 ? inter_area / union_area : 0;
    };

    /**
     * Process YOLO output and extract detections
     */
    const processOutput = useCallback((output: Float32Array, videoWidth: number, videoHeight: number): Detection[] => {
        const detections: Detection[] = [];
        
        // YOLOv11 output format: [batch, 84, 8400]
        // 84 = 4 (bbox) + 80 (classes)
        const numDetections = 8400;
        const numClasses = 80;

        for (let i = 0; i < numDetections; i++) {
            // Get class scores
            let maxScore = 0;
            let maxClass = 0;

            for (let c = 0; c < numClasses; c++) {
                const score = output[i + (4 + c) * numDetections];
                if (score > maxScore) {
                    maxScore = score;
                    maxClass = c;
                }
            }

            // Filter by confidence threshold
            if (maxScore > CONFIDENCE_THRESHOLD) {
                // Get bbox coordinates (center_x, center_y, width, height)
                const cx = output[i];
                const cy = output[i + numDetections];
                const w = output[i + 2 * numDetections];
                const h = output[i + 3 * numDetections];

                // Convert to corner coordinates and scale to video size
                const scaleX = videoWidth / MODEL_INPUT_SIZE;
                const scaleY = videoHeight / MODEL_INPUT_SIZE;

                const x = (cx - w / 2) * scaleX;
                const y = (cy - h / 2) * scaleY;
                const width = w * scaleX;
                const height = h * scaleY;

                detections.push({
                    class: COCO_CLASSES[maxClass],
                    confidence: maxScore,
                    bbox: [x, y, width, height]
                });
            }
        }

        // Apply non-maximum suppression
        return nonMaxSuppression(detections);
    }, [CONFIDENCE_THRESHOLD, MODEL_INPUT_SIZE, nonMaxSuppression]);

    /**
     * Draw bounding boxes on canvas
     */
    const drawDetections = useCallback((detections: Detection[], canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach(det => {
            const [x, y, w, h] = det.bbox;

            // Different colors for different classes
            const isPerson = det.class === 'person';
            const color = isPerson ? '#8B5CF6' : '#00A99D'; // Violet for person, teal for others

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Draw label background
            const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
            ctx.font = '14px Arial';
            const textWidth = ctx.measureText(label).width;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);

            // Draw label text
            ctx.fillStyle = 'white';
            ctx.fillText(label, x + 5, y - 7);

            // Draw corner markers for persons
            if (isPerson) {
                const cornerSize = 20;
                ctx.strokeStyle = '#FFD700'; // Gold
                ctx.lineWidth = 4;

                // Top-left
                ctx.beginPath();
                ctx.moveTo(x, y + cornerSize);
                ctx.lineTo(x, y);
                ctx.lineTo(x + cornerSize, y);
                ctx.stroke();

                // Top-right
                ctx.beginPath();
                ctx.moveTo(x + w - cornerSize, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w, y + cornerSize);
                ctx.stroke();

                // Bottom-left
                ctx.beginPath();
                ctx.moveTo(x, y + h - cornerSize);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x + cornerSize, y + h);
                ctx.stroke();

                // Bottom-right
                ctx.beginPath();
                ctx.moveTo(x + w - cornerSize, y + h);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x + w, y + h - cornerSize);
                ctx.stroke();
            }
        });

        console.log(`Detected ${detections.length} objects:`, detections.map(d => d.class).join(', '));
    }, []);

    /**
     * Run YOLO detection on video frame
     */
    const detectObjects = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !sessionRef.current) return;
        if (video.readyState !== 4) return;

        try {
            // Throttle detection to ~10 FPS for performance
            const now = Date.now();
            if (now - lastDetectionTimeRef.current < 100) {
                if (isMonitorEnabled && videoRef.current && videoRef.current.srcObject) {
                    animationFrameRef.current = requestAnimationFrame(detectObjects);
                }
                return;
            }
            lastDetectionTimeRef.current = now;

            // Match canvas size to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Preprocess frame
            const input = preprocessFrame(video);

            // Create ONNX tensor
            const tensor = new ort.Tensor('float32', input, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

            // Run inference
            const feeds = { images: tensor };
            const results = await sessionRef.current.run(feeds);

            // Get output tensor
            const output = results[sessionRef.current.outputNames[0]];

            // Process detections
            const detections = processOutput(output.data, video.videoWidth, video.videoHeight);

            // Draw bounding boxes
            drawDetections(detections, canvas);

            // Update engagement based on person detection
            const personDetected = detections.some(d => d.class === 'person');
            if (personDetected) {
                onExpressionChange('neutral'); // Person present
            } else {
                onExpressionChange('unknown'); // No person detected
            }
        } catch (error) {
            console.error('Error during object detection:', error);
            onExpressionChange('unknown');
        }

        // Continue detection loop
        if (isMonitorEnabled && videoRef.current && videoRef.current.srcObject) {
            animationFrameRef.current = requestAnimationFrame(detectObjects);
        } else if (!isMonitorEnabled) {
            console.log('Monitor disabled, stopping detection loop');
        } else if (!videoRef.current || !videoRef.current.srcObject) {
            console.warn('Video element lost, stopping detection loop');
        }
    }, [videoRef, canvasRef, isMonitorEnabled, onExpressionChange, preprocessFrame, processOutput, drawDetections, MODEL_INPUT_SIZE]);

    /**
     * Start detection loop
     */
    const startDetectionLoop = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        console.log('Starting YOLOv11 detection loop...');
        detectObjects();
    }, [detectObjects]);

    /**
     * Initialize models and start detection
     */
    const initialize = useCallback(async () => {
        if (isInitializedRef.current) return;

        console.log('Initializing YOLOv11 engagement monitor...');
        isInitializedRef.current = true;

        // Load YOLO model
        console.log('Loading YOLOv11 model...');
        await loadYOLOModel();
        console.log('Model loaded:', !!sessionRef.current);

        // Start webcam
        console.log('Starting webcam...');
        await startWebcam();
        console.log('Webcam started, waiting for video to be ready...');

        // Wait for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Start detection loop
        if (sessionRef.current) {
            startDetectionLoop();
        } else {
            console.error('YOLOv11 model not loaded, cannot start detection');
        }
    }, [loadYOLOModel, startWebcam, startDetectionLoop]);

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

    return {
        isInitialized: isInitializedRef.current
    };
};

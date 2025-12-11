/**
 * Hybrid Engagement Monitor: YOLOv11 + face-api.js
 * 
 * Features:
 * - YOLOv11: Person detection + 80 COCO objects (laptop, chair, book, etc.)
 * - face-api.js: Facial expression detection (happy, sad, neutral, etc.)
 * - Draws bounding box ONLY when person is detected
 * - Provides real-time expression feedback with colored status
 * - Stores detected objects for future analytics
 * - Client-side processing only
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Expression } from '../types';

// ONNX Runtime and face-api types
declare const ort: any;
declare const faceapi: any;

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

export const useEngagementMonitorHybrid = ({
    videoRef,
    canvasRef,
    isMonitorEnabled,
    onExpressionChange
}: EngagementMonitorProps) => {
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const yoloSessionRef = useRef<any>(null);
    const faceApiLoadedRef = useRef(false);
    const isInitializedRef = useRef(false);
    const lastDetectionTimeRef = useRef<number>(0);
    const lastLogTimeRef = useRef<number>(0);
    const detectedObjectsRef = useRef<Set<string>>(new Set());
    
    // Smooth bounding box interpolation
    const previousBboxRef = useRef<number[] | null>(null);
    const smoothingFactor = 0.3; // Lower = smoother but more lag, Higher = more responsive

    // Model configuration
    const MODEL_INPUT_SIZE = 640;
    const CONFIDENCE_THRESHOLD = 0.5;
    const IOU_THRESHOLD = 0.45;
    const MODEL_URL = '/models/yolov11n.onnx';
    const FACE_API_MODEL_URL = '/models';

    /**
     * Load YOLOv11 ONNX model
     */
    const loadYOLOModel = useCallback(async () => {
        if (yoloSessionRef.current) {
            console.log('✅ YOLO model already loaded');
            return;
        }
        
        if (typeof ort === 'undefined') {
            console.error('❌ ONNX Runtime (ort) is NOT available! Check if CDN loaded.');
            console.log('Expected: window.ort should be defined');
            return;
        }

        try {
            console.log('🚀 Loading YOLOv11n ONNX model from:', MODEL_URL);
            yoloSessionRef.current = await ort.InferenceSession.create(MODEL_URL, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });
            console.log('✅ YOLOv11n model loaded successfully');
            console.log('Model inputs:', yoloSessionRef.current.inputNames);
            console.log('Model outputs:', yoloSessionRef.current.outputNames);
        } catch (error) {
            console.error('❌ Failed to load YOLOv11 model:', error);
            console.log('⚠️  Will continue without object detection.');
            yoloSessionRef.current = null;
        }
    }, [MODEL_URL]);

    /**
     * Load face-api.js models for expression detection
     */
    const loadFaceApiModels = useCallback(async () => {
        if (faceApiLoadedRef.current) {
            console.log('✅ face-api.js models already loaded');
            return;
        }
        
        if (typeof faceapi === 'undefined') {
            console.error('❌ face-api.js is NOT available! Check if CDN loaded.');
            console.log('Expected: window.faceapi should be defined');
            return;
        }

        try {
            console.log('🚀 Loading face-api.js models from:', FACE_API_MODEL_URL);
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URL)
            ]);
            faceApiLoadedRef.current = true;
            console.log('✅ face-api.js models loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load face-api.js models:', error);
            console.log('⚠️  Will continue without expression detection');
            console.log('Error details:', error.message);
            faceApiLoadedRef.current = false;
        }
    }, [FACE_API_MODEL_URL]);

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

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        console.log('✅ Webcam started successfully');
                        resolve();
                    });
                };
            });
        } catch (error) {
            console.error('Error accessing webcam:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('Camera permission denied. Please allow camera access.');
                } else if (error.name === 'NotFoundError') {
                    alert('No camera found. Please connect a camera.');
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

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        detectedObjectsRef.current.clear();
        console.log('✅ Webcam stopped successfully');
    }, [videoRef, canvasRef]);

    /**
     * Preprocess video frame for YOLO
     */
    const preprocessFrame = useCallback((video: HTMLVideoElement): Float32Array => {
        const canvas = document.createElement('canvas');
        canvas.width = MODEL_INPUT_SIZE;
        canvas.height = MODEL_INPUT_SIZE;
        const ctx = canvas.getContext('2d')!;

        ctx.drawImage(video, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
        const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
        const pixels = imageData.data;

        const input = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
        
        for (let i = 0; i < pixels.length; i += 4) {
            const pixelIndex = i / 4;
            input[pixelIndex] = pixels[i] / 255.0;
            input[MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + pixelIndex] = pixels[i + 1] / 255.0;
            input[2 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE + pixelIndex] = pixels[i + 2] / 255.0;
        }

        return input;
    }, [MODEL_INPUT_SIZE]);

    /**
     * Calculate IoU for NMS
     */
    const calculateIoU = (box1: number[], box2: number[]): number => {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const inter_x1 = Math.max(x1, x2);
        const inter_y1 = Math.max(y1, y2);
        const inter_x2 = Math.min(x1 + w1, x2 + w2);
        const inter_y2 = Math.min(y1 + h1, y2 + h2);

        const inter_area = Math.max(0, inter_x2 - inter_x1) * Math.max(0, inter_y2 - inter_y1);
        const union_area = w1 * h1 + w2 * h2 - inter_area;

        return union_area > 0 ? inter_area / union_area : 0;
    };

    /**
     * Non-maximum suppression
     */
    const nonMaxSuppression = useCallback((detections: Detection[]): Detection[] => {
        detections.sort((a, b) => b.confidence - a.confidence);
        const keep: Detection[] = [];

        while (detections.length > 0) {
            const current = detections[0];
            keep.push(current);
            detections = detections.slice(1).filter(det => {
                const iou = calculateIoU(current.bbox, det.bbox);
                return iou < IOU_THRESHOLD;
            });
        }

        return keep;
    }, [IOU_THRESHOLD]);

    /**
     * Process YOLO output
     * YOLOv11 output format: [1, 8400, 84] (transposed)
     * Each row: [cx, cy, w, h, class0_score, class1_score, ..., class79_score]
     */
    const processYOLOOutput = useCallback((output: Float32Array, videoWidth: number, videoHeight: number): Detection[] => {
        const detections: Detection[] = [];
        
        const numPredictions = 8400;
        const numClasses = 80;
        const outputSize = 84; // 4 bbox + 80 classes
        
        console.log('🔍 Processing YOLO output, array length:', output.length);
        console.log('🔍 Expected format: [1, 8400, 84] = 705,600 elements');

        // YOLOv11 output is [1, 8400, 84] - each prediction is 84 consecutive values
        for (let i = 0; i < numPredictions; i++) {
            const offset = i * outputSize;
            
            // Get bbox coordinates (first 4 values of this prediction)
            const cx = output[offset + 0];
            const cy = output[offset + 1];
            const w = output[offset + 2];
            const h = output[offset + 3];
            
            // Get class scores (next 80 values)
            let maxScore = 0;
            let maxClass = 0;

            for (let c = 0; c < numClasses; c++) {
                const score = output[offset + 4 + c];
                if (score > maxScore) {
                    maxScore = score;
                    maxClass = c;
                }
            }

            if (maxScore > CONFIDENCE_THRESHOLD) {
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
                
                // Log first few detections for debugging
                if (detections.length <= 3) {
                    console.log(`🔍 Detection ${detections.length}: ${COCO_CLASSES[maxClass]} at (${x.toFixed(0)}, ${y.toFixed(0)}) ${(maxScore * 100).toFixed(0)}%`);
                }
            }
        }
        
        console.log(`✅ Found ${detections.length} detections before NMS`);
        const filtered = nonMaxSuppression(detections);
        console.log(`✅ ${filtered.length} detections after NMS:`, filtered.map(d => `${d.class} (${(d.confidence * 100).toFixed(0)}%)`).join(', '));

        return filtered;
    }, [CONFIDENCE_THRESHOLD, MODEL_INPUT_SIZE, nonMaxSuppression]);

    /**
     * Draw bounding box for person detection with smooth interpolation
     */
    const drawPersonBoundingBox = useCallback((bbox: number[], canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Smooth interpolation for less jittery movement
        let smoothedBbox = bbox;
        if (previousBboxRef.current) {
            smoothedBbox = bbox.map((val, idx) => {
                const prev = previousBboxRef.current![idx];
                return prev + (val - prev) * smoothingFactor;
            });
        }
        previousBboxRef.current = smoothedBbox;

        const [x, y, w, h] = smoothedBbox;

        // Draw violet bounding box with rounded corners
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        // Draw gold corner markers (animated style)
        const cornerSize = 20;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 8;

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

        // Draw label
        const label = 'Person Detected';
        ctx.font = '14px Arial';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = '#8B5CF6';
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        ctx.fillStyle = 'white';
        ctx.fillText(label, x + 5, y - 7);
    }, []);

    /**
     * Detect facial expression using face-api.js
     */
    const detectExpression = useCallback(async (video: HTMLVideoElement): Promise<Expression> => {
        if (!faceApiLoadedRef.current || typeof faceapi === 'undefined') {
            return 'neutral';
        }

        try {
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (detection) {
                const expressions = detection.expressions;
                const primaryExpression = Object.keys(expressions).reduce(
                    (a, b) => expressions[a] > expressions[b] ? a : b
                ) as Expression;
                return primaryExpression;
            }
        } catch (error) {
            // Silently handle expression detection errors
        }

        return 'neutral';
    }, []);

    /**
     * Main detection loop - Hybrid YOLOv11 + face-api.js
     */
    const runDetection = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;
        if (video.readyState !== 4) return;

        try {
            // Throttle to ~20 FPS for smoother tracking (50ms between frames)
            const now = Date.now();
            if (now - lastDetectionTimeRef.current < 50) {
                if (isMonitorEnabled && videoRef.current && videoRef.current.srcObject) {
                    animationFrameRef.current = requestAnimationFrame(runDetection);
                }
                return;
            }
            lastDetectionTimeRef.current = now;

            // Match canvas size to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Clear canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            let personDetected = false;
            let personBbox: number[] | null = null;

            // Run YOLO detection if model is loaded
            if (yoloSessionRef.current) {
                try {
                    const input = preprocessFrame(video);
                    const tensor = new ort.Tensor('float32', input, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
                    const feeds = { images: tensor };
                    const results = await yoloSessionRef.current.run(feeds);
                    const output = results[yoloSessionRef.current.outputNames[0]];
                    const detections = processYOLOOutput(output.data, video.videoWidth, video.videoHeight);

                    // Store detected objects for analytics
                    detections.forEach(d => detectedObjectsRef.current.add(d.class));

                    // Check for person detection (ONLY draw bounding box for person)
                    const personDet = detections.find(d => d.class === 'person');
                    if (personDet) {
                        personDetected = true;
                        personBbox = personDet.bbox;
                        // Only log person detection occasionally (every 3 seconds)
                        if (now - lastLogTimeRef.current > 3000) {
                            console.log(`👤 Person detected with ${(personDet.confidence * 100).toFixed(0)}% confidence`);
                            lastLogTimeRef.current = now;
                        }
                        drawPersonBoundingBox(personDet.bbox, canvas);
                    }

                    // Log other detected objects occasionally (for analytics, every 5 seconds)
                    const otherObjects = detections.filter(d => d.class !== 'person').map(d => d.class);
                    if (otherObjects.length > 0 && now - lastLogTimeRef.current > 5000) {
                        console.log('📊 Other objects detected:', otherObjects.join(', '));
                    }
                } catch (yoloError) {
                    console.error('❌ YOLO detection error:', yoloError);
                }
            } else {
                console.warn('⚠️  YOLO model not loaded, skipping object detection');
            }

            // Detect facial expression using face-api.js (only if person detected)
            if (personDetected) {
                const expression = await detectExpression(video);
                console.log(`😊 Expression detected: ${expression}`);
                onExpressionChange(expression);
            } else {
                // No person detected - don't spam with 'unknown'
                onExpressionChange('unknown');
            }

        } catch (error) {
            console.error('Detection error:', error);
            onExpressionChange('unknown');
        }

        // Continue loop
        if (isMonitorEnabled && videoRef.current && videoRef.current.srcObject) {
            animationFrameRef.current = requestAnimationFrame(runDetection);
        }
    }, [videoRef, canvasRef, isMonitorEnabled, onExpressionChange, preprocessFrame, processYOLOOutput, drawPersonBoundingBox, detectExpression, MODEL_INPUT_SIZE]);

    /**
     * Initialize
     */
    const initialize = useCallback(async () => {
        if (isInitializedRef.current) {
            console.log('⚠️  Already initialized, skipping...');
            return;
        }

        console.log('='.repeat(60));
        console.log('🚀 Initializing Hybrid Engagement Monitor (YOLOv11 + face-api.js)...');
        console.log('='.repeat(60));
        isInitializedRef.current = true;

        // Check if libraries are available
        console.log('🔍 Checking libraries...');
        console.log('  - ONNX Runtime (ort):', typeof ort !== 'undefined' ? '✅ Available' : '❌ NOT Available');
        console.log('  - face-api.js:', typeof faceapi !== 'undefined' ? '✅ Available' : '❌ NOT Available');

        // Load models in parallel
        console.log('📦 Loading models...');
        await Promise.all([
            loadYOLOModel(),
            loadFaceApiModels()
        ]);

        console.log('📊 Models status:');
        console.log('  - YOLO:', yoloSessionRef.current ? '✅ Loaded' : '❌ Not loaded');
        console.log('  - face-api:', faceApiLoadedRef.current ? '✅ Loaded' : '❌ Not loaded');

        // Start webcam
        console.log('🎥 Starting webcam...');
        await startWebcam();
        console.log('⏳ Waiting for video to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check video state
        if (videoRef.current) {
            console.log('📹 Video element state:');
            console.log('  - readyState:', videoRef.current.readyState);
            console.log('  - videoWidth:', videoRef.current.videoWidth);
            console.log('  - videoHeight:', videoRef.current.videoHeight);
            console.log('  - srcObject:', !!videoRef.current.srcObject);
        }

        // Start detection
        console.log('🔄 Starting detection loop...');
        console.log('='.repeat(60));
        runDetection();
    }, [loadYOLOModel, loadFaceApiModels, startWebcam, runDetection]);

    /**
     * Main effect
     */
    useEffect(() => {
        if (isMonitorEnabled) {
            isInitializedRef.current = false;
            initialize();
        } else {
            stopWebcam();
            isInitializedRef.current = false;
        }

        return () => {
            stopWebcam();
            isInitializedRef.current = false;
        };
    }, [isMonitorEnabled, initialize, stopWebcam]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            console.log('Component unmounting, cleaning up...');
            stopWebcam();
        };
    }, [stopWebcam]);

    return {
        isInitialized: isInitializedRef.current,
        detectedObjects: Array.from(detectedObjectsRef.current)
    };
};

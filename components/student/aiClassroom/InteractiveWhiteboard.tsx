import React, { useContext, useRef, useState } from 'react';
import { AIClassroomContext } from '../../../contexts/AIClassroomContext';

interface InteractiveWhiteboardProps {
  lessonId: string;
}

const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({ lessonId }) => {
  const aiClassroom = useContext(AIClassroomContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'line' | 'rectangle'>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.toDataURL('image/png');
    aiClassroom?.addInteractiveElement({
      id: `interactive-${Date.now()}`,
      type: 'drawing',
      content: imageData,
      position: { x: 0, y: 0 }
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 border-b border-purple-700">
        <h2 className="text-lg font-bold">Interactive Whiteboard</h2>
        <p className="text-sm text-purple-100">Draw and collaborate with AI Teacher</p>
      </div>

      {/* Tools */}
      <div className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 p-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Tool Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                tool === 'pen'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
              title="Pen"
            >
              ✏️
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                tool === 'eraser'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
              title="Eraser"
            >
              🧹
            </button>
            <button
              onClick={clearCanvas}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              title="Clear"
            >
              🗑️
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-8 cursor-pointer"
            />
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{lineWidth}px</span>
          </div>

          {/* Save */}
          <button
            onClick={saveDrawing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair bg-white dark:bg-gray-900"
        />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-slate-800 border-t border-gray-300 dark:border-gray-700 p-3 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Draw your answers and solutions here for real-time feedback</p>
      </div>
    </div>
  );
};

export default InteractiveWhiteboard;

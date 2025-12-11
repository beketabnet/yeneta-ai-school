import React from 'react';
import { useImageGeneration } from '../contexts/ImageGenerationContext';
import { ImageGenerationMode, IMAGE_GENERATION_MODES } from '../types';

const ImageGenerationModeSelector: React.FC = () => {
    const { mode, setMode } = useImageGeneration();

    const handleModeChange = (newMode: ImageGenerationMode) => {
        setMode(newMode);
    };

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Image Mode:
            </span>
            <div className="flex gap-1">
                {Object.entries(IMAGE_GENERATION_MODES).map(([modeKey, config]) => {
                    const isSelected = mode === modeKey;
                    return (
                        <button
                            key={modeKey}
                            onClick={() => handleModeChange(modeKey as ImageGenerationMode)}
                            className={`
                                px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 border
                                ${isSelected 
                                    ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' 
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'
                                }
                            `}
                            title={config.description}
                        >
                            {config.shortLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ImageGenerationModeSelector;
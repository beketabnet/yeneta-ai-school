import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageGenerationMode } from '../types';

interface ImageGenerationContextType {
    mode: ImageGenerationMode;
    setMode: (mode: ImageGenerationMode) => void;
    webSearchEnabled: boolean;
    setWebSearchEnabled: (enabled: boolean) => void;
}

const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const useImageGeneration = () => {
    const context = useContext(ImageGenerationContext);
    if (context === undefined) {
        throw new Error('useImageGeneration must be used within an ImageGenerationProvider');
    }
    return context;
};

interface ImageGenerationProviderProps {
    children: ReactNode;
}

export const ImageGenerationProvider: React.FC<ImageGenerationProviderProps> = ({ children }) => {
    const [mode, setModeState] = useState<ImageGenerationMode>(() => {
        // Load from localStorage on initialization
        const saved = localStorage.getItem('imageGenerationMode');
        return (saved as ImageGenerationMode) || ImageGenerationMode.GOOGLE_AI_BILLING;
    });

    const [webSearchEnabled, setWebSearchEnabledState] = useState<boolean>(() => {
        // Load from localStorage on initialization
        const saved = localStorage.getItem('webSearchEnabled');
        return saved === 'true';
    });

    const setMode = (newMode: ImageGenerationMode) => {
        setModeState(newMode);
        localStorage.setItem('imageGenerationMode', newMode);
    };

    const setWebSearchEnabled = (enabled: boolean) => {
        setWebSearchEnabledState(enabled);
        localStorage.setItem('webSearchEnabled', String(enabled));
    };

    useEffect(() => {
        // Save to localStorage whenever mode changes
        localStorage.setItem('imageGenerationMode', mode);
    }, [mode]);

    useEffect(() => {
        // Save to localStorage whenever web search changes
        localStorage.setItem('webSearchEnabled', String(webSearchEnabled));
    }, [webSearchEnabled]);

    return (
        <ImageGenerationContext.Provider value={{ mode, setMode, webSearchEnabled, setWebSearchEnabled }}>
            {children}
        </ImageGenerationContext.Provider>
    );
};

export default ImageGenerationContext;

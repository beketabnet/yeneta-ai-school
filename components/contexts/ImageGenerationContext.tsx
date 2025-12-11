import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImageGenerationContextType {
    mode: string;
    setMode: (mode: string) => void;
    webSearchEnabled: boolean;
    setWebSearchEnabled: (enabled: boolean) => void;
}

const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const ImageGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<string>('standard');
    const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);

    return (
        <ImageGenerationContext.Provider value={{ mode, setMode, webSearchEnabled, setWebSearchEnabled }}>
            {children}
        </ImageGenerationContext.Provider>
    );
};

export const useImageGeneration = () => {
    const context = useContext(ImageGenerationContext);
    if (context === undefined) {
        throw new Error('useImageGeneration must be used within an ImageGenerationProvider');
    }
    return context;
};

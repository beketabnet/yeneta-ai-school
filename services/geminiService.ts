import { apiService } from './apiService';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { LessonPlan, LessonStep, ImageGenerationMode } from '../types';

// Initialize Google GenAI for client-side operations (Image/Video)
// We check multiple environment variable patterns to be safe
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY;
  }
  return process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ChatResponse {
  text: string;
  functionCalls?: { name: string; args: any }[];
}

export const getChatResponse = async (
  message: string,
  context: string,
  image?: { base64: string; mimeType: string },
  whiteboardJson?: any,
  whiteboardImage?: string,
  useRag: boolean = false,
  useWebSearch: boolean = false
): Promise<ChatResponse> => {
  try {
    const response = await apiService.chatWithTutor(
      message,
      context,
      image,
      whiteboardJson,
      whiteboardImage,
      useRag,
      useWebSearch
    );
    return {
      text: response.text,
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error("Error getting chat response:", error);
    return { text: "I'm sorry, I encountered an error while processing your request. Please try again." };
  }
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  topic: string,
  duration: string,
  stream?: string,
  useRag: boolean = false,
  region?: string,
  chapter?: string
): Promise<LessonPlan> => {
  // Use backend for robust lesson planning and RAG integration
  // We need to construct objectives or pass a generic one since frontend doesn't usually generate them explicitly before this step
  const objectives = `Understand the key concepts of ${topic} in ${subject}`;

  // Call apiService with the new signature supporting stream
  return await apiService.generateLessonPlan(
    topic,
    grade,
    objectives,
    useRag,
    subject,
    parseInt(duration) || 45,
    undefined, // moeStandardId
    undefined, // resourceConstraints
    undefined, // studentReadiness
    undefined, // localContext
    region,    // Pass region
    chapter,   // Pass chapter
    stream      // Pass the stream!
  );
};

export const regenerateStepContent = async (step: LessonStep, engagementLevel: string): Promise<string> => {
  const prompt = `Regenerate the following lesson step content to be more engaging for a student with ${engagementLevel} engagement level:\n\n${step.content}`;
  // Use backend for text generation to keep it consistent
  return await apiService.generateContent(prompt, JSON.stringify(step), 'content_generation');
};

export const getAdaptiveSuggestion = async (content: string, engagementLevel: string): Promise<string> => {
  const prompt = `Suggest a brief, alternative way to engage the student. This could be a fun fact, a quick question, or a different way to explain the concept. Student Engagement: ${engagementLevel}.\n\nContent: ${content}`;
  // Use backend
  return await apiService.generateContent(prompt, undefined, 'tutoring');
};

// --- Client-Side Image/Video Generation (Polyfill for missing backend features) ---

export const generateImage = async (prompt: string, mode: string = 'google-ai-billing'): Promise<string> => {
  // If Text Only, return empty or throw
  if (mode === 'text-only' || mode === 'text_only') {
    throw new Error("Image generation is disabled in Text-Only mode.");
  }

  // Try client-side generation first if API key exists and mode is Google AI
  if (mode === 'google-ai-billing' && ai) {
    try {
      console.log("Generating image client-side...");
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-001", // Updated to likely available model
        prompt: prompt,
        config: {
          aspectRatio: "1:1",
          outputOptions: {
            outputMimeType: "image/jpeg"
          }
        } as any
      });

      if ((response as any).images && (response as any).images.length > 0) {
        return `data:image/jpeg;base64,${(response as any).images[0].data || (response as any).images[0].imageBytes}`;
      }
    } catch (error: any) {
      console.warn("Client-side image generation failed, falling back to backend/placeholder:", error);
      if (error.message?.includes("billed users") || error.status === 400) {
        // Fallthrough to backend/placeholder
      }
    }
  }

  // Fallback to backend (which might just return a placeholder or handle it if implemented)
  // OR use the canvas placeholder logic from the copy if backend fails
  try {
    return await apiService.generateImage(prompt, mode);
  } catch (e) {
    // Final fallback: Canvas placeholder (inline implementation to avoid dependency issues)
    return generatePlaceholderImage(prompt);
  }
};

export const generateVideoUrl = async (prompt: string, mode: string = 'google-ai-billing'): Promise<string> => {
  if (mode === 'text-only' || mode === 'text_only') {
    throw new Error("Video generation is disabled in Text-Only mode.");
  }

  if (mode === 'google-ai-billing' && ai) {
    try {
      console.log("Generating video client-side...");
      const response = await ai.models.generateVideos({
        model: "veo-2.0-generate-001", // Updated model name guess
        prompt: prompt,
        config: {
          aspectRatio: "16:9",
          duration: "5s"
        } as any
      });

      const videoUri = (response as any).video?.uri || (response as any).uri;
      if (videoUri) {
        return videoUri;
      }
    } catch (error) {
      console.warn("Client-side video generation failed:", error);
    }
  }

  // Fallback to apiService
  return await apiService.generateVideoUrl(prompt, mode);
};


// Helper function to generate placeholder educational images (Canvas implementation)
const generatePlaceholderImage = async (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 400, 400);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);

      // Text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Concept Visualization', 200, 180);

      ctx.font = '16px Arial';
      const words = prompt.split(' ');
      let line = '';
      let y = 220;

      words.forEach((word, index) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 350 && index > 0) {
          ctx.fillText(line, 200, y);
          line = word + ' ';
          y += 25;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, 200, y);
    }
    resolve(canvas.toDataURL('image/jpeg', 0.8));
  });
};

export const geminiService = {
  getChatResponse,
  generateLessonPlan,
  regenerateStepContent,
  getAdaptiveSuggestion,
  generateImage,
  generateVideoUrl
};

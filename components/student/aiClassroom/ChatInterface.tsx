import React, { useContext, useState, useRef, useEffect } from 'react';
import { AIClassroomContext, ChatMessage } from '../../../contexts/AIClassroomContext';
import { LessonContent } from '../../../contexts/LessonContext';
import { aiTeacherService } from '../../../services/aiTeacherService';
import MarkdownRenderer from '../../common/MarkdownRenderer';

interface ChatInterfaceProps {
  lessonId: string;
  currentLesson: LessonContent;
  expanded?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ lessonId, currentLesson, expanded = false }) => {
  const aiClassroom = useContext(AIClassroomContext);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiClassroom?.chatHistory]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !aiClassroom || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'student',
      content: userInput,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    aiClassroom.addChatMessage(userMessage);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await aiTeacherService.generateTeacherResponse(
        userInput,
        currentLesson,
        aiClassroom.chatHistory
      );

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai-teacher',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
        type: aiResponse.type as any
      };

      aiClassroom.addChatMessage(aiMessage);

      if (aiResponse.type === 'feedback' || aiResponse.type === 'encouragement') {
        const engagementBoost = Math.min(100, (aiClassroom.classroomState.studentEngagement || 0) + 5);
        aiClassroom.updateClassroomState({ studentEngagement: engagementBoost });
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'ai-teacher',
        content: 'I encountered an issue. Could you please try again?',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      aiClassroom.addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-slate-800 ${expanded ? 'rounded-lg shadow-md' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 border-b border-green-700">
        <h2 className="text-lg font-bold">AI Teacher Chat</h2>
        <p className="text-sm text-green-100">Ask questions and interact with AI</p>
      </div>

      {/* Messages */}
      <div
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
      >
        {aiClassroom?.chatHistory && aiClassroom.chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Welcome to AI Classroom!</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Ask questions or share your thoughts to get started
            </p>
          </div>
        ) : (
          <>
            {aiClassroom?.chatHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${message.role === 'student'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                >
                  {message.type === 'text' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="text-sm prose dark:prose-invert prose-sm max-w-none">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or share your answer..."
            disabled={isLoading}
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed h-fit"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;

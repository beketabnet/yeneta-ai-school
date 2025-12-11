import React, { createContext, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import eventService from '../services/eventService';

const WebSocketContext = createContext<WebSocket | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

/**
 * WebSocketProvider - Manages real-time notifications
 * 
 * NOTE: Currently using event-driven architecture with HTTP polling (useAutoRefresh)
 * instead of WebSocket. This provides:
 * - Better compatibility across environments
 * - Simpler deployment without WebSocket infrastructure
 * - Reliable real-time updates via event service
 * 
 * WebSocket support can be added in the future if needed by:
 * 1. Adding Django Channels to the backend
 * 2. Configuring WebSocket routing
 * 3. Uncommenting the WebSocket connection code below
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Current implementation uses event service with HTTP polling
    // WebSocket connection is disabled to avoid 404 errors
    
    if (!user) {
      return;
    }

    // WebSocket connection disabled - using event service instead
    // Uncomment below to enable WebSocket when Django Channels is configured
    /*
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/notifications/`);

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification' && data.message && data.message.event) {
          console.log('[WebSocket] Received event:', data.message.event, data.message.data);
          eventService.emit(data.message.event, data.message.data);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    // Clean up the connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
    */
  }, [user]);

  return (
    <WebSocketContext.Provider value={null}>
      {children}
    </WebSocketContext.Provider>
  );
};

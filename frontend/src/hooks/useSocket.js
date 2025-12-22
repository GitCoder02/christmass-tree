import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (sessionId, userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      
      // Join the session
      if (sessionId && userId) {
        socket.emit('join-session', { sessionId, userId });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });
    
    // Session events
    socket.on('session-state', (state) => {
      console.log('📦 Received session state:', state);
      setSessionState(state);
      setActiveUsers(state.activeUsers);
    });
    
    socket.on('user-joined', ({ activeUsers }) => {
      console.log('👤 User joined');
      setActiveUsers(activeUsers);
    });
    
    socket.on('user-left', ({ activeUsers }) => {
      console.log('👋 User left');
      setActiveUsers(activeUsers);
    });
    
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
    
    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [sessionId, userId]);
  
  return {
    socket: socketRef.current,
    isConnected,
    sessionState,
    activeUsers
  };
};

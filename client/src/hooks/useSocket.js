import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export const useSocket = (onGameLive, onNotification) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io(SOCKET_URL, { auth: { token } });

    socketRef.current.on('game:live', (data) => onGameLive?.(data));
    socketRef.current.on('notification:new', (data) => onNotification?.(data));

    return () => socketRef.current?.disconnect();
  }, []);

  return socketRef;
};

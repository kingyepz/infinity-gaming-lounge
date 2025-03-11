import { useState, useEffect, useCallback } from 'react';

interface SessionUpdate {
  stationId: number;
  customerName: string;
  gameName: string;
  duration: number;
  cost: number;
  sessionType: 'per_game' | 'hourly';
}

export function useWebSocket() {
  const [sessionUpdates, setSessionUpdates] = useState<SessionUpdate[]>([]);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SESSION_UPDATE') {
          setSessionUpdates(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    sessionUpdates,
    connected
  };
}

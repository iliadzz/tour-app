import { useState, useEffect } from 'react';

type ConnectionStatus = 'Connecting' | 'Connected' | 'Disconnected';
interface Poi {
  id: string;
  name: string;
  audioUrl: string;
}

function App() {
  const [status, setStatus] = useState<ConnectionStatus>('Connecting');
  const [currentPoi, setCurrentPoi] = useState<Poi | null>(null);

  useEffect(() => {
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket('ws://localhost:3001');
      setStatus('Connecting');

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('Connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        if (message.type === 'POI_TRIGGER' && message.poi) {
          const poi: Poi = message.poi;
          setCurrentPoi(poi); // Update the UI with the new POI
          const audio = new Audio(poi.audioUrl);
          audio.play();
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setStatus('Disconnected');
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (ws) {
        ws.onclose = () => {};
        ws.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'Connected': return 'text-green-500';
      case 'Disconnected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };
  
  return (
    <div className="bg-gray-800 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Guided Tour App</h1>
        <p className={`mt-2 text-lg font-semibold ${getStatusColor()}`}>
          Status: {status}
        </p>
        
        <div className="mt-12 h-24">
          {currentPoi ? (
            <div>
              <h2 className="text-2xl">Now Playing:</h2>
              <p className="text-3xl font-bold text-cyan-400">{currentPoi.name}</p>
            </div>
          ) : (
            <p className="text-xl italic text-gray-400">Waiting for next Point of Interest...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
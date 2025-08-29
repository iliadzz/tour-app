// client/src/AdminPanel.tsx
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export function AdminPanel() {
  const [isTourActive, setIsTourActive] = useState(false);
  const [playedPois, setPlayedPois] = useState<string[]>([]);

  const fetchTourState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tour/state`);
      const data = await response.json();
      setIsTourActive(data.isTourActive);
      setPlayedPois(data.playedPoiIds);
    } catch (error) {
      console.error('Failed to fetch tour state:', error);
    }
  };

  useEffect(() => {
    fetchTourState();
    const interval = setInterval(fetchTourState, 5000); // Poll for updates every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartTour = async () => {
    await fetch(`${API_BASE_URL}/api/tour/start`, { method: 'POST' });
    fetchTourState();
  };

  const handleEndTour = async () => {
    await fetch(`${API_BASE_URL}/api/tour/end`, { method: 'POST' });
    fetchTourState();
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 w-64">
      <h3 className="text-xl font-bold text-center mb-4">Driver Controls</h3>
      <div className="flex justify-around mb-4">
        <button
          onClick={handleStartTour}
          disabled={isTourActive}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded"
        >
          Start Tour
        </button>
        <button
          onClick={handleEndTour}
          disabled={!isTourActive}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded"
        >
          End Tour
        </button>
      </div>
      <div>
        <h4 className="font-semibold">Played POIs: {playedPois.length}</h4>
        <ul className="text-sm text-gray-400 h-24 overflow-y-auto">
          {playedPois.map(id => <li key={id}>{id}</li>)}
        </ul>
      </div>
    </div>
  );
}
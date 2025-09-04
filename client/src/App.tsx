// client/src/App.tsx
import { useState, useEffect } from 'react';
import { AdminPanel } from './AdminPanel';
import { MainTab } from './MainTab';
import { SettingsTab } from './SettingsTab';
import { Poi, Language, ConnectionStatus } from './types';
import { Home, Settings } from 'lucide-react';

function App() {
  const [status, setStatus] = useState<ConnectionStatus>('Connecting');
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  
  // Tour State
  const [currentPoi, setCurrentPoi] = useState<Poi | null>(null);
  const [poiHistory, setPoiHistory] = useState<Poi[]>([]);
  const [queuedPoi, setQueuedPoi] = useState<Poi | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  // Settings State
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket('ws://localhost:3001');
      setStatus('Connecting');

      ws.onopen = () => setStatus('Connected');
      ws.onclose = () => {
        setStatus('Disconnected');
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // We can accept both POI and Ad triggers here since they share a structure
        if ((message.type === 'POI_TRIGGER' || message.type === 'AD_TRIGGER') && message.poi) {
          const newContent: Poi = message.poi;
          
          if (isReplaying) {
            setQueuedPoi(newContent);
          } else {
            setCurrentPoi(newContent);
            // Only add actual POIs to the replay history, not ads
            if (message.type === 'POI_TRIGGER') {
              setPoiHistory(prev => [...prev, newContent]);
            }
          }
        }
      };
    }

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [isReplaying]);

  const handleReplayLast = () => {
    if (poiHistory.length > 0) {
      const lastPoi = poiHistory[poiHistory.length - 1];
      setIsReplaying(true);

      // ** THE FIX IS HERE **
      // 1. Set current POI to null to force the AudioPlayer to unmount.
      setCurrentPoi(null);

      // 2. Use a short timeout to set it back in the next render cycle.
      // This guarantees that React sees it as a new update and remounts the player.
      setTimeout(() => {
        setCurrentPoi(lastPoi);
      }, 50);
    }
  };

  const handleAudioEnded = () => {
    if (isReplaying) {
      setIsReplaying(false);
      if (queuedPoi) {
        setCurrentPoi(queuedPoi);
        if (!queuedPoi.id.startsWith('ad-')) {
          setPoiHistory(prev => [...prev, queuedPoi]);
        }
        setQueuedPoi(null);
      } else {
        setCurrentPoi(null);
      }
    } else {
      setCurrentPoi(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col">
        {activeTab === 'main' ? (
          <MainTab 
            currentPoi={currentPoi}
            poiHistory={poiHistory}
            language={language}
            onReplayLast={handleReplayLast}
            onAudioEnded={handleAudioEnded}
          />
        ) : (
          <SettingsTab 
            language={language}
            onLanguageChange={setLanguage}
            connectionStatus={status}
          />
        )}
      </main>

      {/* Tab Navigation */}
      <footer className="w-full bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
        <nav className="flex justify-around p-2">
          <button 
            onClick={() => setActiveTab('main')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-md ${activeTab === 'main' ? 'text-cyan-400' : 'text-slate-400'}`}
          >
            <Home size={28}/>
            <span className="text-xs">Tour</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-md ${activeTab === 'settings' ? 'text-cyan-400' : 'text-slate-400'}`}
          >
            <Settings size={28}/>
            <span className="text-xs">Settings</span>
          </button>
        </nav>
      </footer>

      {/* Admin panel is always visible for the driver */}
      <AdminPanel />
    </div>
  );
}

export default App;

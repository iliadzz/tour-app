// client/src/SettingsTab.tsx
import { Language } from './types';

interface SettingsTabProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  connectionStatus: string;
}

export function SettingsTab({ language, onLanguageChange, connectionStatus }: SettingsTabProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return 'text-green-500';
      case 'Disconnected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="p-8 text-white">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Language</h3>
          <div className="flex space-x-4">
            <button 
              onClick={() => onLanguageChange('en')}
              className={`px-4 py-2 rounded-md ${language === 'en' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700'}`}
            >
              English
            </button>
            <button 
              onClick={() => onLanguageChange('es')}
              className={`px-4 py-2 rounded-md ${language === 'es' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700'}`}
            >
              Español
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Connection</h3>
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            Status: {connectionStatus}
          </p>
        </div>
      </div>
    </div>
  );
}

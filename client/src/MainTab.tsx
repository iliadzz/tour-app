// client/src/MainTab.tsx
import { Poi, Language } from './types';
import { AudioPlayer } from './AudioPlayer';

interface MainTabProps {
  currentPoi: Poi | null;
  poiHistory: Poi[];
  language: Language;
  onReplayLast: () => void;
  onAudioEnded: () => void;
}

export function MainTab({ currentPoi, poiHistory, language, onReplayLast, onAudioEnded }: MainTabProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-4 md:p-8">
      {/* Top Section: POI Info */}
      <div className="text-center w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          {currentPoi ? currentPoi.name : "Guided Tour"}
        </h1>
        <p className="text-lg md:text-xl text-slate-300">
          {currentPoi ? currentPoi.description[language] : "Waiting for the next Point of Interest..."}
        </p>
      </div>

      {/* Middle Section: Image/Video */}
      <div className="flex-grow w-full max-w-2xl my-6 flex items-center justify-center">
        {currentPoi ? (
          <img 
            src={currentPoi.image} 
            alt={currentPoi.name} 
            className="rounded-lg shadow-2xl object-cover w-full h-full max-h-[50vh]"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/334155/E2E8F0?text=Image+Not+Found'; }}
          />
        ) : (
          <div className="w-full h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <p className="text-slate-400">Visuals will appear here</p>
          </div>
        )}
      </div>

      {/* Bottom Section: Controls */}
      <div className="w-full flex flex-col items-center space-y-4">
        {currentPoi && (
          <AudioPlayer 
            key={currentPoi.id} // Key ensures component re-mounts on POI change
            audioUrl={currentPoi.audio[language]} 
            onEnded={onAudioEnded}
          />
        )}
        <button
          onClick={onReplayLast}
          disabled={poiHistory.length === 0}
          className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Replay Last POI
        </button>
      </div>
    </div>
  );
}

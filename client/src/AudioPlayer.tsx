// client/src/AudioPlayer.tsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Rewind, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  onEnded: () => void;
}

export function AudioPlayer({ audioUrl, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset and play when the audio URL changes
    setProgress(0);
    setIsPlaying(true);
    audio.play().catch(e => console.error("Audio play failed:", e));

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
        audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
        setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };


  return (
    <div className="w-full max-w-md p-4 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700">
      <audio ref={audioRef} src={audioUrl} muted={isMuted} />
      <div className="flex items-center space-x-4">
        <button onClick={handleReplay} className="text-slate-300 hover:text-white transition-colors">
          <Rewind size={24} />
        </button>
        <button onClick={togglePlay} className="p-3 bg-cyan-500 rounded-full text-slate-900 hover:bg-cyan-400 transition-colors">
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <div className="flex-1 flex items-center space-x-3">
            <span className="text-xs text-slate-400 w-10 text-right">{formatTime(progress)}</span>
            <input
                type="range"
                min="0"
                max={duration || 1}
                value={progress}
                onChange={(e) => audioRef.current && (audioRef.current.currentTime = Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer"
                style={{backgroundSize: `${(progress / duration) * 100}% 100%`}}
            />
            <span className="text-xs text-slate-400 w-10">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center space-x-2 w-32">
            <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
}

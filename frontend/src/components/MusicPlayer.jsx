import { useState, useRef, useEffect } from 'react';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);
  
  useEffect(() => {
    // You can add a Christmas music URL here or use a local file
    // For now, we'll use a placeholder
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(err => console.log('Audio play error:', err));
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-christmas-red/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg z-40 flex items-center gap-3">
      <button
        onClick={togglePlay}
        className="text-white text-2xl hover:scale-110 transition-transform"
        title={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 accent-christmas-gold"
      />
      
      <span className="text-white text-sm">🎵</span>
    </div>
  );
};

export default MusicPlayer;

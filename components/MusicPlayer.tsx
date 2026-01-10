import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useYoutube, PlayerState as YTState } from "react-youtube-music-player";
import { usePlayerStore } from "../store";

// Helper to get high-res thumbnail
const getThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

export default function MusicPlayer() {
  // 1. CONNECT TO THE GLOBAL STORE
  // Instead of local useState, we get the live data from the store
  const { 
    queue, 
    currentIndex, 
    isPlaying: globalIsPlaying, 
    setIsPlaying, 
    nextTrack, 
    prevTrack, 
    setIndex 
  } = usePlayerStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  
  // This ref prevents infinite play/pause loops
  const shouldAutoPlay = useRef(false);

  // Get the current track from the store's queue
  const currentTrack = queue[currentIndex];

  // 2. SETUP YOUTUBE HOOK
  const { playerDetails, actions } = useYoutube({
    id: currentTrack.videoId,
    type: "video",
    playerVars: { 
      controls: 0,
      autoplay: 1, 
    },
  } as any); 

  // --- SYNC LOGIC ---

  // Reset time when track changes
  useEffect(() => { 
    setCurrentTime(0); 
  }, [currentIndex]);

  // Sync YouTube State -> Global Store
  // This ensures if the video ends naturally, the store knows to move to the next song
  useEffect(() => {
    if (playerDetails.state === YTState.PLAYING) {
      setIsPlaying(true);
    } else if (playerDetails.state === YTState.PAUSED) {
      setIsPlaying(false);
    } else if (playerDetails.state === YTState.ENDED) {
      nextTrack();
      shouldAutoPlay.current = true;
    }
  }, [playerDetails.state, setIsPlaying, nextTrack]);

  // Handle "AutoPlay" intent when changing tracks
  useEffect(() => {
    if (shouldAutoPlay.current) {
        if (playerDetails.state === YTState.CUED || playerDetails.state === YTState.PAUSED || playerDetails.state === YTState.UNSTARTED) {
            actions.playVideo();
        }
    }
  }, [currentIndex, playerDetails.state, actions]);

  // Handle Play/Pause button clicks
  const togglePlay = () => {
    shouldAutoPlay.current = !globalIsPlaying;
    if (globalIsPlaying) {
        actions.pauseVideo();
    } else {
        actions.playVideo();
    }
  };

  // Progress Bar ticker
  useEffect(() => {
    if (!globalIsPlaying) return;
    const interval = setInterval(() => { setCurrentTime((t) => t + 0.5); }, 500);
    return () => clearInterval(interval);
  }, [globalIsPlaying]);

  // Sync seek bar with actual YouTube time occasionally
  useEffect(() => {
    if (!isNaN(playerDetails.currentTime) && playerDetails.currentTime > 0) {
      if (Math.abs(currentTime - playerDetails.currentTime) > 2) {
        setCurrentTime(playerDetails.currentTime);
      }
    }
  }, [playerDetails.currentTime]);

  const seek = (value: number) => {
    setCurrentTime(value);
    actions.seekTo(value, true);
  };

  const handleNext = () => {
    shouldAutoPlay.current = true;
    nextTrack();
  };

  const handlePrev = () => {
    shouldAutoPlay.current = true;
    prevTrack();
  };

  const jumpToTrack = (idx: number) => {
    shouldAutoPlay.current = true;
    setIndex(idx);
    setShowQueue(false);
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      
      {/* --- DROP UP PLAYLIST MENU --- */}
      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-[105%] left-0 w-[380px] max-h-[400px] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-0 no-scrollbar"
          >
             <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Queue</h3>
                <span className="text-xs text-white/50">{queue.length} Tracks</span>
             </div>
             
             <div className="space-y-2">
                {queue.map((track, i) => (
                    <button 
                        key={i + track.videoId}
                        onClick={() => jumpToTrack(i)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition group text-left ${
                            i === currentIndex ? 'bg-white/20' : 'hover:bg-white/10'
                        }`}
                    >
                        <img 
                            src={getThumbnail(track.videoId)} 
                            className="w-10 h-10 rounded object-cover opacity-80 group-hover:opacity-100 transition" 
                            alt="" 
                        />
                        
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${i === currentIndex ? 'text-white' : 'text-white/80'}`}>
                                {track.title}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                                {track.artist}
                            </p>
                        </div>

                        {i === currentIndex && (
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        )}
                    </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- MAIN PLAYER CARD --- */}
      <div className="relative w-[380px] h-[180px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group z-10 bg-black">
        
        {/* DYNAMIC BACKGROUND LAYER */}
        <AnimatePresence mode="popLayout">
            <motion.div 
                key={currentTrack.videoId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 z-0"
            >
                <div 
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-60 scale-150"
                    style={{ backgroundImage: `url(${getThumbnail(currentTrack.videoId)})` }}
                />
                <div className="absolute inset-0 bg-black/40" />
            </motion.div>
        </AnimatePresence>

        {/* CONTENT LAYER */}
        <div className="relative z-10 h-full p-5 flex flex-col justify-between bg-black/20 backdrop-blur-sm">
            
            {/* Top Section */}
            <div className="flex items-center gap-4">
                <motion.div 
                    key={currentTrack.videoId + "art"}
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border border-white/10 shrink-0"
                >
                    <img src={getThumbnail(currentTrack.videoId)} alt="Art" className="w-full h-full object-cover"/>
                </motion.div>

                <div className="min-w-0 flex-1">
                    <motion.h3 
                        key={currentTrack.title}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-bold text-white text-lg truncate leading-tight tracking-wide"
                    >
                        {currentTrack.title}
                    </motion.h3>
                    <motion.p 
                        key={currentTrack.artist}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/70 text-xs font-medium uppercase tracking-wider mt-1 truncate"
                    >
                        {currentTrack.artist}
                    </motion.p>
                </div>

                <button 
                    onClick={() => setShowQueue(!showQueue)}
                    className={`p-2 rounded-full transition ${showQueue ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Bottom Section */}
            <div className="space-y-4">
                <div className="relative h-1 w-full bg-white/20 rounded-full overflow-hidden group/bar">
                    <div className="absolute top-0 left-0 h-full w-full bg-white/10" />
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-white/90 rounded-full"
                        style={{ width: `${(currentTime / (playerDetails.duration || 100)) * 100}%` }}
                        layoutId="progressBar"
                    />
                    <input
                        type="range"
                        min={0}
                        max={playerDetails.duration || 100}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                </div>

                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono opacity-60 min-w-[35px]">{format(currentTime)}</span>
                    
                    <div className="flex items-center gap-8">
                        <button onClick={handlePrev} className="opacity-70 hover:opacity-100 hover:scale-110 transition">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                            </svg>
                        </button>
                        
                        <button 
                            onClick={togglePlay} 
                            className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition"
                        >
                            {globalIsPlaying ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                            )}
                        </button>
                        
                        <button onClick={handleNext} className="opacity-70 hover:opacity-100 hover:scale-110 transition">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                            </svg>
                        </button>
                    </div>

                    <span className="text-[10px] font-mono opacity-60 min-w-[35px] text-right">{format(playerDetails.duration)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function format(seconds = 0) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
import React, { useEffect, useState } from 'react';
import { useProductivityStore, useUIStore } from '../store';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, Settings, X, Check, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PomodoroTimer: React.FC = () => {
  const { currentTheme } = useUIStore();
  const { 
    timerMode, timeLeft, timerActive, 
    setTimerMode, toggleTimer, resetTimer, tick, setTime 
  } = useProductivityStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [customTimes, setCustomTimes] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  });

  useEffect(() => {
    let interval: number;

    if (timerActive && timeLeft > 0) {
      interval = window.setInterval(tick, 1000);
    } else if (timeLeft === 0 && timerActive) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-bell-notification-921.mp3');
      audio.play().catch(e => console.log('Audio blocked', e));
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [timerActive, timeLeft, tick]);

  const handleTimerComplete = () => {
    let nextMode = 'focus';
    if (timerMode === 'focus') {
      nextMode = 'shortBreak';
    } else {
      nextMode = 'focus';
    }
    switchMode(nextMode as any);
    if (autoStart) {
       setTimeout(toggleTimer, 100);
    }
  };

  const switchMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setTimerMode(mode);
    setTime(customTimes[mode] * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalTime = customTimes[timerMode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.8)';
  const textColor = currentTheme?.colors?.text || '#fff';
  const accentColor = currentTheme?.colors?.accent || '#3b82f6';

  return (
    // --- UPDATED ANIMATION PROPS ---
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }} // Subtle start
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}    // Mirror exit
      transition={{ duration: 0.2, ease: "easeInOut" }} // Much faster (0.2s)
      className="relative w-full max-w-sm mx-auto perspective-1000"
    >
      <motion.div
        animate={{ rotateY: isSettingsOpen ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* === FRONT FACE: TIMER === */}
        <div 
           className="backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 backface-hidden"
           style={{ backgroundColor: cardColor, color: textColor }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
             <div className="flex space-x-1 bg-black/20 p-1 rounded-full">
                {['focus', 'shortBreak', 'longBreak'].map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m as any)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      timerMode === m ? 'bg-white/20 text-white shadow-sm' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    {m === 'shortBreak' ? 'Short' : m === 'longBreak' ? 'Long' : 'Focus'}
                  </button>
                ))}
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition">
                <Settings size={18} className="opacity-70" />
             </button>
          </div>

          {/* Timer Circle */}
          <div className="relative flex items-center justify-center mb-8">
            <svg className="transform -rotate-90 w-64 h-64 drop-shadow-2xl">
              <circle cx="128" cy="128" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/20" />
              <circle
                cx="128" cy="128" r={radius} stroke={accentColor} strokeWidth="6" fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <div className="text-5xl font-mono font-bold tracking-tighter mb-1 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs font-bold opacity-60 flex items-center gap-1 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                {timerMode === 'focus' ? <Brain size={12} /> : timerMode === 'shortBreak' ? <Coffee size={12} /> : <Zap size={12} />}
                <span>{timerMode === 'focus' ? 'Focusing' : 'Resting'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-6">
            <button 
               onClick={toggleTimer}
               className="h-16 w-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition shadow-lg shadow-white/10"
            >
              {timerActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button 
               onClick={() => switchMode(timerMode)} 
               className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* === BACK FACE: SETTINGS === */}
        <div 
           className="absolute inset-0 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 backface-hidden"
           style={{ 
             backgroundColor: cardColor, 
             color: textColor,
             transform: "rotateY(180deg)" 
           }}
        >
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Timer Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                 <X size={20} />
              </button>
           </div>

           <div className="space-y-5">
              <div className="space-y-3">
                 {[
                   { id: 'focus', label: 'Focus Duration' },
                   { id: 'shortBreak', label: 'Short Break' },
                   { id: 'longBreak', label: 'Long Break' }
                 ].map((item) => (
                   <div key={item.id} className="flex justify-between items-center">
                      <label className="text-sm opacity-80">{item.label}</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           value={customTimes[item.id as keyof typeof customTimes]}
                           onChange={(e) => setCustomTimes({...customTimes, [item.id]: Number(e.target.value)})}
                           className="w-16 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                         />
                         <span className="text-xs opacity-50">min</span>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                       <Volume2 size={16} />
                       <span className="text-sm">Auto-start next timer</span>
                    </div>
                    <button 
                      onClick={() => setAutoStart(!autoStart)}
                      className={`w-10 h-6 rounded-full p-1 transition-colors ${autoStart ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                       <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoStart ? 'translate-x-4' : ''}`} />
                    </button>
                 </div>
              </div>
           </div>

           <button 
             onClick={() => {
                setIsSettingsOpen(false);
                switchMode(timerMode);
             }}
             className="w-full mt-6 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition"
           >
              <Check size={18} /> Save Changes
           </button>
        </div>
      </motion.div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </motion.div>
  );
};

export default PomodoroTimer;
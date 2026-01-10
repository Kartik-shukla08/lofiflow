import React, { useEffect } from 'react';
import { useProductivityStore, useUIStore } from '../store';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap } from 'lucide-react';
import { TIMER_PRESETS } from '../constants';
import { motion } from 'framer-motion';

const PomodoroTimer: React.FC = () => {
  const { currentTheme } = useUIStore();
  const { 
    timerMode, timeLeft, timerActive, 
    setTimerMode, toggleTimer, resetTimer, tick 
  } = useProductivityStore();

  useEffect(() => {
    let interval: number;
    if (timerActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        tick();
      }, 1000);
    } else if (timeLeft === 0) {
      // Play sound notification here if desired
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
      audio.play().catch(() => {});
      resetTimer();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, tick, resetTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalTime = TIMER_PRESETS[timerMode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.8)';
  const textColor = currentTheme?.colors?.text || '#fff';
  const accentColor = currentTheme?.colors?.accent || '#3b82f6';

  return (
    <motion.div<HTMLDivElement>
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 w-full max-w-sm mx-auto"
      style={{ backgroundColor: cardColor, color: textColor }}
    >
      <div className="flex justify-center space-x-2 mb-8 bg-black/20 p-1 rounded-full">
        <button 
          onClick={() => setTimerMode('focus')} 
          className={`flex-1 py-1 px-3 rounded-full text-xs font-medium transition ${timerMode === 'focus' ? 'bg-white/20 text-white' : 'opacity-60 hover:opacity-100'}`}
        >
          Focus
        </button>
        <button 
          onClick={() => setTimerMode('shortBreak')} 
          className={`flex-1 py-1 px-3 rounded-full text-xs font-medium transition ${timerMode === 'shortBreak' ? 'bg-white/20 text-white' : 'opacity-60 hover:opacity-100'}`}
        >
          Short
        </button>
        <button 
          onClick={() => setTimerMode('longBreak')} 
          className={`flex-1 py-1 px-3 rounded-full text-xs font-medium transition ${timerMode === 'longBreak' ? 'bg-white/20 text-white' : 'opacity-60 hover:opacity-100'}`}
        >
          Long
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        {/* SVG Circle */}
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/10"
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke={accentColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute text-center">
            <div className="text-5xl font-mono font-bold tracking-tighter mb-2">
                {formatTime(timeLeft)}
            </div>
            <div className="text-sm opacity-60 flex items-center justify-center gap-1 uppercase tracking-widest">
                {timerMode === 'focus' ? <Brain size={14} /> : timerMode === 'shortBreak' ? <Coffee size={14} /> : <Zap size={14} />}
                <span>{timerMode === 'focus' ? 'Focusing' : 'Resting'}</span>
            </div>
        </div>
      </div>

      <div className="flex justify-center space-x-6">
        <button 
          onClick={toggleTimer}
          className="p-4 rounded-full bg-white text-black hover:scale-110 transition shadow-lg active:scale-95"
        >
          {timerActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button 
          onClick={resetTimer}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;
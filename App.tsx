import React, { useState } from 'react';
import { useUIStore } from './store';
import MusicPlayer from './components/MusicPlayer';
import PomodoroTimer from './components/PomodoroTimer';
import TodoList from './components/TodoList';
import ChatRoom from './components/ChatRoom';
import MusicSearch from './components/MusicSearch';
import { 
  LayoutGrid, CheckSquare, MessageCircle, Search,
  Maximize2, Minimize2, Palette, Image as ImageIcon, PlusCircle
} from 'lucide-react';
import { THEMES, BACKGROUNDS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const { 
    currentTheme, backgroundUrl, backgroundType, activePanels, 
    setTheme, setBackground, togglePanel 
  } = useUIStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500" style={{ backgroundColor: currentTheme.colors.bg, color: currentTheme.colors.text }}>
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {backgroundType === 'video' ? (
          <video 
            src={backgroundUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
          />
        ) : (
          <img 
            src={backgroundUrl} 
            alt="background" 
            className="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Main Content Area - Grid System */}
      <div className="relative z-10 h-screen flex flex-col p-4 md:p-8">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight text-white/90 drop-shadow-md">Lofi Flow</h1>
                <p className="text-sm text-white/60 font-mono mt-1">Focus • Relax • Study</p>
            </div>

            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-1.5 rounded-full border border-white/5">
                 <button onClick={() => setShowThemeSelector(!showThemeSelector)} className="p-2 hover:bg-white/10 rounded-full transition text-white/80" title="Customize">
                    <Palette size={20} />
                 </button>
                 <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition text-white/80" title="Fullscreen">
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                 </button>
            </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Center Stage: Timer (Always visible if active, or just central placeholder) */}
            <div className="lg:col-span-4 lg:col-start-5 flex flex-col justify-center items-center">
                 {activePanels.timer && <PomodoroTimer />}
            </div>

            {/* Right Panel: Chat, Todo, or Search */}
            <AnimatePresence>
                {(activePanels.chat || activePanels.todo || activePanels.search) && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="lg:col-span-3 lg:col-start-10 flex flex-col gap-4 h-[calc(100vh-160px)]"
                    >
                         {activePanels.todo && <div className="flex-1 min-h-0"><TodoList /></div>}
                         {activePanels.chat && <div className="flex-1 min-h-0"><ChatRoom /></div>}
                         {activePanels.search && <div className="flex-1 min-h-0"><MusicSearch /></div>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Bottom Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <DockButton 
                active={activePanels.timer} 
                onClick={() => togglePanel('timer')} 
                icon={<LayoutGrid size={22} />} 
                tooltip="Timer"
            />
            <DockButton 
                active={activePanels.todo} 
                onClick={() => togglePanel('todo')} 
                icon={<CheckSquare size={22} />} 
                tooltip="Tasks"
            />
            <div className="w-px h-8 bg-white/10 mx-1" />
            <DockButton 
                active={activePanels.chat} 
                onClick={() => togglePanel('chat')} 
                icon={<MessageCircle size={22} />} 
                tooltip="Chat"
            />
             <DockButton 
                active={activePanels.search} 
                onClick={() => togglePanel('search')} 
                icon={<PlusCircle size={22} />} 
                tooltip="Add Music"
            />
            <div className="w-px h-8 bg-white/10 mx-1" />
             <DockButton 
                active={false}
                onClick={() => setShowThemeSelector(true)} 
                icon={<ImageIcon size={22} />} 
                tooltip="Ambience"
            />
        </div>
      </div>

      {/* Music Player Widget (Fixed Position) */}
      <AnimatePresence>
        {activePanels.music && <MusicPlayer />}
      </AnimatePresence>

      {/* Theme/Background Drawer */}
      <AnimatePresence>
        {showThemeSelector && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowThemeSelector(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                />
                <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-80 shadow-2xl z-50 border-l border-white/10 p-6 overflow-y-auto"
                    style={{ backgroundColor: currentTheme.colors.card }}
                >
                    <h2 className="text-xl font-bold mb-6">Customization</h2>
                    
                    <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase opacity-50 mb-4 tracking-wider">Theme</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`p-3 rounded-lg border text-sm text-left transition ${currentTheme.id === t.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <div className="w-full h-8 rounded mb-2" style={{ background: t.colors.bg }}></div>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase opacity-50 mb-4 tracking-wider">Background</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {BACKGROUNDS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBackground(bg.url, bg.type as 'image'|'video')}
                                    className={`relative aspect-video rounded-lg overflow-hidden border transition ${backgroundUrl === bg.url ? 'border-white ring-2 ring-white/50' : 'border-transparent hover:scale-105'}`}
                                >
                                    <img src={bg.thumb} alt={bg.id} className="w-full h-full object-cover" />
                                    {bg.type === 'video' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-md"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
};

const DockButton = ({ active, onClick, icon, tooltip }: any) => (
    <button 
        onClick={onClick}
        className={`p-3 rounded-xl transition-all duration-300 relative group ${active ? 'bg-white text-black shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}
    >
        {icon}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap text-white pointer-events-none">
            {tooltip}
        </span>
    </button>
);

export default App;
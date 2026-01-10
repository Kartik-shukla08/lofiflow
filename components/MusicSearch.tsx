import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store'; // Assuming you have this
import { usePlayerStore } from '../store'; // The store we just made
import { Play, Plus, Link as LinkIcon, Youtube, CheckCircle } from 'lucide-react';
import { extractVideoId } from '../constants';

const MusicSearch: React.FC = () => {
  const { currentTheme } = useUIStore();
  const { playTrack, addToQueue } = usePlayerStore();
  
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.8)';
  const textColor = currentTheme?.colors?.text || '#fff';

  // Auto-generate preview when URL changes
  useEffect(() => {
    const id = extractVideoId(url);
    if (id) {
        setPreviewId(id);
        setError('');
    } else {
        setPreviewId(null);
    }
  }, [url]);

  const handleAction = (action: 'play' | 'queue') => {
    setError('');
    setSuccessMsg('');
    
    if (!url.trim() || !previewId) {
        setError('Please enter a valid YouTube URL');
        return;
    }

    const trackTitle = title.trim() || 'Custom Track';
    const track = {
        title: trackTitle,
        url: url.trim(),
        channel: 'User Added'
    };

    if (action === 'play') {
        playTrack(track);
        setSuccessMsg('Playing now...');
    } else {
        addToQueue(track);
        setSuccessMsg('Added to queue!');
    }

    // Clear form after delay
    setTimeout(() => {
        setUrl('');
        setTitle('');
        setPreviewId(null);
        setSuccessMsg('');
    }, 1500);
  };

  return (
    <div 
        className="h-full w-full flex flex-col rounded-2xl overflow-hidden backdrop-blur-md border border-white/10"
        style={{ backgroundColor: cardColor, color: textColor }}
    >
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <Youtube className="text-red-500" size={20} />
            <h2 className="text-lg font-semibold">Add Music</h2>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
            
            {/* --- INPUT SECTION --- */}
            <div className="space-y-4">
                <div>
                    <label className="text-xs uppercase font-bold opacity-60 mb-2 block">YouTube URL</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste link here..."
                            className="w-full bg-white/10 border-none rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-white/30 placeholder-white/30 transition-all"
                        />
                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    </div>
                </div>

                <div>
                    <label className="text-xs uppercase font-bold opacity-60 mb-2 block">Track Title (Optional)</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. My Study Jam"
                        className="w-full bg-white/10 border-none rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-white/30 placeholder-white/30"
                    />
                </div>
            </div>

            {/* --- PREVIEW SECTION (New!) --- */}
            {previewId && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 shadow-lg group">
                    <img 
                        src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Play size={16} fill="white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs truncate">
                        Detected Video ID: {previewId}
                    </div>
                </div>
            )}

            {/* --- FEEDBACK MESSAGES --- */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}
            
            {successMsg && (
                 <div className="bg-green-500/10 border border-green-500/20 text-green-200 text-xs p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle size={14} /> {successMsg}
                </div>
            )}

            {/* --- BUTTONS --- */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                    onClick={() => handleAction('queue')}
                    disabled={!previewId}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl transition font-medium text-sm"
                >
                    <Plus size={18} />
                    Queue
                </button>
                <button 
                    onClick={() => handleAction('play')}
                    disabled={!previewId}
                    className="flex items-center justify-center gap-2 bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 py-3 rounded-xl transition font-bold text-sm shadow-lg"
                >
                    <Play size={18} fill="currentColor" />
                    Play
                </button>
            </div>
        </div>
    </div>
  );
};

export default MusicSearch;
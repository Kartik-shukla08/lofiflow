import React, { useState } from 'react';
import { useUIStore } from '../store';
import { usePlayerStore } from '../store';
import { Play, Plus, Search, Loader2, Music, AlertCircle, ServerCrash } from 'lucide-react';
import { extractVideoId, API_PROVIDERS } from '../constants';

interface APIVideo {
  title: string;
  author: string;
  videoId: string;
  videoThumbnails?: { url: string; width: number }[];
}

const MusicSearch: React.FC = () => {
  const { currentTheme } = useUIStore();
  const { playTrack, addToQueue } = usePlayerStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<APIVideo[]>([]);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');

  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.8)';
  const textColor = currentTheme?.colors?.text || '#fff';

  // --- 1. ROBUST FETCHING LOGIC ---
  const fetchFromProviders = async (endpoint: string) => {
    for (const provider of API_PROVIDERS) {
      try {
        console.log(`Trying provider: ${provider}...`);
        const res = await fetch(`${provider}${endpoint}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setCurrentProvider(provider);
        return data;
      } catch (err) {
        console.warn(`Provider ${provider} failed, trying next...`);
      }
    }
    throw new Error('All providers failed');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setCurrentProvider('');

    const directId = extractVideoId(query);
    
    try {
      if (directId) {
        // CASE A: Direct Link
        const data = await fetchFromProviders(`/videos/${directId}`);
        setSearchResults([{
          title: data.title,
          author: data.author,
          videoId: data.videoId,
          videoThumbnails: data.videoThumbnails
        }]);
      } else {
        // CASE B: Search
        const data = await fetchFromProviders(`/search?q=${encodeURIComponent(query)}&type=video`);
        const videos = data.map((item: any) => ({
            title: item.title,
            author: item.author,
            videoId: item.videoId,
            videoThumbnails: item.videoThumbnails
        })).slice(0, 10);
        setSearchResults(videos);
      }
    } catch (err) {
      setError('All servers are busy. Please try again in a moment.');
    } finally {
      setIsSearching(false);
    }
  };

  // --- 2. FIXED PLAY/QUEUE LOGIC ---
  const onSelectTrack = (video: APIVideo, action: 'play' | 'queue') => {
    const trackPayload = {
        title: video.title,
        channel: video.author,
        // CHANGE THIS LINE:
        // Old: url: `https://youtube.com/watch?v=${video.videoId}`
        // New: Send just the ID. The store handles this perfectly.
        url: video.videoId 
    };

    if (action === 'play') {
        playTrack(trackPayload);
        setFeedbackMsg(`Playing: ${video.title.substring(0, 20)}...`);
    } else {
        addToQueue(trackPayload);
        setFeedbackMsg('Added to queue');
    }
    setTimeout(() => setFeedbackMsg(''), 2000);
  };

  return (
    <div 
        className="h-full w-full flex flex-col rounded-2xl overflow-hidden backdrop-blur-md border border-white/10"
        style={{ backgroundColor: cardColor, color: textColor }}
    >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Search className="opacity-70" size={20} />
                <h2 className="text-lg font-semibold">Discover</h2>
            </div>
            {currentProvider && (
               <span className="text-[10px] opacity-40 uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded-full">
                  via {currentProvider.replace('/api', 'Node ')}
               </span>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 space-y-3 z-10 shadow-sm">
            <div className="relative flex items-center gap-2">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search song or paste URL..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder-white/30"
                />
                <button 
                    onClick={handleSearch}
                    disabled={isSearching || !query}
                    className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition disabled:opacity-50"
                >
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
            </div>
            
            {/* Feedback & Errors */}
            {feedbackMsg && (
                <div className="text-xs text-green-300 flex items-center gap-1 animate-pulse">
                    <Music size={12} /> {feedbackMsg}
                </div>
            )}
            {error && (
                <div className="text-xs text-red-300 flex items-center gap-1">
                    <ServerCrash size={12} /> {error}
                </div>
            )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {searchResults.length === 0 && !isSearching && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
                    <Music size={40} />
                    <p className="text-sm">Search for lofi, jazz, or paste a link.</p>
                </div>
            )}

            {searchResults.map((video) => (
                <div 
                    key={video.videoId} 
                    className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                        <img 
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                        />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <h4 className="font-medium text-sm truncate pr-2" title={video.title}>
                            {video.title}
                        </h4>
                        <p className="text-xs opacity-50 truncate">{video.author}</p>
                        
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                            {/* <button 
                                onClick={() => onSelectTrack(video, 'play')}
                                className="flex items-center gap-1 text-[10px] bg-white text-black px-2 py-1 rounded-md font-bold hover:scale-105"
                            >
                                <Play size={10} fill="currentColor" /> PLAY
                            </button> */}
                            <button 
                                onClick={() => onSelectTrack(video, 'queue')}
                                className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded-md font-medium hover:bg-white/20"
                            >
                                <Plus size={10} /> QUEUE
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default MusicSearch;
import { Playlist, Theme, Track } from './types';

// Moved helper up to use it in the data below
export const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: { bg: '#0f172a', text: '#f1f5f9', accent: '#3b82f6', card: 'rgba(30, 41, 59, 0.7)' }
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: { bg: '#2e3440', text: '#eceff4', accent: '#88c0d0', card: 'rgba(46, 52, 64, 0.8)' }
  },
  {
    id: 'tokyo',
    name: 'Tokyo Night',
    colors: { bg: '#1a1b26', text: '#a9b1d6', accent: '#7aa2f7', card: 'rgba(26, 27, 38, 0.8)' }
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    colors: { bg: '#282828', text: '#ebdbb2', accent: '#fe8019', card: 'rgba(40, 40, 40, 0.8)' }
  }
];

export const BACKGROUNDS = [
  { id: 'rain_city', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-glass-of-a-window-51726-large.mp4', thumb: 'https://picsum.photos/id/1/200/120' },
  { id: 'forest', type: 'image', url: 'https://images.unsplash.com/photo-1448375240586-dfd8f3793300?q=80&w=2000&auto=format&fit=crop', thumb: 'https://picsum.photos/id/10/200/120' },
  { id: 'coffee', type: 'image', url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop', thumb: 'https://picsum.photos/id/1060/200/120' },
  { id: 'abstract', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop', thumb: 'https://picsum.photos/id/108/200/120' },
];

// Flattened list specifically for the Music Player component
// export const INITIAL_QUEUE = [
//   { title: "Snowfall", artist: "Øneheart", videoId: "LlN8MPS7KQs" },
//   { title: "After Dark", artist: "Mr.Kitty", videoId: "sVx1mJDeUjY" },
//   { title: "Study Session", artist: "Lofi Girl", videoId: "jfKfPfyJRdk" },
//   { title: "Chillhop Winter 2025", artist: "Chillhop Music", videoId: "Zq0cZnA2Dhc" },
//   { title: "Steezys Drive-In", artist: "Steezy as Fuck", videoId: "I4j6OF_Xu90" },
//   { title: "Synthwave Radio", artist: "Lofi Girl", videoId: "4xDzrJKXOOY" },
//   { title: "Rain Sounds 10h", artist: "Relaxed", videoId: "mPZkdNFkNps" }
// ];

// REVISED PLAYLISTS: Kept for reference or future playlist selection features
export const CURATED_PLAYLISTS: Playlist[] = [
  {
    id: 'chill_beats',
    name: 'Chill Beats',
    type: 'curated',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&q=80&w=200',
    tracks: [
      { 
        title: 'Chillhop Essentials - Winter 2025', 
        channel: 'Chillhop Music', 
        url: 'https://www.youtube.com/watch?v=Zq0cZnA2Dhc' 
      },
      { 
        title: 'Lofi Hip Hop - 1 A.M Study Session', 
        channel: 'Lofi Girl', 
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' 
      },
      { 
        title: 'Steezys Drive-In', 
        channel: 'Steezy as Fuck', 
        url: 'https://www.youtube.com/watch?v=I4j6OF_Xu90' 
      },
      { 
        title: 'Coding in the First Night of New Year', 
        channel: 'Pluviophile Lofi', 
        url: 'https://www.youtube.com/watch?v=BDvQ5mAl2xM' 
      }
    ]
  },
  {
    id: 'study_flow',
    name: 'Study Flow',
    type: 'curated',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=200',
    tracks: [
      { 
        title: 'Deep Focus Music - To Improve Concentration', 
        channel: 'Quiet Quest', 
        url: 'https://www.youtube.com/watch?v=2OEL4P1Rz04' 
      },
      { 
        title: 'Minimal Tech Lo-Fi for Coding', 
        channel: 'Code Indi', 
        url: 'https://www.youtube.com/watch?v=UTeAngt2utQ' 
      },
      { 
        title: 'Brain Power Music - Focus', 
        channel: 'Greenred Productions', 
        url: 'https://www.youtube.com/watch?v=WPni755-Krg' 
      }
    ]
  },
  {
    id: 'night_vibes',
    name: 'Night Vibes',
    type: 'curated',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=200',
    tracks: [
      { 
        title: 'Synthwave Radio - Beats to Chill/Game to', 
        channel: 'Lofi Girl', 
        url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' 
      },
      { 
        title: 'Nighttime Jazz - Relaxing', 
        channel: 'Steezy As Fuck', 
        url: 'https://www.youtube.com/watch?v=Dx5qFachd3A' 
      },
      { 
        title: 'Late Night Coding Session', 
        channel: 'Lofi Boost', 
        url: 'https://www.youtube.com/watch?v=VHSnxNsXNnE' 
      }
    ]
  },
  {
    id: 'rainy_day',
    name: 'Rainy Day',
    type: 'curated',
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=200',
    tracks: [
      { 
        title: 'Rain Sounds 10 Hours', 
        channel: 'Relaxed', 
        url: 'https://www.youtube.com/watch?v=mPZkdNFkNps' 
      },
      { 
        title: 'Cozy Coffee Shop Ambience', 
        channel: 'Relaxing Ambience', 
        url: 'https://www.youtube.com/watch?v=gaGl6UV3KPg' 
      },
      { 
        title: 'Thunderstorm Sounds', 
        channel: 'Relaxing White Noise', 
        url: 'https://www.youtube.com/watch?v=q76bMs-NwRk' 
      }
    ]
  }
];

export const INITIAL_QUEUE = [
  // ... Your specific favorite tracks first
  { title: "Snowfall", artist: "Øneheart", videoId: "LlN8MPS7KQs" },
  { title: "After Dark", artist: "Mr.Kitty", videoId: "sVx1mJDeUjY" },
  
  // ... Spread in tracks from your curated lists automatically
  ...CURATED_PLAYLISTS.flatMap(playlist => 
    playlist.tracks.map(track => ({
      title: track.title,
      artist: track.channel, // Note: We map 'channel' to 'artist' to match our player
      videoId: extractVideoId(track.url) || "" 
    }))
  )
].filter(track => track.videoId !== ""); // Cleanup any failed IDs

export const TIMER_PRESETS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ',
  NEXT_TRACK: 'ArrowRight',
  PREV_TRACK: 'ArrowLeft',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
  MUTE: 'm',
  TOGGLE_PLAYLIST: 'p',
  TOGGLE_TIMER: 't',
  TOGGLE_TODO: 'd',
  CHANGE_BACKGROUND: 'b',
  FULLSCREEN: 'f',
  HELP: '?'
};
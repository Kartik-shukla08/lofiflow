export interface Track {
  url: string;
  title: string;
  channel: string;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  type: 'curated' | 'custom';
  thumbnail: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: 'Today' | 'Work' | 'Personal' | 'Study';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  avatar?: string;
  isSystem?: boolean;
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    card: string;
  };
}

export interface User {
  uid: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'away' | 'busy';
}

export interface Room {
  id: string;
  name: string;
  active: boolean;
  participants: number;
  currentTrack?: Track;
}
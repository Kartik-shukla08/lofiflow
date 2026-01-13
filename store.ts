import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Theme, TimerMode, User, Room, Message } from './types';
import { THEMES, CURATED_PLAYLISTS, TIMER_PRESETS, BACKGROUNDS, INITIAL_QUEUE, extractVideoId } from './constants';
import { nanoid } from 'nanoid';


// Firestore helpers
import { app, db, auth, isFirebaseEnabled } from './services/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, onSnapshot, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

// Define the specific Track shape for the Player
export interface Track {
  title: string;
  artist: string;
  videoId: string;
}

// Define the shape of the incoming data from Search (Search uses url/channel)
interface SearchResult {
  title: string;
  url: string;
  channel: string;
}

// --- UI Store ---
interface UIState {
  currentTheme: Theme;
  backgroundUrl: string;
  backgroundType: 'image' | 'video';
  activePanels: {
    music: boolean;
    todo: boolean;
    timer: boolean;
    chat: boolean;
    settings: boolean;
    search: boolean;
  };
  setTheme: (themeId: string) => void;
  setBackground: (url: string, type: 'image' | 'video') => void;
  togglePanel: (panel: keyof UIState['activePanels']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentTheme: THEMES[0],
      backgroundUrl: BACKGROUNDS[0].url,
      backgroundType: 'video' as const,
      activePanels: {
        music: true,
        todo: false,
        timer: true,
        chat: false,
        settings: false,
        search: false,
      },
      setTheme: (id) => set({ currentTheme: THEMES.find((t) => t.id === id) || THEMES[0] }),
      setBackground: (url, type) => set({ backgroundUrl: url, backgroundType: type }),
      togglePanel: (panel) =>
        set((state) => ({
          activePanels: { ...state.activePanels, [panel]: !state.activePanels[panel] },
        })),
    }),
    { name: 'ui-storage' }
  )
);

// --- Player Store ---
// --- Player Store (UPDATED) ---

// --- Player Store ---

interface PlayerState {
  isPlaying: boolean;
  queue: Track[];      // Uses our new "Track" definition
  currentIndex: number;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  // These accept 'SearchResult' inputs and convert them internally
  playTrack: (track: SearchResult) => void; 
  addToQueue: (track: SearchResult) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setIndex: (index: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  queue: INITIAL_QUEUE, 
  currentIndex: 0,

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  playTrack: (inputTrack) => {
    // extractVideoId is safe to use here
    const videoId = extractVideoId(inputTrack.url) || inputTrack.url;
    if (!videoId) return;

    // We explicitly map the Input (url/channel) to the Store Track (videoId/artist)
    const newTrack: Track = {
      title: inputTrack.title,
      artist: inputTrack.channel || 'Custom Track', 
      videoId: videoId
    };

    set((state) => {
      const newQueue = [...state.queue];
      newQueue.splice(state.currentIndex + 1, 0, newTrack);
      return { 
        queue: newQueue, 
        currentIndex: state.currentIndex + 1, 
        isPlaying: true 
      };
    });
  },

  addToQueue: (inputTrack) => {
    const videoId = extractVideoId(inputTrack.url) || inputTrack.url;
    if (!videoId) return;

    const newTrack: Track = {
      title: inputTrack.title,
      artist: inputTrack.channel || 'Custom Track',
      videoId: videoId
    };

    set((state) => ({ queue: [...state.queue, newTrack] }));
  },

  nextTrack: () => set((state) => ({ 
    currentIndex: (state.currentIndex + 1) % state.queue.length 
  })),

  prevTrack: () => set((state) => ({ 
    currentIndex: (state.currentIndex - 1 + state.queue.length) % state.queue.length 
  })),

  setIndex: (index) => set({ currentIndex: index }),
}));

// // --- Productivity Store ---
// interface ProductivityState {
//   // Timer
//   timerMode: TimerMode;
//   timeLeft: number;
//   timerActive: boolean;
//   setTimerMode: (mode: TimerMode) => void;
//   toggleTimer: () => void;
//   resetTimer: () => void;
//   tick: () => void;
  
//   // Tasks
//   tasks: Task[];
//   addTask: (text: string) => void;
//   toggleTask: (id: string) => void;
//   deleteTask: (id: string) => void;

  
// }

// export const useProductivityStore = create<ProductivityState>()(
//   persist(
//     (set, get) => ({
//       timerMode: 'focus',
//       timeLeft: TIMER_PRESETS.focus,
//       timerActive: false,
//       tasks: [],
      
//       setTimerMode: (mode) => set({ 
//         timerMode: mode, 
//         timeLeft: TIMER_PRESETS[mode], 
//         timerActive: false 

      

//       }),
//       toggleTimer: () => set((state) => ({ timerActive: !state.timerActive })),
//       resetTimer: () => set((state) => ({ 
//         timeLeft: TIMER_PRESETS[state.timerMode], 
//         timerActive: false 
//       })),
//       tick: () => set((state) => {
//         if (state.timeLeft <= 0) {
//           // Timer finished logic
//           return { timerActive: false, timeLeft: 0 };
//         }
//         return { timeLeft: state.timeLeft - 1 };
//       }),

//       addTask: (text) => set((state) => ({
//         tasks: [...state.tasks, {
//           id: nanoid(),
//           text,
//           completed: false,
//           category: 'Today',
//           priority: 'medium',
//           createdAt: Date.now()
//         }]
//       })),
//       toggleTask: (id) => set((state) => ({
//         tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
//       })),
//       deleteTask: (id) => set((state) => ({
//         tasks: state.tasks.filter(t => t.id !== id)
//       })),
//     }),
//     { name: 'productivity-storage' }
//   )
// );
// --- Productivity Store ---
interface ProductivityState {
  // Timer
  timerMode: TimerMode;
  timeLeft: number;
  timerActive: boolean;
  setTimerMode: (mode: TimerMode) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  
  // --- NEW ACTION ADDED HERE ---
  setTime: (seconds: number) => void; 
  
  // Tasks
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

export const useProductivityStore = create<ProductivityState>()(
  persist(
    (set, get) => ({
      timerMode: 'focus',
      timeLeft: TIMER_PRESETS.focus,
      timerActive: false,
      tasks: [],
      
      setTimerMode: (mode) => set({ 
        timerMode: mode, 
        timeLeft: TIMER_PRESETS[mode], 
        timerActive: false 
      }),
      toggleTimer: () => set((state) => ({ timerActive: !state.timerActive })),
      resetTimer: () => set((state) => ({ 
        timeLeft: TIMER_PRESETS[state.timerMode], 
        timerActive: false 
      })),
      tick: () => set((state) => {
        if (state.timeLeft <= 0) {
          // Timer finished logic
          return { timerActive: false, timeLeft: 0 };
        }
        return { timeLeft: state.timeLeft - 1 };
      }),

      // --- NEW IMPLEMENTATION ADDED HERE ---
      setTime: (seconds) => set({ timeLeft: seconds }),

      addTask: (text) => set((state) => ({
        tasks: [...state.tasks, {
          id: nanoid(),
          text,
          completed: false,
          category: 'Today',
          priority: 'medium',
          createdAt: Date.now()
        }]
      })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
    }),
    { name: 'productivity-storage' }
  )
);
// --- Chat/Room Store (Firebase-enabled with local fallback) ---

interface ChatState {
  user: User | null;
  activeRoom: Room | null;
  messages: Message[];
  isConnected: boolean;
  joinRoom: (roomName: string) => void;
  createRoom: (roomName?: string) => Promise<{ roomId: string; code: string } | null>;
  joinRoomByCode: (idOrCode: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  let messagesUnsub: (() => void) | null = null;

  // Hook into Firebase auth state if enabled
  if (isFirebaseEnabled && auth) {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        set({ user: { uid: u.uid, displayName: u.displayName || 'Guest Student', avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${u.uid}`, status: 'online' } });
      } else {
        // auto sign-in anonymously
        signInAnonymously(auth).catch((e) => {
          console.warn('Anonymous sign-in failed:', e);
        });
      }
    });
  } else {
    // Fallback demo user
    set({ user: { uid: 'demo-user', displayName: 'Guest Student', avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${Date.now()}`, status: 'online' } });
  }

  return ({
    user: null,
    activeRoom: null,
    messages: [],
    isConnected: false,

    joinRoom: async (roomName: string) => {
      if (isFirebaseEnabled && db) {
        // Ensure we have an authenticated user
        if (auth && !auth.currentUser) {
          try { await signInAnonymously(auth); } catch (e) { console.warn(e); }
        }
        const currentUser = auth?.currentUser;
        if (!currentUser) return;

        // Find or create room
        const roomsCol = collection(db, 'rooms');
        const q = query(roomsCol, where('name', '==', roomName));
        const qSnap = await getDocs(q);
        let roomRef: any;
        let participants = 1;
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          roomRef = docSnap.ref;
          const data: any = docSnap.data();
          participants = (data?.participants || 0) + 1;
          await updateDoc(roomRef, { participants: increment(1) });
        } else {
          roomRef = await addDoc(roomsCol, { name: roomName, participants: 1, createdAt: serverTimestamp() });
          participants = 1;
        }

        const roomId = roomRef.id;
        set({ isConnected: true, activeRoom: { id: roomId, name: roomName, active: true, participants }, messages: [] });
        console.log(`[chat] joined room ${roomName} (${roomId}) as ${currentUser.uid}`);

        // Listen for messages
        if (messagesUnsub) messagesUnsub();
        const msgsQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
        messagesUnsub = onSnapshot(msgsQuery, (snap) => {
          const msgs: Message[] = snap.docs.map(d => {
            const data: any = d.data();
            let ts = Date.now();
            if (data.timestamp && data.timestamp.toMillis) ts = data.timestamp.toMillis();
            if (data.timestamp && data.timestamp._seconds) ts = data.timestamp._seconds * 1000;
            return { id: d.id, userId: data.userId || '', username: data.username || '', text: data.text || '', timestamp: ts, avatar: data.avatar, isSystem: data.isSystem || false } as Message;
          });
          set({ messages: msgs });
        });

        // Announce join
        await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: 'system', username: 'System', text: `${currentUser.uid} joined the room`, timestamp: serverTimestamp(), isSystem: true });

      } else {
        // Simulate API call
        setTimeout(() => {
          set({
            isConnected: true,
            activeRoom: { id: nanoid(), name: roomName, active: true, participants: 4 },
            messages: [ { id: '1', userId: 'system', username: 'System', text: `Welcome to ${roomName}!`, timestamp: Date.now(), isSystem: true } ]
          });
        }, 500);
      }
    },

    // Create a new room and return its id and invite code
    createRoom: async (roomName?: string) => {
      if (isFirebaseEnabled && db) {
        if (auth && !auth.currentUser) {
          try { await signInAnonymously(auth); } catch (e) { console.warn(e); }
        }
        const currentUser = auth?.currentUser;
        if (!currentUser) return null;

        const roomsCol = collection(db, 'rooms');
        const code = nanoid(6);
        const roomRef = await addDoc(roomsCol, { name: roomName || `Room ${code}`, participants: 1, code, createdAt: serverTimestamp() });
        const roomId = roomRef.id;
        set({ isConnected: true, activeRoom: { id: roomId, name: roomName || `Room ${code}`, active: true, participants: 1 }, messages: [] });

        if (typeof messagesUnsub === 'function') { messagesUnsub(); }
        const msgsQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
        messagesUnsub = onSnapshot(msgsQuery, (snap) => {
          const msgs: Message[] = snap.docs.map(d => {
            const data: any = d.data();
            let ts = Date.now();
            if (data.timestamp && data.timestamp.toMillis) ts = data.timestamp.toMillis();
            if (data.timestamp && data.timestamp._seconds) ts = data.timestamp._seconds * 1000;
            return { id: d.id, userId: data.userId || '', username: data.username || '', text: data.text || '', timestamp: ts, avatar: data.avatar, isSystem: data.isSystem || false } as Message;
          });
          set({ messages: msgs });
        });

        await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: 'system', username: 'System', text: `${currentUser.uid} created and joined the room`, timestamp: serverTimestamp(), isSystem: true });
        return { roomId, code };
      } else {
        const id = nanoid();
        const name = roomName || `Room ${id}`;
        set({ isConnected: true, activeRoom: { id, name, active: true, participants: 1 }, messages: [ { id: '1', userId: 'system', username: 'System', text: `Welcome to ${name}!`, timestamp: Date.now(), isSystem: true } ] });
        return { roomId: id, code: id };
      }
    },

    // Join by room id or invite code
    joinRoomByCode: async (idOrCode: string) => {
      if (isFirebaseEnabled && db) {
        if (auth && !auth.currentUser) {
          try { await signInAnonymously(auth); } catch (e) { console.warn(e); }
        }
        const currentUser = auth?.currentUser;
        if (!currentUser) return;

        try {
          // Try by doc id first
          const maybeDoc = await getDoc(doc(db, 'rooms', idOrCode));
          let roomRef: any;
          let roomData: any;
          if (maybeDoc.exists()) {
            roomRef = maybeDoc.ref;
            roomData = maybeDoc.data();
            await updateDoc(roomRef, { participants: increment(1) });
          } else {
            const roomsCol = collection(db, 'rooms');
            const q = query(roomsCol, where('code', '==', idOrCode));
            const qSnap = await getDocs(q);
            if (qSnap.empty) {
              console.warn('Room not found with id or code:', idOrCode);
              return;
            }
            const docSnap = qSnap.docs[0];
            roomRef = docSnap.ref;
            roomData = docSnap.data();
            await updateDoc(roomRef, { participants: increment(1) });
          }

          const roomId = roomRef.id;
          set({ isConnected: true, activeRoom: { id: roomId, name: roomData?.name || `Room ${roomId}`, active: true, participants: (roomData?.participants || 0) + 1 }, messages: [] });

          if (typeof messagesUnsub === 'function') { messagesUnsub(); }
          const msgsQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
          messagesUnsub = onSnapshot(msgsQuery, (snap) => {
            const msgs: Message[] = snap.docs.map(d => {
              const data: any = d.data();
              let ts = Date.now();
              if (data.timestamp && data.timestamp.toMillis) ts = data.timestamp.toMillis();
              if (data.timestamp && data.timestamp._seconds) ts = data.timestamp._seconds * 1000;
              return { id: d.id, userId: data.userId || '', username: data.username || '', text: data.text || '', timestamp: ts, avatar: data.avatar, isSystem: data.isSystem || false } as Message;
            });
            set({ messages: msgs });
          });

          await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: 'system', username: 'System', text: `${currentUser.uid} joined the room`, timestamp: serverTimestamp(), isSystem: true });

        } catch (e) {
          console.warn('Failed to join room by code:', e);
        }
      } else {
        setTimeout(() => {
          set({ isConnected: true, activeRoom: { id: idOrCode, name: idOrCode, active: true, participants: 1 }, messages: [ { id: '1', userId: 'system', username: 'System', text: `Welcome to ${idOrCode}!`, timestamp: Date.now(), isSystem: true } ] });
        }, 300);
      }
    },

    leaveRoom: async () => {
      const active = get().activeRoom;
      if (isFirebaseEnabled && db && active) {
        const roomId = active.id;
        const currentUser = auth?.currentUser;
        try {
          await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: 'system', username: 'System', text: `${currentUser?.uid || 'Someone'} left the room`, timestamp: serverTimestamp(), isSystem: true });
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, { participants: increment(-1) });
        } catch (e) { console.warn(e); }
        if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }
        set({ activeRoom: null, isConnected: false, messages: [] });
      } else {
        set({ activeRoom: null, isConnected: false, messages: [] });
      }
    },

    sendMessage: async (text: string) => {
      if (isFirebaseEnabled && db && get().activeRoom) {
        const currentUser = auth?.currentUser;
        const uid = currentUser?.uid || 'anonymous';
        const username = currentUser?.displayName || `Guest`;
        const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${uid}`;
        const roomId = get().activeRoom!.id;
        try {
          await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: uid, username, text, avatar, timestamp: serverTimestamp() });
          console.log(`[chat] sent message to room ${roomId} by ${uid}: ${text}`);
        } catch (e) { console.warn(e); }
      } else {
        const { user, messages } = get();
        if (!user) return;
        const newMessage: Message = { id: nanoid(), userId: user.uid, username: user.displayName, avatar: user.avatar, text, timestamp: Date.now() };
        set({ messages: [...messages, newMessage] });
        if (Math.random() > 0.7) {
          setTimeout(() => {
            const botMsg: Message = { id: nanoid(), userId: 'bot', username: 'StudyBot', text: "Keep up the good work! 📚", timestamp: Date.now(), avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=study' };
            set(s => ({ messages: [...s.messages, botMsg] }));
          }, 2000);
        }
      }
    }
  });
});
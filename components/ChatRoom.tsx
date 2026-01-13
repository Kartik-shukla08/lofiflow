import React, { useEffect, useRef, useState } from 'react';
import { db, auth, isFirebaseEnabled } from '../services/firebase';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Copy, 
  LogOut, 
  Hash, 
  Loader2,
  Check
} from 'lucide-react';

const ROOM_CODE_LENGTH = 6;

const generateRoomCode = () => {
  return Math.random().toString(36).slice(2, 2 + ROOM_CODE_LENGTH).toUpperCase();
};

const ChatRoom: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0); // NEW: Online count state
  const [messageText, setMessageText] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeMsgRef = useRef<(() => void) | null>(null);
  const unsubscribePresenceRef = useRef<(() => void) | null>(null);

  // Theme from global UI store
  const { currentTheme } = useUIStore();
  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.7)';
  const textColor = currentTheme?.colors?.text || '#fff';
  const accent = currentTheme?.colors?.accent || '#3b82f6';

  // --- 1. Auth & Initial Setup ---
  useEffect(() => {
    if (!isFirebaseEnabled) return;

    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch((e) => console.error('Auth failed:', e));
    }

    const handleAuthStateChange = (u: any) => {
      const uid = u?.uid || null;
      setUserId(uid);
      if (uid) setDisplayName(`User-${uid.slice(-4)}`);
    };

    let unsubscribeAuth: (() => void) | null = null;
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, handleAuthStateChange);
      if ((auth as any).currentUser) handleAuthStateChange((auth as any).currentUser);
    }

    // Auto-join from URL
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) joinRoom(room.toUpperCase());
    } catch (e) { /* ignore */ }

    // Cleanup on unmount (leave room logic)
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (currentRoom && userId) {
         // Attempt to remove presence on strict unmount
         // Note: reliability depends on browser lifecycle
         const presenceRef = doc(db, 'rooms', currentRoom, 'presence', userId);
         deleteDoc(presenceRef).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 2. Room Logic ---

  const createRoom = async () => {
    if (!isFirebaseEnabled || !db) return setError('Firebase not configured.');
    setError(null);
    setIsJoining(true);

    let code = generateRoomCode();
    let tries = 0;
    
    try {
        while (tries < 5) {
        const roomRef = doc(db, 'rooms', code);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) {
            await setDoc(roomRef, {
            code,
            createdAt: serverTimestamp(),
            createdBy: userId || null
            });
            await enterRoomSequence(code);
            return;
        }
        code = generateRoomCode();
        tries++;
        }
        setError('Could not generate unique code. Try again.');
    } catch (e) {
        setError('Failed to create room.');
    } finally {
        setIsJoining(false);
    }
  };

  const joinRoom = async (codeInput?: string) => {
    const code = (codeInput || roomCodeInput || '').trim().toUpperCase();
    if (!code) return setError('Enter a room code.');
    if (!isFirebaseEnabled || !db) return setError('Firebase disabled.');

    setIsJoining(true);
    setError(null);

    try {
      const roomRef = doc(db, 'rooms', code);
      const snap = await getDoc(roomRef);
      
      if (!snap.exists()) {
        setError('Room not found.');
        setIsJoining(false);
        return;
      }
      await enterRoomSequence(code);
    } catch (e) {
      console.error(e);
      setError('Failed to join room.');
    } finally {
      setIsJoining(false);
    }
  };

  // Common logic for Create & Join
  const enterRoomSequence = async (code: string) => {
    setCurrentRoom(code);
    setRoomCodeInput('');
    
    // 1. Subscribe to Chat
    subscribeToMessages(code);
    
    // 2. Add Self to Presence & Subscribe to Presence Count
    if (userId) {
        const presenceRef = doc(db, 'rooms', code, 'presence', userId);
        await setDoc(presenceRef, { 
            uid: userId, 
            joinedAt: serverTimestamp(),
            displayName 
        });
        subscribeToPresence(code);
    }

    // 3. Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('room', code);
    window.history.replaceState({}, '', url.toString());
  };

  const leaveRoom = async () => {
    if (currentRoom && userId) {
        // Remove self from presence
        try {
            await deleteDoc(doc(db, 'rooms', currentRoom, 'presence', userId));
        } catch(e) { /* ignore */ }
    }

    if (unsubscribeMsgRef.current) unsubscribeMsgRef.current();
    if (unsubscribePresenceRef.current) unsubscribePresenceRef.current();
    
    setCurrentRoom(null);
    setMessages([]);
    setOnlineCount(0);

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  // --- 3. Subscriptions ---

  const subscribeToMessages = (code: string) => {
    if (unsubscribeMsgRef.current) unsubscribeMsgRef.current();

    const q = query(collection(doc(db, 'rooms', code), 'messages'), orderBy('createdAt', 'asc'));
    unsubscribeMsgRef.current = onSnapshot(q, (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
    });
  };

  // NEW: Presence Listener
  const subscribeToPresence = (code: string) => {
    if (unsubscribePresenceRef.current) unsubscribePresenceRef.current();

    const q = collection(doc(db, 'rooms', code), 'presence');
    unsubscribePresenceRef.current = onSnapshot(q, (snapshot) => {
        setOnlineCount(snapshot.size);
    });
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || !currentRoom || !db) return;

    const text = messageText.trim();
    setMessageText(''); // Optimistic clear

    try {
      await addDoc(collection(doc(db, 'rooms', currentRoom), 'messages'), {
        text,
        createdAt: serverTimestamp(),
        senderId: userId || 'unknown',
        displayName: displayName || 'Anon'
      });
    } catch (e) {
      console.error(e);
      setError('Failed to send.');
    }
  };

  const copyShareLink = async () => {
    if (!currentRoom) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError('Clipboard access denied.');
    }
  };

  // --- 4. Render ---
  
  if (!isFirebaseEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center rounded-2xl border border-white/5 backdrop-blur-xl" style={{ backgroundColor: cardColor, color: textColor }}>
        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="font-bold mb-2">Chat Disabled</h3>
        <p className="text-sm max-w-xs">Enable Firebase in your <code className="bg-white/10 px-1 rounded">.env</code> file to start a room.</p>
      </div>
    );
  }

  // LOBBY VIEW
  if (!currentRoom) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        style={{ backgroundColor: cardColor, color: textColor }}
      >
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: accent, opacity: 0.08 }} />

        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-2 ring-1 ring-white/20">
                <MessageSquare className="w-8 h-8 text-white/90" />
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Chat Rooms</h2>
                <p className="text-sm max-w-[240px] mx-auto opacity-70">
                    Create a private room or join friends to vibe together.
                </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Hash className="w-4 h-4 text-white/30" />
                        </div>
                        <input
                            className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 placeholder:text-white/20 transition font-mono text-sm uppercase"
                            placeholder="ROOM CODE"
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value)}
                            maxLength={ROOM_CODE_LENGTH}
                            style={{ color: textColor }}
                        />
                    </div>
                    <button 
                        onClick={() => joinRoom()} 
                        disabled={isJoining}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition disabled:opacity-50"
                    >
                        {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
                    </button>
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-white/30 text-xs">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                    onClick={createRoom} 
                    disabled={isJoining}
                    className="w-full py-3 rounded-xl text-white font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accent }}
                >
                    {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start New Room</>}
                </button>
            </div>
            
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/20"
                >
                    {error}
                </motion.div>
            )}
        </div>
      </motion.div>
    );
  }

  // ACTIVE ROOM VIEW
  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex flex-col h-full rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: cardColor, color: textColor }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="text-white font-bold text-sm tracking-wide">ROOM {currentRoom}</h3>
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {onlineCount} Online
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1">
            <button 
                onClick={copyShareLink}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
                title="Copy Invite Link"
            >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
                onClick={leaveRoom}
                className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition"
                title="Leave Room"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-white/20">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Room created. Waiting for vibes...</p>
            </div>
        )}
        
        {messages.map((m, idx) => {
            const isMe = m.senderId === userId;
            const isSequential = idx > 0 && messages[idx - 1].senderId === m.senderId;
            
            return (
                <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                    {!isSequential && !isMe && (
                        <span className="text-[10px] text-white/40 ml-3 mb-1">{m.displayName}</span>
                    )}
                    
                    <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${isMe ? 'rounded-tr-sm' : 'bg-white/10 text-white/90 border border-white/5 rounded-tl-sm'}`}
                        style={isMe ? { backgroundColor: accent, color: '#fff' } : undefined}
                    >
                        {m.text}
                    </div>
                </motion.div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white/5 border-t border-white/5">
        <form onSubmit={sendMessage} className="relative flex items-center gap-2">
            <input
                className="flex-1 pl-4 pr-12 py-3 rounded-xl bg-black/40 border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition text-sm"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{ color: textColor }}
            />
            <button 
                type="submit" 
                disabled={!messageText.trim()}
                className="absolute right-2 p-1.5 rounded-lg bg-white/10 hover:bg-blue-500 text-white/60 hover:text-white disabled:opacity-0 disabled:scale-90 transition-all duration-200"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatRoom;
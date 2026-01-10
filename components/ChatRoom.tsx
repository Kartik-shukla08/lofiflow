import React, { useEffect, useRef, useState } from 'react';
import { db, auth, isFirebaseEnabled } from '../services/firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const ROOM_CODE_LENGTH = 6;

const generateRoomCode = () => {
  // Generate an upper-case alphanumeric code
  return Math.random().toString(36).slice(2, 2 + ROOM_CODE_LENGTH).toUpperCase();
};

const ChatRoom: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // If Firebase is disabled, show a helpful message (no automatic auth)
    if (!isFirebaseEnabled) return;

    // Ensure user is signed in anonymously
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch((e) => {
        console.error('Anonymous sign-in failed:', e);
      });
    }

    const handleAuthStateChange = (u: any) => {
      const uid = u?.uid || null;
      setUserId(uid);
      if (uid) {
        setDisplayName(`User-${uid.slice(-4)}`);
      }
    };

    // auth may be null if Firebase disabled
    let unsubscribeAuth: (() => void) | null = null;
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, handleAuthStateChange);
      // if user already present, ensure state is synced immediately
      if ((auth as any).currentUser) {
        handleAuthStateChange((auth as any).currentUser);
      }
    }

    // If there's a room code in the URL, attempt to auto-join
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        joinRoom(room.toUpperCase());
      }
    } catch (e) {
      // ignore
    }

    // cleanup
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Scroll to bottom on messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const createRoom = async () => {
    if (!isFirebaseEnabled || !db) {
      setError('Firebase is not enabled. Please configure Firebase in your .env file (see README).');
      return;
    }

    setError(null);

    // generate unique code and create room document
    let code = generateRoomCode();
    let tries = 0;
    while (tries < 5) {
      const roomRef = doc(db, 'rooms', code);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        await setDoc(roomRef, {
          code,
          createdAt: serverTimestamp(),
          createdBy: userId || null
        });
        setCurrentRoom(code);
        setRoomCodeInput('');
        subscribeToMessages(code);
        // update URL for sharing
        const url = new URL(window.location.href);
        url.searchParams.set('room', code);
        window.history.replaceState({}, '', url.toString());
        return;
      }
      code = generateRoomCode();
      tries++;
    }

    setError('Could not generate a unique room code, please try again.');
  };

  const joinRoom = async (codeInput?: string) => {
    const code = (codeInput || roomCodeInput || '').trim().toUpperCase();
    if (!code) return setError('Please enter a room code to join.');
    if (!isFirebaseEnabled || !db) return setError('Firebase not configured.');

    setIsJoining(true);
    setError(null);

    try {
      const roomRef = doc(db, 'rooms', code);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        setError('Room not found. Create it and share the code to invite others.');
        setIsJoining(false);
        return;
      }

      setCurrentRoom(code);
      setRoomCodeInput('');
      subscribeToMessages(code);

      // set url param
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error(e);
      setError('Failed to join room.');
    } finally {
      setIsJoining(false);
    }
  };

  const subscribeToMessages = (code: string) => {
    // unsubscribe if already listening
    if (unsubscribeRef.current) unsubscribeRef.current();

    const msgsQuery = query(collection(doc(db, 'rooms', code), 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((d) => {
        arr.push({ id: d.id, ...d.data() });
      });
      setMessages(arr);
    });

    unsubscribeRef.current = unsubscribe;
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim()) return;
    if (!currentRoom) return setError('Join a room to send messages.');
    if (!isFirebaseEnabled || !db) return setError('Firebase not configured.');

    try {
      await addDoc(collection(doc(db, 'rooms', currentRoom), 'messages'), {
        text: messageText.trim(),
        createdAt: serverTimestamp(),
        senderId: userId || 'unknown',
        displayName: displayName || 'Anon'
      });
      setMessageText('');
    } catch (e) {
      console.error(e);
      setError('Failed to send message.');
    }
  };

  const leaveRoom = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = null;
    setCurrentRoom(null);
    setMessages([]);
    // clear room param
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      // ignore
    }
  };

  const copyShareLink = async () => {
    if (!currentRoom) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom);
    try {
      await navigator.clipboard.writeText(url.toString());
      alert('Room link copied to clipboard');
    } catch (e) {
      console.error('copy failed', e);
      setError('Could not copy to clipboard.');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4 bg-black/30 rounded-lg border border-white/5" style={{ backdropFilter: 'blur(6px)' }}>
      <h3 className="text-lg font-bold mb-2">Lofi Flow Chat</h3>

      {!isFirebaseEnabled && (
        <div className="p-3 mb-3 rounded bg-yellow-900/30 border border-yellow-800 text-yellow-100 text-sm">
          Firebase is disabled. To enable real chat, add Firebase credentials to your `.env` and set <code>VITE_ENABLE_FIREBASE=true</code>. See README for details.
        </div>
      )}

      {!currentRoom ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 rounded bg-white/5 border border-white/10 placeholder:text-white/40"
              placeholder="Enter room code to join"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
            />
            <button onClick={() => joinRoom()} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Join</button>
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={createRoom} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Create Room</button>
            <span className="text-xs text-white/60">or share a code to invite others</span>
          </div>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

          <div className="mt-3 text-xs text-white/60">
            Rooms use short codes — share the code or copy the URL to invite. If you want Google auth instead of anonymous, I can add it.
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-white/80">Room <strong className="font-mono">{currentRoom}</strong></div>
              <div className="text-xs text-white/60">{messages.length} messages</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={copyShareLink} className="px-2 py-1 rounded bg-white/10 text-sm">Copy Link</button>
              <button onClick={leaveRoom} className="px-2 py-1 rounded bg-red-700/20 text-sm">Leave</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-2 p-2 bg-black/25 rounded" style={{ minHeight: 0 }}>
            {messages.length === 0 && <div className="text-sm text-white/50">No messages yet — say hi 👋</div>}
            {messages.map((m) => (
              <div key={m.id} className="mb-2">
                <div className="text-xs text-white/60">
                  <span className="font-mono">{m.displayName || m.senderId}</span>
                  <span className="ml-2 text-white/40">{m.createdAt && m.createdAt.toDate ? new Date(m.createdAt.toDate()).toLocaleTimeString() : ''}</span>
                </div>
                <div className="mt-1 text-sm break-words">{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="mt-1 flex gap-2">
            <input
              className="flex-1 p-2 rounded bg-white/5 border border-white/10 placeholder:text-white/40"
              placeholder="Write a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit" className="px-3 py-2 rounded bg-white/10">Send</button>
          </form>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;

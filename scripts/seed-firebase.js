// Seed script to populate Firestore emulator with sample rooms & messages
// Usage: set FIRESTORE_EMULATOR_HOST=localhost:8080 && node scripts/seed-firebase.js

const admin = require('firebase-admin');

// Default to emulator host/port values from .env if not set in the environment
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  const host = process.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
  const port = process.env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT || '8080';
  process.env.FIRESTORE_EMULATOR_HOST = `${host}:${port}`;
}

// Connect to the emulator by initializing admin with projectId
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project';
admin.initializeApp({ projectId });
const db = admin.firestore();

async function seed() {
  const rooms = ['Quiet Library', 'Late Night Grind', 'Coffee Shop'];
  for (const name of rooms) {
    const roomRef = db.collection('rooms').doc();
    await roomRef.set({ name, participants: Math.floor(Math.random() * 6) + 1, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const messagesRef = roomRef.collection('messages');
    await messagesRef.add({ userId: 'system', username: 'System', text: `Welcome to ${name}!`, timestamp: admin.firestore.FieldValue.serverTimestamp(), isSystem: true });
    await messagesRef.add({ userId: 'seed', username: 'SeedUser', text: 'This is a seeded message', timestamp: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('Seeded sample rooms');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

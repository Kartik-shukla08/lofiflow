import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// --- INSTRUCTIONS ---
// 1. Go to console.firebase.google.com and create a project
// 2. Enable Authentication (Anonymous + Google), Firestore, and Realtime Database
// 3. Register a Web App in the project settings
// 4. Copy the config object below and replace the placeholder values
// 5. Set ENABLE_FIREBASE to true

// Firebase config is sourced from Vite env vars (prefix with VITE_ in `.env` files)
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "SENDER_ID",
  appId: env.VITE_FIREBASE_APP_ID || "APP_ID"
};

// Toggle via `.env` file: VITE_ENABLE_FIREBASE=true
const ENABLE_FIREBASE = (env.VITE_ENABLE_FIREBASE === 'true');

// Export initialized instances (or null if disabled)
export let app: any = null;
export let db: any = null;
export let auth: any = null;
export let rtdb: any = null;
export let isFirebaseEnabled = false;

if (ENABLE_FIREBASE && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    rtdb = getDatabase(app);
    isFirebaseEnabled = true;

    // Connect to local emulators if requested (useful for dev/testing)
    if (env.VITE_FIREBASE_USE_EMULATORS === 'true') {
      try {
        const host = env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
        const firestorePort = Number(env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT || 8080);
        const authPort = Number(env.VITE_FIREBASE_EMULATOR_AUTH_PORT || 9099);
        const rtdbPort = Number(env.VITE_FIREBASE_EMULATOR_DATABASE_PORT || 9000);

        connectFirestoreEmulator(db, host, firestorePort);
        if (auth) connectAuthEmulator(auth, `http://${host}:${authPort}`);
        connectDatabaseEmulator(rtdb, host, rtdbPort);
        console.log("Connected Firebase SDK to local emulators");
      } catch (emError) {
        console.warn("Could not connect to Firebase emulators:", emError);
      }
    }

    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
    // console.log("Firebase is disabled. App running in offline demo mode.");
}
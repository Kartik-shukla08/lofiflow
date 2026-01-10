<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lofi Flow — Run & Deploy

Lofi Flow is a lightweight web app for focus and relaxation. Users can switch themes, play pre-added lofi tracks, add tracks via YouTube URL, create rooms to invite others for chat, and use productivity helpers like a Pomodoro timer and a to-do list.

## Features
- Theme customization and ambience backgrounds
- Persistent or ad-hoc music playback (add by YouTube URL)
- Chat rooms (requires Firebase to enable real-time rooms and messages)
- Pomodoro timer and task list for productivity
- Simple, responsive UI built with React + Vite

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Optional) If you want real-time chat/rooms, configure Firebase and enable services (Auth, Firestore or Realtime DB) or use the local emulator workflow (recommended):
   - Use emulator workflow: `cp .env.local.sample .env.local` and leave values as-is for emulator use
   - OR: Create a Firebase project and register a web app and copy the web config into `.env.local` (see `.env.example`) and set `VITE_ENABLE_FIREBASE=true`
3. Create a `.env.local` from `.env.example` or `.env.local.sample` and fill required values. Do NOT commit secrets.
4. Run the app locally:
   `npm run dev`

Tip: Vite exposes `VITE_*` variables to the client as `import.meta.env.VITE_*`. Firebase config values are safe to be client-side; do not store private keys or secrets in client-visible env vars.

---

## Firebase Backend Setup (optional)

If you want real-time chat rooms and persistence, use Firebase for Auth and Firestore/Realtime Database. Here are steps to configure and run locally (emulator workflow recommended):

### Quick Firebase credentials (what you need)
- Create a Firebase Web App and copy these web config values into your `.env.local` (or `.env`) file as VITE_* variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Also set `VITE_ENABLE_FIREBASE=true` to enable Firebase in the app.
- For local development, prefer using the Firebase Emulator Suite and set `VITE_FIREBASE_USE_EMULATORS=true`.

1. Emulator workflow (recommended for development/testing):
   - Copy the emulator sample file: `cp .env.local.sample .env.local` and edit if needed
   - Start the Firebase emulator suite: `npm run emulators` (auth, firestore, database, hosting)
- Seed the emulator with sample rooms/messages: `SEED_SAMPLE_ROOMS=true npm run seed:firebase` (seeds rooms + messages into the emulator Firestore). By default seeding is skipped to allow fresh testing.
- Start the dev server: `npm run dev` and open the app. Use the chat widget to create a room or join by invite code.

2. Production Firebase project (use only when ready):
   - Create a Firebase project at https://console.firebase.google.com and register a Web App.
   - Enable Authentication (Anonymous and/or Google sign-in) and Firestore or Realtime Database.
   - Copy the Firebase web config values into `.env.local` (see `.env.example`) and set `VITE_ENABLE_FIREBASE=true`.
   - Start the dev server: `npm run dev`.

3. To deploy hosting to Firebase (optional):
   - Run `npm run build` then `npm run deploy:firebase`.

Notes:
- The app uses **anonymous sign-in** for simple chat usage when Firebase is enabled.
- Seed script uses the Firebase Admin SDK and is intended to be run against the local Firestore emulator (ensure `FIRESTORE_EMULATOR_HOST` is set or emulators are running when calling `npm run seed:firebase`).
- Emulators are useful for local integration tests and development without touching production data.

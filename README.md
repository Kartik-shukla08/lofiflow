# Focus Flow — Technical README

> A lightweight, collaborative productivity-focused web application for managing focused work sessions, optional synchronized audio sessions, real-time chat, and essential productivity tools.

---

## Table of contents
- [Project Overview](#project-overview) ✅
- [Key Features](#key-features) ✨
- [Architecture & Tech Stack](#architecture--tech-stack) 🔧
- [Local Development](#local-development) ▶️
- [Firebase Integration (Optional)](#firebase-integration-optional) 🔁
- [Build & Deployment](#build--deployment) 🚀
- [Testing & Seed Data](#testing--seed-data) 🧪
- [Contributing](#contributing) 🤝
- [License & Contact](#license--contact) 📄

---

## Project Overview
Focus Flow is a client-first React application (Vite) designed for managing focused work sessions and collaborative session synchronization. The app provides:

- Persistent focus sessions and optional audio playlists (YouTube-sourced tracks),
- Real-time chat rooms with opt-in synchronized sessions,
- Productivity helpers: Pomodoro timer, persistent to-do list, and session tracking.

The codebase prioritizes simplicity, local-first development, and optional Firebase-backed real-time collaboration.

---

## Key Features
- **Theming & Ambience**: Switchable UI themes and background ambience assets.
- **Focus Sessions & Audio**: Create focused sessions that optionally include audio playlists (YouTube-sourced), session duration, and shared state.
- **Chat Rooms**: Create and join rooms (real-time messaging via Firestore/Realtime DB when enabled).
- **Collaborative Sessions (Planned / Optional)**: Session state (playlist, current item, elapsed time) can be synchronized across room participants (opt-in per-user).
- **Productivity Tools**: Pomodoro timer, persistent to-do list, session metrics, and lightweight session tracking.

---

## Architecture & Tech Stack
- Framework: React 18 + Vite
- State Management: Zustand
- Media: YouTube-based playback (via `react-youtube-music-player`) and `react-player` utilities
- Realtime Backend (optional): Firebase Auth + Firestore or Realtime Database
- Styling: Tailwind-like utility classes / CSS modules

Design principles:
- Local-first UX with optional Firebase sync for shared features.
- Minimal client surface area — no server API required for core features unless Firebase is enabled.

---

## Local Development
Prerequisites
- Node.js (18+) recommended
- npm (or Yarn/pnpm)

Quick start
1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file (optional for Firebase features):

   ```bash
   cp .env.local.sample .env.local
   ```

3. Development server:

   ```bash
   npm run dev
   ```

Notes
- The client reads runtime config from `import.meta.env.VITE_*` variables.
- The app is usable without Firebase for single-user/local sessions. Enable Firebase only if you need realtime chat/room sync.

---

## Firebase Integration (Optional)
When enabled, Firebase provides:
- Anonymous Authentication (default)
- Real-time rooms and messages (Firestore or Realtime DB)

Required environment variables (set in `.env.local`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ENABLE_FIREBASE=true` to enable Firebase features
- `VITE_FIREBASE_USE_EMULATORS=true` (recommended for local testing)

Emulator workflow (recommended):

1. Start the Firebase emulators (Auth, Firestore, Database, Hosting):

   ```bash
   npm run emulators
   ```

2. Optional: seed emulator with sample rooms + messages:

   ```bash
   SEED_SAMPLE_ROOMS=true npm run seed:firebase
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

Security & production notes
- Firebase web config is safe for client-side use, but avoid committing private or unrelated credentials.
- Use Firestore rules or Realtime DB rules to restrict access in production.

---

## Build & Deployment
Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Deploy to Firebase Hosting (if configured):

```bash
npm run deploy:firebase
```

You can also deploy to other static hosting solutions (Netlify, Vercel) using the built `dist/` output.

---

## Testing & Seed Data
- Run the Firebase emulator for integration scenarios.
- The `scripts/seed-firebase.cjs` script can populate demo rooms and messages for local testing.
- Consider adding automated integration tests that mock Firestore or use the emulator for end-to-end flows.

---

## Contributing
- Fork the repository and open pull requests for feature work or bug fixes.
- Keep changes small, document rationale in PR descriptions, and include tests where feasible.
- If adding Firebase-dependent features, include clear instructions for local emulator testing in the PR description.

---

## License & Contact
- Licensed under the MIT License (see `LICENSE` if present).
- For questions or contributions: open an issue or submit a pull request.

---

If you'd like, I can add additional sections (API documentation, architecture diagrams, CI/CD steps, or a developer onboarding checklist).

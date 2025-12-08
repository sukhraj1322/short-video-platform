# ShortlyX — Viva Cheat-Sheet

Quick summary
- Project: Short video platform (React + Vite + TypeScript)
- Purpose: Demo client-side auth, video upload (Cloudinary or local demo), persistence via IndexedDB, activity logs, and PDF export.

Files to show during viva
- Auth: `src/utils/auth.ts`, `src/context/AuthContext.tsx`
- Upload: `src/pages/Upload.tsx`, `src/utils/cloudinary.ts`
- Storage: `src/utils/idb.ts`
- Logs/PDF: `src/pages/Logs.tsx`
- OTP UI: `src/components/ui/input-otp.tsx`

Stack & libraries (one-line each)
- React + TypeScript: UI and typed components.
- Vite: dev server + bundler.
- Tailwind CSS & tailwindcss-animate: styling and utility animations.
- idb: wrapper over IndexedDB for persistent storage (users, videos, blobs, logs, session).
- bcryptjs: client-side password hashing for demo.
- framer-motion: UI animations.
- lucide-react: icons.
- jspdf: client PDF generation for logs export.
- react-router-dom: routing.
- input-otp: OTP input UI component (UI only).

Key flows — short explanations you can say

1) Signup
- UI calls `signup(username,email,password)` in `src/utils/auth.ts`.
- Checks username uniqueness via `getUserByUsername()` (IndexedDB index).
- Password hashed with `bcryptjs`.
- User saved to `users` store in IndexedDB; `addLog` records signup event.

2) Login & session
- `login()` compares plaintext password with stored hash using `bcryptjs.compare()`.
- On success `saveSession(user.id)` writes session record to `session` object store.
- `AuthProvider` initializes auth state by reading the session and `getCurrentUser()`.

3) Upload (demo vs production)
- Demo: `cloudinary.ts` uses `mockUpload()` which simulates progress, creates a thumbnail by drawing a frame from a hidden `<video>` into a `<canvas>`, saves the video `File` into `videoBlobs` IndexedDB store, and returns a `local://<publicId>` stable URL.
- Production: uses unsigned Cloudinary upload preset via XHR `FormData`; progress uses XHR `upload.progress`.
- Metadata (caption, tags, thumbnail, url) is saved to `videos` store.

4) Storage
- `shortlyx-db` (IndexedDB) object stores:
  - `users` (keyPath `id`, indexed by username & email)
  - `videos` (metadata)
  - `videoBlobs` (raw Blobs for demo videos)
  - `logs` (activity logs)
  - `settings`, `session`
- Why: persistent client demo/offline-capable behavior without a backend.

5) Logs & PDF export
- `addLog()` saves log entries with `id` + `timestamp`.
- `Logs.tsx` reads logs with `getAllLogs()` and uses `jsPDF` to create and download a PDF (`shortlyx-logs.pdf`).
- Demonstration: press "Download PDF" in Logs page to trigger the file download.

6) 2FA (current state & how to explain)
- Current project: includes an OTP input UI component (`input-otp.tsx`) but **no server-side 2FA verification**.
- Explain this honestly: UI is ready; full 2FA requires server endpoints to generate/verify codes (email/SMS OTP or TOTP with a library like `speakeasy`).
- Implementation ideas: server generates code or TOTP secret, send code via email/SMS or show QR for authenticator apps, then verify server-side on login.

Security notes (short answers)
- Client-side hashing helps avoid plain-text storage but is not a substitute for server-side auth and secure session handling.
- Sessions stored in IndexedDB are client-only — for production use secure, HTTP-only cookies or server-validated JWTs.
- Don't put Cloudinary secrets in front-end; use unsigned preset or a backend-signed upload endpoint.

Demo walkthrough (order to show during viva)
1. `npm install` then `npm run dev` (show the running site at http://localhost:5173).
2. Show `Signup`: create account, then open DevTools → Application → IndexedDB → `shortlyx-db` → `users` to show the user record.
3. `Login`: show `session` in IndexedDB and `logs` entry for login.
4. `Upload`: drop a small video, add caption → upload. Show progress, then open `videos` and `videoBlobs` stores to show saved metadata + blob.
5. `Feed/Watch`: play the uploaded video (demonstrates `local://` blob resolution).
6. `Logs`: show recent logs and press "Download PDF" to demonstrate `shortlyx-logs.pdf`.

Common viva questions & suggested short answers
- Q: Why IndexedDB? — A: Client-side persistent storage good for structured records and binary blobs, enables demo/offline.
- Q: How is thumbnail created? — A: Video loaded into `<video>`, seek to a frame, draw to `<canvas>` and export JPEG data URL.
- Q: Is this production-ready? — A: UI is, but production requires a backend for secure auth, server-side hashing, session management, and proper media CDN.
- Q: How to add 2FA? — A: Implement server endpoints to issue & verify OTPs or TOTP secrets; use `input-otp` UI for entry.

Quick commands
```powershell
# install & run
npm install
npm run dev
```

Need more? I can:
- Generate a one-page PDF from this MD and add it to the repo (attempting now).
- Create a short slide-style PDF or a printable 2-column cheat-sheet.
- Prepare a short script with exact phrases to say for each demo step.

Good luck on your viva! Practice the demo flow once or twice and keep DevTools > IndexedDB open so you can quickly show stored records.
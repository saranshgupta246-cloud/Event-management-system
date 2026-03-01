# MITS Event Management System

## Running locally

1. **Start MongoDB** (default: `mongodb://localhost:27017`).

2. **Backend** (from project root):
   - `cd backend`
   - Copy `backend/.env.example` to `backend/.env` and fill in:
     - **Required:** `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
     - **For Google login:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from Firebase Console > Project Settings > Service accounts)
     - Optional: `ADMIN_EMAIL` (this email becomes admin on first Google sign-in), `PORT`, `JWT_EXPIRES_IN`
   - `npm install` then `npm run dev` (or `node server.js`)
   - Confirm: `GET http://localhost:5000/health` returns `{ "success": true, "message": "EMS API running" }`

3. **Frontend** (from project root):
   - Copy `.env.example` to `.env` if needed. Set `VITE_API_URL=http://localhost:5000` if the API runs elsewhere.
   - Ensure Firebase client vars (`VITE_FIREBASE_*`) are set for the login page.
   - `npm install` then `npm run dev`
   - Open `http://localhost:5173/login` and use “Continue with Google” to sign in.

Run order: MongoDB → backend → frontend.

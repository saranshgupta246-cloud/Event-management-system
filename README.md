# MITS EMS

**Event Management System** for MITS Gwalior — clubs, events, registrations, recruitment, certificates, chat, and admin tools.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Features

- **Clubs** — directory, membership, invites, faculty coordinator workflows  
- **Events** — solo / duo / squad registration, fees, UTR, seat limits  
- **Recruitment** — drives, custom application forms, application review  
- **Certificates** — templates, generation, student download, public verify  
- **Attendance** — QR scan and manual mark (stored on registrations)  
- **Chat** — event-scoped messages + Socket.IO realtime  
- **Notifications** — broadcast + per-user inbox  
- **Audit logs** — admin visibility into important actions  
- **Roles** — students, faculty, coordinators, admins  

---

## 🛠 Tech Stack

| Frontend | Backend |
|----------|---------|
| React, Vite, React Router, Axios, Tailwind CSS, Framer Motion, Socket.IO client, DnD Kit, QR libraries | Express, Mongoose, Socket.IO, JWT, Passport (Google OAuth), Cloudinary, Multer, Helmet, Zod, Nodemailer, Puppeteer / PDF tooling |

---

## 📁 Project Structure

```
EMS Frontend/
├── backend/          # API, models, routes, middleware, scripts
├── src/              # React app (pages, components, hooks, layouts)
├── public/           # Static assets
└── dist/             # Production build (npm run build)
```

---

## 🚀 Getting Started

**Prerequisites:** Node.js (LTS), MongoDB running locally or Atlas URI, npm.

**Backend**

```bash
cd backend
cp .env.example .env
# Edit .env — see Environment Variables
npm install
npm run dev
```

**Frontend** (repo root)

```bash
cp .env.example .env
# Set VITE_API_URL and VITE_API_BASE_URL
npm install
npm run dev
```

Run order: **MongoDB → backend → frontend** (API default `http://localhost:5000`, Vite `http://localhost:5173`).

---

## 🔑 Environment Variables

**Backend** (most critical)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Database connection |
| `JWT_SECRET` | Sign session tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `15d`) |
| `CLIENT_URL` | Frontend URL (OAuth + CORS) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google login (set in `.env`; see `backend/config/passport.js`) |
| `PORT` | API port (optional, default 5000) |

**Frontend**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base with `/api` |
| `VITE_API_BASE_URL` | API origin for Socket.IO |

---

## 🗄 Migration Scripts

- **`npm run add-slugs`** — backfill missing `slug` on clubs  
- **`npm run add-event-slugs`** — backfill missing `slug` on events  
- **`npm run migrate-event-fees`** — legacy fee → multi-type fees (backup DB first)  

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Student** | Events, registrations, recruitment apply, chat, certificates, profile |
| **Faculty** | Student-area routes where allowed |
| **Faculty coordinator** | Club/team/recruitment management (`/leader` UI + `/api/coordinator`, `/api/leader`) |
| **Admin** | Full admin panel, users, audit, elevated certificate/notification actions |

---

## 📝 Notes

- **Deploy:** `NODE_ENV=production`, `npm run build`, serve `dist/`; use MongoDB Atlas + set `CLIENT_URL` in CORS; Cloudinary for uploads where used.  
- **Security:** Remove or lock `/api/debug/*` in production; tighten admin routes if still using permissive `protect`-only middleware.  
- **TODO:** Team attendance grouped UI; real data for leader events list placeholder.  

---

Built for MITS Gwalior 🎓

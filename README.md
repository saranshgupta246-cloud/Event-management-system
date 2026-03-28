# MITS EMS — Event Management System

Web application for **MITS** (branded in-app as *MITS Event Management System*). The backend restricts Google sign-in to the college domain **`@mitsgwl.ac.in`** (see [`backend/config/passport.js`](backend/config/passport.js)). Default email branding uses `mits.ac.in` in sample config (see [`backend/.env.example`](backend/.env.example)).

The system supports **clubs**, **events**, **registrations** (solo/duo/squad), **recruitment drives** with applications, **certificates**, **attendance** (QR/manual on registrations), **event chat** (REST + Socket.IO), **notifications** (broadcast + per-user), **audit logs**, and **admin/coordinator** workflows.

---

## Tech stack

### Frontend ([`package.json`](package.json))

| Package | Version |
|--------|---------|
| react / react-dom | ^18.2.0 |
| react-router-dom | ^6.28.0 |
| vite | ^5.0.0 |
| @vitejs/plugin-react | ^4.0.0 |
| tailwindcss | ^3.4.1 |
| axios | ^1.13.5 |
| socket.io-client | ^4.8.3 |
| framer-motion | ^12.34.0 |
| lucide-react | ^0.564.0 |
| @dnd-kit/* | ^6.3.1 / ^10.0.0 / ^3.2.2 |
| @yudiel/react-qr-scanner | ^2.5.1 |
| qrcode.react | ^4.2.0 |
| react-hot-toast | ^2.6.0 |
| canvas-confetti | ^1.9.4 |
| passport / passport-google-oauth20 | ^0.7.0 / ^2.0.0 |

### Backend ([`backend/package.json`](backend/package.json))

| Package | Version |
|--------|---------|
| express | ^4.18.2 |
| mongoose | ^8.0.3 |
| socket.io | ^4.8.3 |
| jsonwebtoken | ^9.0.2 |
| bcryptjs | ^3.0.3 |
| cloudinary | ^2.9.0 |
| multer | ^2.1.0 |
| helmet | ^8.1.0 |
| cors | ^2.8.5 |
| compression | ^1.8.1 |
| express-rate-limit | ^7.1.5 |
| zod | ^3.22.4 |
| nodemailer | ^8.0.1 |
| puppeteer / pdf-lib / @napi-rs/canvas / sharp / qrcode | PDF/image certificate pipeline |
| json2csv | CSV export |
| dotenv | ^16.3.1 |

**Database:** MongoDB (URI in env; default in code `mongodb://localhost:27017/mits_clubs`). **Auth:** JWT (`JWT_SECRET`) + Google OAuth 2.0 via Passport ([`backend/config/passport.js`](backend/config/passport.js)); additional Firebase-related CSP entries in [`backend/server.js`](backend/server.js). **Realtime:** Socket.IO (chat). **Media:** Cloudinary (uploads referenced in profile/certificate flows; local [`backend/uploads`](backend/uploads) served at `/uploads` when used).

---

## Features (from models + routes)

| Area | What exists in codebase |
|------|-------------------------|
| **Users** | [`User`](backend/models/User.js) — roles `student`, `faculty`, `faculty_coordinator`, `admin` |
| **Clubs** | [`Club`](backend/models/Club.js), [`ClubMember`](backend/models/ClubMember.js), [`Membership`](backend/models/Membership.js) — membership, invites ([`JoinInvite`](backend/models/JoinInvite.js)) |
| **Events** | [`Event`](backend/models/Event.js) — registration types, fees, team size, slugs |
| **Registrations** | [`Registration`](backend/models/Registration.js) — solo/duo/squad, team name, teammates, UTR, QR token, attendance fields on document |
| **Recruitment** | [`RecruitmentDrive`](backend/models/RecruitmentDrive.js), [`Application`](backend/models/Application.js) — drives + applications |
| **Certificates** | [`Certificate`](backend/models/Certificate.js), [`CertificateTemplate`](backend/models/CertificateTemplate.js) — generation, verification |
| **Attendance** | Implemented via `Registration` attendance fields; API under [`/api/attendance`](backend/routes/attendanceRoutes.js) |
| **Chat** | [`ChatMessage`](backend/models/ChatMessage.js) — REST + Socket.IO `chat:join` / `chat:send` |
| **Notifications** | [`Notification`](backend/models/Notification.js), [`NotificationRead`](backend/models/NotificationRead.js), [`UserNotification`](backend/models/UserNotification.js) |
| **Audit** | [`AuditLog`](backend/models/AuditLog.js), [`RoleChangeLog`](backend/models/RoleChangeLog.js) |
| **Other** | [`EmailLog`](backend/models/EmailLog.js) |

---

## Project structure (top two levels)

| Path | Purpose |
|------|---------|
| [`backend/`](backend/) | Express API, Socket.IO, Mongoose models |
| [`backend/config/`](backend/config/) | Passport Google strategy |
| [`backend/controllers/`](backend/controllers/) | Route handlers |
| [`backend/middleware/`](backend/middleware/) | Auth, validation, cache |
| [`backend/models/`](backend/models/) | Mongoose schemas |
| [`backend/routes/`](backend/routes/) | Express routers |
| [`backend/scripts/`](backend/scripts/) | One-off migrations / slug backfills |
| [`backend/utils/`](backend/utils/) | Helpers (slug, email, certificates, etc.) |
| [`backend/uploads/`](backend/uploads/) | Local static uploads (optional) |
| [`src/`](src/) | React SPA (Vite) |
| [`src/pages/`](src/pages/) | Route pages (admin, student, leader) |
| [`src/components/`](src/components/) | UI components |
| [`src/layouts/`](src/layouts/) | App shells |
| [`src/hooks/`](src/hooks/) | Data hooks |
| [`src/context/`](src/context/) | React context |
| [`src/api/`](src/api/) | API client |
| [`public/`](public/) | Static assets |
| [`dist/`](dist/) | Production build output (`npm run build`) |

---

## Prerequisites

- **Node.js:** No `engines` field in `package.json`; use a current Node LTS compatible with Vite 5 and Mongoose 8.
- **MongoDB:** Running instance (local or Atlas); connection string via `MONGODB_URI`.
- **npm** (or compatible client) for dependencies.

---

## Installation and setup

**Order:** start MongoDB → backend → frontend.

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, CLIENT_URL, and all other keys (see Environment variables).
npm install
npm run dev
```

Default API port: **5000** (`PORT` in env or fallback in [`backend/server.js`](backend/server.js)).

### Frontend (repository root)

```bash
cp .env.example .env
# Set VITE_API_URL and VITE_API_BASE_URL to match your backend (see Environment variables).
npm install
npm run dev
```

Vite dev server default: **http://localhost:5173** (referenced in CORS in [`backend/server.js`](backend/server.js)).

---

## Environment variables

### Backend ([`backend/.env.example`](backend/.env.example))

| Variable | Description | Required for |
|----------|-------------|--------------|
| `PORT` | HTTP port | Optional (default 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `15d`) | Yes |
| `NODE_ENV` | `development` / `production` | Recommended |
| `SMTP_HOST` | SMTP host | Email |
| `SMTP_PORT` | SMTP port | Email |
| `SMTP_SECURE` | TLS | Email |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials | Email |
| `FROM_EMAIL` | Sender address | Email |
| `FROM_NAME` | Sender display name | Email |
| `CLIENT_URL` | Frontend origin (OAuth redirect, CORS) | Yes |
| `ADMIN_EMAIL` | Admin reference email | Config |
| `FIREBASE_PROJECT_ID` | Firebase Admin project | Firebase-related flows |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Firebase |
| `FIREBASE_PRIVATE_KEY` | Service account key | Firebase |

**Not in `.env.example` but required by [`backend/config/passport.js`](backend/config/passport.js) for Google login:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.

### Frontend ([`.env.example`](.env.example))

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Axios base URL including `/api` (e.g. `http://localhost:5000/api`) |
| `VITE_API_BASE_URL` | Backend origin without `/api` (e.g. `http://localhost:5000`) for Socket.IO |

---

## Database / migration scripts ([`backend/scripts/`](backend/scripts/))

| Script | npm script | Purpose |
|--------|------------|---------|
| [`addSlugs.js`](backend/scripts/addSlugs.js) | `npm run add-slugs` | Backfill missing `slug` on `Club` documents |
| [`addEventSlugs.js`](backend/scripts/addEventSlugs.js) | `npm run add-event-slugs` | Backfill missing `slug` on `Event` documents |
| [`migrateEventFees.js`](backend/scripts/migrateEventFees.js) | `npm run migrate-event-fees` | Migrate legacy `registrationFee` to multi-type fees; update registrations (see file header — **backup DB first**) |
| [`migrateRoles.js`](backend/scripts/migrateRoles.js) | (run with `node scripts/migrateRoles.js`) | Migrate `club_leader` → `faculty_coordinator`, `clubId` → `clubIds`, etc. |

Backend also has [`backend/seed.js`](backend/seed.js) via `npm run seed` ([`backend/package.json`](backend/package.json)).

---

## API overview (grouped by mount)

Base path: **`/api`** (unless noted). Health: **`GET /health`**. Google OAuth: **`GET /api/auth/google`**, **`GET /api/auth/google/callback`**. **`GET /api/auth/me`** (JWT) is registered before DB middleware in [`server.js`](backend/server.js).

| Domain | Base / pattern | Example endpoints |
|--------|----------------|-------------------|
| **Public** | `/api/public` | `GET /stats`, `GET /events` |
| **Auth** | `/api/auth` | `GET /me` (with `protect`) |
| **Clubs** | `/api/clubs` | `GET /`, `GET /by-slug/:slug`, `POST /:clubId/events`, `GET /:clubId/drives/...` (nested drives) |
| **Admin** | `/api/admin` | Dashboard overview, clubs CRUD, events CRUD, uploads — see [`adminRoutes.js`](backend/routes/adminRoutes.js) (**note:** router uses `protect` only; some routes use `authorize("admin")` for sensitive actions) |
| **Admin students** | `/api/admin/students` | `GET /`, `GET /:id`, `PUT /:id` |
| **Coordinator** | `/api/coordinator` | Faculty coordinator club/member routes ([`coordinatorRoutes.js`](backend/routes/coordinatorRoutes.js)) |
| **Leader** | `/api/leader` | Same family of coordinator club routes for `faculty_coordinator` + `admin` ([`leaderRoutes.js`](backend/routes/leaderRoutes.js)) |
| **Registrations** | `/api/registrations` | `POST /`, `GET /my`, `POST /:id/cancel`, staff: participants/export/remove |
| **Student events** | `/api/events` | `GET /`, `GET /:id` |
| **Attendance** | `/api/attendance` | `GET /event/:eventId`, `POST /scan`, `PUT /manual/:registrationId`, `GET /export/:eventId` |
| **Profile** | `/api/profile` | `GET /me`, `PUT /me`, `POST /avatar` |
| **Notifications** | `/api/notifications` | List, read, create (prod: admin/club_leader), admin delete/deactivate |
| **User notifications** | `/api/user-notifications` | In-app user notification inbox |
| **Chat** | `/api/chat` | `GET/POST /:eventId`, participants, settings |
| **Drives (recruitment)** | `/api/drives` | `GET /` (global listing), `POST /:driveId/apply`, club-scoped drives under `/api/clubs/:clubId/drives` |
| **Applications** | `/api/...` | `GET /my-applications`, `/applications/:id`, status/email/rating (see [`applicationsRoutes.js`](backend/routes/applicationsRoutes.js)) |
| **Certificates** | `/api/certificates` | Public `GET /verify/:verificationId`, student `GET /my`, admin/leader generation and templates |
| **Audit** | `/api/audit` | `GET /`, `GET /stats` (admin) |

**Debug (development):** `GET /api/debug/user/:email`, `POST /api/debug/set-role` in [`server.js`](backend/server.js) — remove or protect in production.

---

## User roles and access

**Global roles** ([`User.role`](backend/models/User.js)): `student`, `faculty`, `faculty_coordinator`, `admin`.

- **Student:** Default; student routes, apply to drives, registrations, chat when allowed, certificates, profile.
- **Faculty:** Included in student layout in [`App.jsx`](src/App.jsx); broader than pure student where routes allow `faculty`.
- **Faculty coordinator:** Club-scoped management via [`/api/coordinator`](backend/routes/coordinatorRoutes.js) and [`/api/leader`](backend/routes/leaderRoutes.js) (with `admin`); frontend **Leader** UI at `/leader/*` ([`App.jsx`](src/App.jsx)).
- **Admin:** Full admin UI `/admin/*`; [`adminStudentRoutes`](backend/routes/adminStudentRoutes.js), audit, many certificate/notification actions.

**Club roles** ([`ClubMember`](backend/models/ClubMember.js) / [`Membership`](backend/models/Membership.js)): President, Secretary, Treasurer, Core Member, Volunteer, Member, Faculty Coordinator — used for club/event/recruitment permissions via middleware (`requireClubAccess`, `requireCoordinatorOnly`, etc.).

**Legacy:** Routes and controllers still reference **`club_leader`** in places ([`attendanceRoutes`](backend/routes/attendanceRoutes.js), certificates, notifications). [`migrateRoles.js`](backend/scripts/migrateRoles.js) migrates DB role `club_leader` → `faculty_coordinator`. **`User` schema enum does not list `club_leader`** — align data and code when tightening security.

---

## Deployment notes

- **MongoDB:** Use Atlas or managed MongoDB; set `MONGODB_URI`.
- **Cloudinary:** Used for image uploads in profile/certificate paths (per dependencies and controllers).
- **Production:** Set `NODE_ENV=production` (affects rate limits, notification creation rules in [`notificationRoutes.js`](backend/routes/notificationRoutes.js), etc.).
- **Frontend:** `npm run build` → static output in [`dist/`](dist/). Serve `dist/` from any static host or reverse proxy to Node.
- **CORS:** Add production `CLIENT_URL` to allowed origins in [`server.js`](backend/server.js) (currently `localhost:5173` + `process.env.CLIENT_URL`).
- **Security:** Remove or lock down `/api/debug/*` and re-enable strict `authorize("admin")` on [`adminRoutes`](backend/routes/adminRoutes.js) if the temporary `protect`-only middleware is still in place.

---

## Known limitations / TODO

- **Team attendance UI:** Grouped-by-team list and per-member “mark all present” were discussed in product notes; current attendance is stored on [`Registration`](backend/models/Registration.js) with API returning one row per registration in [`getEventAttendance`](backend/controllers/attendanceController.js) — full grouped UX not described as implemented here.
- **In-repo TODO:** [`src/pages/leader/LeaderEvents.jsx`](src/pages/leader/LeaderEvents.jsx) — `// TODO: Replace this placeholder list with real leader events data.`
- **Admin routes:** [`adminRoutes.js`](backend/routes/adminRoutes.js) documents temporary open access (`protect` only) — revert to `authorize("admin")` for production hardening.

---

## Frontend routes (summary)

See [`src/App.jsx`](src/App.jsx): public (`/login`, `/auth/callback`, `/clubs`, …), **`/student/*`** (dashboard, events, recruitment, chat, certificates, …), **`/leader/*`** (coordinator + admin), **`/admin/*`** (admin-only). Placeholder pages: e.g. `/student/attendance`, `/admin/analytics`, `/admin/settings` show “Coming soon.”

---

*Generated from repository structure and source files. Update dates and deployment URLs to match your environment.*

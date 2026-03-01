# EMS Backend

Node.js + Express + MongoDB API for Event Management System (clubs, members, roles).

## Setup

1. Copy `env.example.txt` to `.env` and set:
   - `MONGODB_URI` (e.g. `mongodb://localhost:27017/ems`)
   - `JWT_SECRET`
   - `PORT` (default 5000)

2. Install and run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## API

- **Public:** `GET /api/clubs` (list, query: category, search, recruiting), `GET /api/clubs/:slug`
- **Student (auth):** `POST /api/clubs/:id/join`, `DELETE /api/clubs/:id/leave`
- **Admin (auth + role):** `POST /api/admin/clubs`, `PUT /api/admin/clubs/:id`, `DELETE /api/admin/clubs/:id`, `PUT /api/admin/clubs/:id/assign-leader`
- **Leader (auth + role):** `GET /api/leader/club`, `PUT /api/leader/members/:membershipId/approve`, `DELETE /api/leader/members/:membershipId`, `PUT /api/leader/club/recruitment`

Auth: `Authorization: Bearer <JWT>`.

# TaskFlow — Team Task Manager

A full-stack task manager where users manage personal tasks and collaborate in teams on a
Kanban board — with priorities, assignment, in-app notifications and live progress tracking.

**Stack:** Next.js 16 (App Router, TypeScript) · Express · MongoDB (Mongoose) · Tailwind CSS + shadcn/ui

---

## Features

- **Auth** — sign up / log in / log out. Passwords hashed with bcrypt; session is a JWT in an **httpOnly cookie**. Login is rate limited.
- **Forgot password** — enter your email → if the account exists you set a new password (one-time token, valid 15 min, stored hashed) and are logged in.
- **Personal tasks** — title, description, priority (Low / Medium / High), status (To Do / In Progress / Done), due date. Search + filters. One-click complete.
- **Teams** — create a team (you become the owner), invite members by email, remove members.
- **Kanban board** — each team has a 3-column board with **drag & drop** (mouse, touch and keyboard). Moves are optimistic and roll back with an error toast if the API fails.
- **Assignment** — assign team tasks to members. Only members can be assigned.
- **Notifications** — bell with unread count when you are assigned a task, added to a team, or a task you created is completed. Mark one / all as read.
- **Browser alerts with sound** — when a new notification arrives you hear a short "ding" and get a pop-up (a toast in the app, or a system notification when you're in another tab or app). One "you have N pending tasks" alert per session, plus the unread count in the tab title. Works in desktop and mobile browsers via a service worker (Android Chrome; iPhone after *Add to Home Screen*). Enable it in **Settings** or from the bell.
- **Progress** — team progress bar (% done), counts per status, and per-member done/assigned. Dashboard shows your stats, overdue count and a "focus" list.
- **UX** — modern responsive UI, dark/light mode, skeleton loaders, button spinners, toast messages for every action, inline validation errors (client and server), empty states.

### Permissions

| Action | Who |
|---|---|
| See / move tasks on a team board | Any team member |
| Edit details / delete a team task | Task creator or team owner |
| Add / remove members, rename / delete team | Team owner |
| Personal tasks | Only their creator |

Non-members get **404** (the API never reveals that a team or task exists).

---

## Getting started

Requirements: **Node.js 20+**.

### 1. API (Express)

```bash
cd server
npm install
cp .env.example .env      # then set MONGO_URI and JWT_SECRET
npm run dev               # http://localhost:5000
```

**No MongoDB?** Run `npm run dev:memory` instead. It starts a local MongoDB automatically (no
install needed) and saves the data in `server/.data/`, so accounts and tasks survive restarts.
Run `FRESH_DB=1 npm run dev:memory` (or delete that folder) to start from an empty database.

To use MongoDB Atlas (free): create a cluster → *Connect* → *Drivers* → copy the
`mongodb+srv://...` string into `MONGO_URI` (add a database name, e.g. `/taskflow`).

### 2. Web app (Next.js)

```bash
cd client
npm install
npm run dev               # http://localhost:3000
```

The Next.js app proxies every `/api/*` request to the Express server (`next.config.ts`), so
the browser talks to a single origin. If the API runs elsewhere, set `API_URL` (see
`client/.env.example`).

### Tests

```bash
cd server
npm test                  # 46 API integration tests (in-memory MongoDB, no setup needed)
```

---

## Try it (2-minute demo)

1. Register **User A**, then open a private window and register **User B**.
2. As A: **Teams → New team**, open it, click the members button and add B's email.
3. As A: **Add task**, assign it to B, priority *High*.
4. As B: the bell shows 2 notifications (added to team, task assigned).
5. As B: drag the card to **Done** → progress bar updates; A gets a "completed" notification.
6. As B: open the card — details are read-only (only the creator/owner can edit), status can still change.

---

## API

All endpoints are under `/api`. Success: `{ data }`. Error: `{ message, errors? }` (`errors` maps field → message).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account, sets cookie |
| POST | `/auth/login` | Log in (rate limited) |
| POST | `/auth/logout` | Clear cookie |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` | `{ email }` → one-time reset token (404 if no account) |
| POST | `/auth/reset-password` | `{ token, password }` → new password, logs in |
| GET | `/tasks` | `?team=<id>\|personal&status&priority&assignee=<id>\|me&search` |
| POST | `/tasks` | Create task |
| GET / PATCH / DELETE | `/tasks/:id` | Read / edit / delete |
| PATCH | `/tasks/:id/move` | `{ status, order }` — board drag & drop |
| GET / POST | `/teams` | My teams (with task counts) / create |
| GET / PATCH / DELETE | `/teams/:id` | Read / rename / delete (owner) |
| GET | `/teams/:id/progress` | Totals, % done, per-member stats |
| POST | `/teams/:id/members` | Add member by email (owner) |
| DELETE | `/teams/:id/members/:userId` | Remove member (owner) |
| GET | `/notifications` | Latest 20 + unread count |
| PATCH | `/notifications/:id/read` · `/notifications/read-all` | Mark read |
| GET | `/users/me/stats` | Dashboard counts |

Every route is documented with a comment block in `server/src/routes/*.js`.

---

## Project structure

```
server/
  src/
    app.js              Express app (security headers, JSON, cookies, routes, errors)
    server.js           DB connect + listen
    routes/             Endpoint definitions + docs comments
    controllers/        Request handlers
    models/             Mongoose schemas (User, Team, Task, Notification)
    validators/         Zod schemas for every request body / query
    middleware/         auth (cookie JWT), validate (zod), error handler
    services/           access.js (permission rules), notify.js
  test/                 node:test + supertest + mongodb-memory-server
client/
  src/
    app/(auth)/         login, register, forgot-password
    app/(app)/          dashboard, tasks, teams, teams/[id] (board), settings (alerts)
    components/         board/, tasks/, teams/, layout/, common/, ui/ (shadcn)
    hooks/              TanStack Query hooks per resource
    lib/                api client, types, zod form schemas
```

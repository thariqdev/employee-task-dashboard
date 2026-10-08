# TaskDesk — Employee Task Management Dashboard

TaskDesk is a full stack admin dashboard for managing employees and the tasks assigned to them. An admin signs in, manages the employee directory, creates and assigns tasks, tracks their status and spots overdue work at a glance.

## Screenshots

Save your screenshots in `docs/screenshots/` with these names and they will show here.

| Dashboard | Employees | Tasks |
| --------- | --------- | ----- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Employees](docs/screenshots/employees.png) | ![Tasks with overdue highlighting](docs/screenshots/tasks.png) |

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, react-hook-form + zod |
| Backend  | Node.js, Express 5, TypeScript, zod validation |
| Database | SQLite via Prisma ORM (PostgreSQL-ready) |
| Auth     | JWT access token, bcrypt password hashing |
| Testing  | Vitest, supertest, React Testing Library |

## Project structure

```
employee-task-dashboard/
├── client/                 React app (Vite)
│   └── src/
├── server/                 Express API
│   ├── prisma/             schema.prisma, migrations, seed.ts
│   ├── src/
│   │   ├── config/         environment variable loading and validation
│   │   ├── controllers/    HTTP layer: read the request, call a service, send the response
│   │   ├── lib/            shared clients (Prisma)
│   │   ├── middleware/     auth, validation, error handling
│   │   ├── routes/         route definitions per resource
│   │   ├── services/       business logic and database access
│   │   └── validators/     zod schemas for request bodies and queries
│   └── tests/              API tests (Vitest + supertest)
└── package.json            root scripts that run both apps
```

## Getting started

**Requirements:** Node.js 22.9 or newer, npm 10 or newer.

```bash
# 1. Install dependencies for the client and the server (npm workspaces)
npm install

# 2. Create the environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
#    Then set JWT_SECRET in server/.env to a long random string:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Create the database and load demo data
npm run db:migrate     # applies migrations and runs the seed the first time
npm run db:seed        # re-seeds at any time (clears employees and tasks)

# 4. Start the client and the server together
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000/api (health check: `GET /api/health`)

### Useful scripts (from the repo root)

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Runs the API and the client together |
| `npm run db:migrate` | Applies Prisma migrations |
| `npm run db:seed` | Seeds the demo admin, 8 employees and 20 tasks |
| `npm run db:reset` | Drops the database, re-applies migrations and re-seeds |
| `npm run test` | Runs the server and client tests |
| `npm run build` | Builds the server and the client |

## Demo credentials

> These are **demo credentials** for a local seeded database only. They are set by `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `server/.env`.

| Email | Password |
| ----- | -------- |
| `admin@example.com` | `Admin@12345` |

## Deployment (Vercel + Render + PostgreSQL)

The client is a static site on **Vercel**. The server is a Node service on **Render**, with a hosted **PostgreSQL** database.
Locally and in the tests the project still uses SQLite. For production, `npm run build:prod -w server` makes a PostgreSQL
copy of the schema (`server/prisma/postgres/schema.prisma`, the same file with one line changed) and the matching migrations
are in `server/prisma/postgres/migrations`. A test fails if the copy is out of date.

### 1. Database
Create a PostgreSQL database (Render PostgreSQL, Neon or Supabase) and copy its connection string.
Neon and Supabase usually need `?sslmode=require` at the end.

### 2. Server on Render
New → **Web Service** → your repository. Leave **Root Directory** empty (the repo is an npm workspace).

| Setting | Value |
| ------- | ----- |
| Build Command | `npm install --include=dev && npm run build:prod -w server` |
| Start Command | `npm run start:prod -w server` (applies the database migrations, creates the admin, starts the API) |
| Health Check Path | `/api/health` |

Environment variables:

| Name | Value |
| ---- | ----- |
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the PostgreSQL connection string |
| `JWT_SECRET` | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_ORIGIN` | your Vercel address, for example `https://taskdesk.vercel.app` (see step 4) |
| `TRUST_PROXY` | `1` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the first admin account. The password needs 12+ characters. Do not use the demo password |
| `ADMIN_NAME` | optional |

`PORT` is set by Render. The admin is only created if it does not exist, so a restart never resets a password, and
`ADMIN_PASSWORD` is not even checked while the account exists. To replace a forgotten or wrong password, set
`ADMIN_RESET` to `true` for one deploy (with `ADMIN_EMAIL` and a new `ADMIN_PASSWORD`), then **remove `ADMIN_RESET`**.
Changing `ADMIN_PASSWORD` alone does nothing to an account that already exists.
Check it: open `https://YOUR-SERVICE.onrender.com/api/health`. The API docs are at `/api/docs`.

### 3. Client on Vercel
Add New → **Project** → import the repository, and deploy **only the client**: set **Root Directory** to `client`
(or, if the import screen lists `server` as a second project, remove it with its **x**). The Vite preset is detected:
Build Command `npm run build`, Output Directory `dist`. Add the environment variable:

| Name | Value |
| ---- | ----- |
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` (with `/api`, no slash at the end) |

Also set Settings → General → Node.js Version to 22.x. `client/vercel.json` sends every address to `index.html`, so
reloading `/employees` works. `VITE_API_URL` is read when the site is built: after changing it, redeploy.

### 4. Connect them
Set `CLIENT_ORIGIN` on Render to the exact Vercel address (comma-separate several, for example a custom domain),
then let Render restart. Open the Vercel address and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Vercel preview deployments have other addresses, so the server refuses them unless they are listed too.

### Things to know
- Free Render services sleep after a while: the first request can take about a minute.
- Free Render PostgreSQL databases expire after 30 days. Use a database that does not, for anything you keep.
- Never run `npm run db:seed` against production: it deletes all employees and tasks.
- Do not run `build:prod` on your own computer: it replaces your local Prisma client with the PostgreSQL one
  (fix with `npx prisma generate` in `server/`).
- When you change `schema.prisma`: run `npm run db:pg-schema -w server`, and add a PostgreSQL migration with
  `npx prisma migrate dev --create-only --schema prisma/postgres/schema.prisma` against a local PostgreSQL.
- The PostgreSQL migration has been checked by Prisma (`validate` and `migrate diff`) but was not run against a live
  PostgreSQL in this project's tests.

## API endpoints

Base URL: `http://localhost:4000/api`. Interactive docs (Swagger UI): `/api/docs`, raw spec: `/api/docs/openapi.json`.
Everything except `/health` and `/auth/login` needs the header `Authorization: Bearer <token>`.

| Method | Path | What it does |
| ------ | ---- | ------------ |
| GET | `/health` | Health check |
| POST | `/auth/login` | Sign in with `{ email, password }`, returns a JWT (rate limited) |
| GET | `/auth/me` | Current admin, used to validate the token |
| GET | `/employees` | List. Query: `search`, `department`, `sort` (`name`, `position`, `department`, `tasks`), `order` (`asc`, `desc`), `page`, `pageSize` |
| POST | `/employees` | Create `{ name, email, position, department }` |
| PATCH | `/employees/:id` | Update any of those fields |
| DELETE | `/employees/:id` | Delete, their tasks become unassigned |
| GET | `/tasks` | List. Query: `search`, `status`, `priority`, `assigneeId` (id or `unassigned`), `overdue`, `sort` (`title`, `assignee`, `priority`, `status`, `dueDate`), `order` (`asc`, `desc`), `page`, `pageSize` |
| POST | `/tasks` | Create `{ title, description, priority, status, dueDate, assigneeId }` |
| PATCH | `/tasks/:id` | Update any of those fields |
| DELETE | `/tasks/:id` | Delete |

Status values: `PENDING`, `IN_PROGRESS`, `COMPLETED`. Priority values: `LOW`, `MEDIUM`, `HIGH`. Each task in a response has a derived `isOverdue`. List responses include `meta` with `page`, `pageSize`, `total` and `totalPages`.

## Design decisions

- **Deleting an employee unassigns their tasks.** The relation uses `onDelete: SetNull`, so the employee is removed and their tasks stay in place as "Unassigned". No work is lost, and the admin can reassign those tasks later. The confirmation dialog will show how many tasks are affected.
- **Overdue is derived, not stored.** A task is overdue when its due date is in the past and its status is not Completed. This avoids a stored flag that would go stale.
- **Thin controllers, logic in services.** Controllers handle HTTP only. Services hold business rules and Prisma calls, which keeps them easy to test.

_More to be added as the build progresses._

## What I would improve next

- **Refresh tokens and httpOnly cookies.** The JWT is kept in local storage, which is simple but exposed to XSS. A short-lived access token plus a refresh cookie is safer.
- **Roles.** There is a single admin. Employees could sign in and see only their own tasks.
- **Dashboard counts in one request.** The dashboard makes several list calls and reads `meta.total`. A dedicated `/stats` endpoint would be one call.
- **End-to-end tests.** Unit and API tests exist, but no browser test (Playwright) covers the full login to task flow.
- **Deployment.** Add a Dockerfile, CI that runs tests and typecheck, and PostgreSQL in production.
- **More task features.** Comments, due-date reminders and sorting by column.
n
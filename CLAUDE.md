Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


# TaskDesk — Claude instructions

Employee task management dashboard: React + Vite client, Express 5 + Prisma (SQLite) server, npm workspaces. See [README.md](README.md) for stack, structure and design decisions.

## Teaching Mode (always on)

Do ONLY the next unchecked task below, nothing more. When it is done:

1. Run or test it and tell the user honestly what passed.
2. Tick the box here and add one line to the Log.
3. Explain it like to an 8-year-old: 3 to 5 short sentences, simple words, one everyday comparison, no jargon.
4. List the files changed, one line each.
5. Give the grown-up version in 2 sentences with the real technical terms (interview-ready).
6. Give one command or click so the user can see it working themselves.
7. Ask one quick question about what was just learned, and wait for the answer.

Rules:
- Do not start the next task until the user types "next".
- If the answer to the question is wrong, explain it again in a different way.
- If the user types "why", explain the last decision in more depth.

## Conventions

- Thin controllers (HTTP only), business logic and Prisma calls in services.
- Validate request bodies and queries with zod schemas in `server/src/validators`.
- Overdue is derived (due date in the past and status not Completed), never stored.
- Deleting an employee unassigns their tasks (`onDelete: SetNull`).
- Keep the Prisma schema SQLite and PostgreSQL compatible.
- Demo login: `admin@example.com` / `Admin@12345` (local seed only).

## Tasks

### Phase 1: Setup
- [x] 1.0 Scaffold, Prisma schema and seed

### Phase 2: Server basics
- [x] 2.1 Express app with health check, error handling and zod validation middleware
- [x] 2.2 Login with bcrypt and JWT, plus auth middleware

### Phase 3: API endpoints
- [x] 3.1 Employees: list, create, update, delete
- [x] 3.2 Tasks: list, create, update, delete, with overdue derived
- [x] 3.3 Server tests with Vitest and supertest
- [x] 3.4 Swagger (OpenAPI) docs at /api/docs, generated from the zod schemas

### Phase 4: Client foundation
- [x] 4.1 Router, Tailwind layout, login page
- [x] 4.2 TanStack Query setup and protected-route guard

### Phase 5: Client features
- [x] 5.1 Employees page
- [x] 5.2 Tasks page with overdue highlighting
- [x] 5.3 Dashboard summary

### Phase 6: Polish
- [x] 6.1 Client tests
- [x] 6.2 README: endpoints, screenshots, "what I would improve"

### Phase 7: UI polish
- [x] 7.1 Design direction (colors, fonts, spacing, components), no code yet
- [x] 7.2 App layout, sidebar/navbar and login page
- [x] 7.3 Dashboard summary cards
- [x] 7.4 Employees and Tasks pages (tables, filters, forms, modals)
- [x] 7.5 Empty, loading and error states, plus mobile responsiveness

## Design direction (approved in 7.1, follow in 7.2 to 7.5)

Light, quiet, Linear/Vercel style: "quiet paper, one blue". Keep React + Tailwind; change no logic, API calls, routes or tests (flag it first if a test checks a class name).
- Colors: page `#FAFAFA`, surface `#FFFFFF`, border `#E5E7EB`, text `#111827`, muted `#6B7280`, accent cobalt `#2F54EB` (hover `#2444C8`, tint `#EEF2FF`), danger `#DC2626` (tint `#FEF2F2`).
- Font: Geist Sans, tabular numbers for counts and dates. Scale: title 24/600, section 16/600, body and table 14, small 12. No all-caps headers.
- Spacing: 4px base. Page padding 24, max width 1100. Radius 6 (controls), 8 (cards, modals). Shadows only on modals.
- Buttons 36px high: primary solid cobalt, secondary white + border, ghost text, danger white + red text (solid red only in confirm dialogs).
- Inputs 36px, 1px border, 2px cobalt focus ring, red border + message on error.
- Dashboard cards: white, 1px border, no shadow, 28/600 number; only Overdue turns red when above 0.
- Tables: 1px outer border, muted sentence-case header on `#FAFAFA`, hairline row dividers, faint hover, 44px rows.
- Status badge: colored dot + neutral text (Pending grey, In progress amber, Completed green). Priority: text + 3-bar icon (Low 1 grey, Medium 2 amber, High 3 red).
- Overdue: 3px red left bar on the row, red due date, small "Overdue" tag (replaces the full red row tint).
- Sidebar: white, right border, active link tint + cobalt text, small cobalt square logo.

## Log

- 1.0 Project scaffold, Prisma schema, migration and seed data done (before Teaching Mode).
- 2.1 Added helmet, cors, JSON 404, central error handler (HttpError) and zod validate() middleware; typecheck and 7 tests pass.
- 2.2 Added POST /api/auth/login (bcrypt + JWT, rate limited), GET /api/auth/me and requireAuth middleware; 11 tests pass, live login verified.
- 3.1 Added /api/employees (GET list with search, filter, pagination; POST; PATCH; DELETE unassigns tasks), all behind requireAuth; 18 tests pass incl. real SQLite integration tests.
- 3.2 Added /api/tasks (GET list with search, status, priority, assignee, overdue filters + pagination; POST; PATCH; DELETE), isOverdue derived; a test caught and fixed a partial-update default-reset bug; 27 tests pass.
- 3.4 Added interactive Swagger docs at /api/docs (spec at /api/docs/openapi.json) built from the zod validators; spec validated in tests; 31 tests pass.
- 3.3 Filled test gaps (login rate limit, forged/odd tokens, deleted admin, helmet and CORS, duplicate-email update, task pagination, bad ids); 40 server tests pass across 5 files; rate-limit test confirmed to fail when the limit is broken.
- 4.1 Added react-router routes (/login, layout with /, /employees, /tasks, 404), responsive Tailwind AppLayout, and a LoginPage (react-hook-form + zod) wired to POST /auth/login via an apiFetch helper; typecheck, build and 4 tests pass; CORS preflight verified.
- 4.2 Added TanStack Query (createQueryClient, useMe), RequireAuth route guard (redirects to /login and back, validates token via /auth/me, handles expiry and server errors), logout clears cache; 13 client tests pass, guard and 401 tests confirmed to fail when broken.
- 4.2 fix (found in browser testing): login form now reads real field values on submit (autofill/back-forward restore left a stale email error); route guard now re-checks the token on cross-tab 'storage' and bfcache 'pageshow' events so a restored page cannot show the dashboard after logout; 17 client tests pass.
- 4.2 fix 2: a signed-in user who reaches /login (Back button) is redirected to the dashboard; 19 client tests pass, redirect tests confirmed to fail when removed.
- 5.1 Added Employees page: search (debounced), pagination, add/edit modal form (react-hook-form + zod, server errors mapped to fields), delete confirmation showing how many tasks become unassigned, via TanStack Query hooks; apiFetchPage added for list meta; 35 client tests pass, 3 mutation checks caught (one test strengthened after a mutation survived).
- 5.2 Added Tasks page: filters (search, status, priority, assignee/unassigned, overdue only), pagination, add/edit modal (assignee dropdown, due date sent as end of day so due-today is not overdue), delete confirmation, overdue rows tinted and labelled; 60 client tests pass, 6 mutation checks all caught.

- 5.3 Added Dashboard summary cards (employees, total, pending, in progress, completed, overdue) using list-endpoint meta.total counts, no new server code, error + retry state; 64 client tests pass, overdue-count mutation caught.
- 6.1 Filled client test gaps (api helper, token storage + auth-change events, query client retry and 401 handling, debounce hook, Modal); 87 client tests pass, 3 mutation checks all caught.
- 6.2 README now has an endpoints table (checked against the routes, validators and schema enums), screenshot slots in docs/screenshots/, and a "what I would improve" list; docs only, no tests run. Screenshots themselves still need to be taken by hand.
- 7.1 Design direction approved (light, one cobalt accent, Geist, dot status badges, red left bar for overdue) and saved in the Design direction section above; no code changed.
- 7.2 Added design tokens (bg-page, bg-surface, border-line, text-ink, text-muted, bg-accent, text-danger, ...) in index.css, Geist font link, restyled AppLayout (cobalt logo square, tinted active link, 1100px content width) and LoginPage (bordered card, 36px inputs, cobalt button); styling only, 87 client tests, typecheck and build pass. Not yet checked by eye in the browser.
- 7.3 Restyled dashboard cards (white, 1px border, no shadow, 28px number); only the Overdue number turns red when above 0. With your OK, 2 test lines in DashboardPage.test.tsx now check `text-danger` on the number instead of `bg-red-50` on the card; 87 client tests and typecheck pass, and the highlight test was confirmed to fail when the highlight is removed.
- 7.4 Restyled Employees and Tasks pages, filters, form modals, delete dialogs and Modal with shared classes in lib/ui.ts; new StatusBadge (colored dot) and PriorityBadge (3 bars) in components/TaskBadges.tsx; overdue rows now use an `is-overdue` class (red left bar in index.css) and a light-red "Overdue" tag. With your OK for class-name checks in 7.4/7.5, 3 lines in TasksPage.test.tsx changed from `bg-red-50` to `is-overdue`; 87 client tests, typecheck and build pass, and the overdue test fails when the marker is removed. RequireAuth and NotFoundPage still use old colors (left for 7.5).
- 7.5 Moved RequireAuth (loading, error and retry) and NotFoundPage to the new colors; list loading text pulses (only when motion is allowed); mobile: 16px page padding, full-width task search, single-column task form on narrow screens, scrollable modal when taller than the screen. Styling only, no test changes; 87 client tests, typecheck and build pass. Mobile layout not yet checked at phone width by eye. Phase 7 is complete.

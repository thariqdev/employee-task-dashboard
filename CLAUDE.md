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

### Phase 8: Showcase UI
Supersedes the Phase 7 design direction below. Since 8.3 the app follows [DESIGN.md](DESIGN.md) (Nocturne: dark, one Signal Indigo accent, pill buttons with uppercase labels, inset-border inputs, heavy shadows, no gradients); the earlier vibrant gradient and per-status gradient cards are dropped, so 8.4 to 8.7 must follow DESIGN.md instead. For Phase 8 the "Surgical Changes" rule is relaxed for styling and markup files only; never change API calls, routes, business logic or server code, and update client tests only where the markup changed.
- [x] 8.1 Install libs, fonts, design tokens (vibrant palette, gradients), logo
- [x] 8.2 App shell: fixed sidebar, only the main area scrolls, topbar
- [x] 8.3 Login page
- [x] 8.3b Apply DESIGN.md (dark Nocturne theme) across the whole app (done on request, before 8.4)
- [x] 8.4 Dashboard: stat cards (DESIGN.md style, no gradients), charts, recent tasks
- [x] 8.5 Employees page: avatars, hover rows, sticky table header
- [x] 8.6 Tasks page: badges, priority colors, due-date chips, modals
- [x] 8.7 Loaders and polish: skeletons, page transitions, empty states, responsive

## Design direction (approved in 7.1, followed in 7.2 to 7.5; the colors and font are superseded by Phase 8, see index.css for the current tokens)

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
- 8.1 Installed lucide-react, framer-motion, recharts and Plus Jakarta Sans (self-hosted, Google Fonts link removed); index.css now has the vibrant tokens (indigo/violet/pink brand, sky/amber/emerald/rose statuses, shadows, radii, gradient utilities, reduced-motion rule); new LogoMark/Wordmark in components/Logo.tsx, shown in the sidebar and login page; MotionConfig reducedMotion="user" in main.tsx. Kept the Phase 7 token names, so every page picked up the new accent already. 90 client tests (3 new for the logo), typecheck and build pass. Libraries other than the font and logo are installed but not used yet.
- 8.2 Rebuilt AppLayout: shell is h-dvh overflow-hidden, fixed sidebar (logo, lucide icons, gradient active link, hover slide, user card, logout), topbar with page title, only <main> scrolls; below md the sidebar is a drawer (menu button, backdrop, Escape, closes on navigation). Table headers are sticky inside a scrolling table box (lib/ui.ts); global pointer cursor for clickable elements in index.css. 4 new AppLayout tests; 94 client tests, typecheck and build pass; the Escape test was confirmed to fail when broken. Not yet checked by eye.
- 8.3 Restyled LoginPage: two columns on wide screens (gradient brand panel with tagline and three highlights, form on the right), form only on small screens; icons inside the inputs, show/hide password button, gradient Sign in button, one fade-in on load (framer-motion, respects reduced motion). Login logic untouched. 1 new test for the password toggle (confirmed to fail when broken); 95 client tests, typecheck and build pass. Not yet checked by eye.
- 8.3b Applied DESIGN.md app-wide by changing the tokens in index.css (page #121212, surface #171717, raised #222222, accent #6366f1, rose for danger, `color-scheme: dark`, heavy shadows) and the shared classes in lib/ui.ts (pill buttons with uppercase 1.4px labels, inset-border inputs, pill search and filters, borderless cards, sticky header on the surface color). Gradients removed everywhere: solid accent logo, sidebar active link is a raised pill, login brand panel is a surface panel. Test edits: Logo test (gradient-id test removed, markup gone) and AppLayout test (active link checks `bg-raised`). 94 client tests, typecheck and build pass. Not yet checked by eye; check contrast of white text on the indigo button.
- 8.4 Dashboard rebuilt in the dark style: six stat cards with status-colored icons, a donut chart (tasks by status) and a bar chart (open work: on track vs past due) with recharts, each with a text description for screen readers, and a "Needs attention" list of the 5 longest-overdue tasks with assignee and due date (the API can only sort by due date, so this replaces "recent tasks"; a true "recent" list would need a sort option on the server). No new API calls except one list request (overdue=true, 5 rows). DashboardPage tests now wrap a router and cover the list, empty state, request URL and chart text; RequireAuth test mock now returns a valid empty page for /tasks too. Two mutation checks caught. 97 client tests, typecheck and build pass. Not yet checked by eye.
- 8.5 Employees page: initials avatar next to each name (new Avatar component, `initialsOf` helper tested), bold names, task count as a small pill; hover rows and sticky table header were already in place from 8.2/8.3b (shared table classes in lib/ui.ts). 5 new Avatar tests (a mutation to the initials logic was caught, and the tests also caught a real bug: a single-word name gave two letters). 101 client tests, typecheck and build pass. Not yet checked by eye.
- Incident during 8.5: a `git checkout -- .` run from client/ (meant to undo a test mutation) reverted every uncommitted tracked file in client/ to the last commit (Phase 7 state). Rebuilt all Phase 8 edits (tokens, ui.ts, AppLayout, LoginPage, DashboardPage, pages, tests, package.json); the server and root files were not touched. Lesson: undo a mutation with the exact reverse edit, never with git checkout. Commit often.
- 8.6 Tasks page: due dates are now chips (new DueDateChip + `dueState` helper in lib/dates.ts): red with an "Overdue" label when overdue, amber when due within 3 days, grey otherwise and for completed tasks; the Modal got an X close button and one short open animation (framer-motion, off for reduced motion). Status dots and priority bars (with their colors) were already done in 7.4/8.3b. 8 new tests (dueState x3, chip x4, modal X x1); two mutation checks caught (3-day boundary, completed rule). 109 client tests, typecheck and build pass. Not yet checked by eye.
- 8.7 Loaders and polish: grey skeleton placeholders (new Skeleton and TableSkeleton) replace the "Loading..." text on the Employees, Tasks and Dashboard (cards, charts, overdue list), each still announced to screen readers; new EmptyState (round icon + one sentence, search icon when a filter or search is active) keeps the exact messages the tests look for; each page change fades and slides in briefly (framer-motion keyed on the route, reduced motion respected). Responsive behavior (drawer, 2-column cards, scrolling tables, full-width search on phones) came from 7.5/8.2/8.4 and was not changed. 6 new tests, one mutation caught. 114 client tests, typecheck and build pass. Not yet checked by eye or at phone width. Phase 8 is complete.
- Post-8.7 requests: (1) the browser's search "x" now has a gap and a pointer cursor (index.css); (2) Employees and Tasks show a "Refreshing..." overlay with a spinner whenever the list is being fetched (page change, delete, add, edit; new FetchingOverlay in Skeleton.tsx, driven by React Query `isFetching`, replacing the old dimming on `isPlaceholderData`). 3 new page tests that hold the server reply to see the loader (pagination on both pages, delete on Employees; removing the overlay made them fail) and 1 component test; 118 client tests, typecheck and build pass.
- Round 2 of requests after 8.7 (all verified by tests, not yet checked by eye): (a) sidebar: the current page's icon is accent colored; the drawer now slides smoothly (Tailwind v4 moves elements with the `translate` property, so that is what the transition must name) and the backdrop fades in; (b) filter dropdowns are a custom listbox (components/Select.tsx: keyboard support, check mark, accent when a filter is set) instead of the native list, native selects in forms get a properly placed arrow; (c) "Clear filters" button on Tasks (appears only while a filter is set, forces a reload so the "Refreshing..." loader shows); (d) Pagination component with first and last page buttons (icons, aria-labels "First page" / "Last page"), compact on phones; (e) due date is a text box plus a calendar popover (components/DatePicker.tsx, lib/calendar.ts: Monday-first, month and year buttons, arrow keys, Today, Escape closes only the calendar); (f) Add/Edit employee: Position and Department are dropdowns with an "Other..." choice that reveals a text box, checked for empty, length 2-100, at least one letter, allowed characters, and not already in the list (lib/employeeOptions.ts, shared Select "field" variant); an existing value that is not in the list opens as Other with the text filled in; (g) responsive fixes: smaller type and tighter spacing on phones, tables scroll sideways with a fixed minimum width and only scroll vertically from md up, dialog buttons stack and never wrap their text, long search text wraps in the empty state. 159 client tests, typecheck and build pass; mutation checks caught the duplicate-entry rule, the Monday-first grid and the clear-reload.
- Round 3 (server and client, verified by tests, not yet checked by eye): (a) forgot-password flow: POST /auth/forgot-password and POST /auth/reset-password, new PasswordResetToken table (migration add_password_reset; only a SHA-256 hash of the token is stored, 30 minute life, one use, a new request cancels the old link, same answer for known and unknown emails, rate limited, new password rule 8-72 chars with a letter and a number); no email service yet, so lib/mailer.ts prints the link in the server console in development and sends nothing in production; client pages /forgot-password and /reset-password share a new AuthLayout with the sign-in page, plus a "Forgot password?" link; (b) donut hover: the slice under the pointer grows, lifts with a dark base and a shadow, the others fade (PoppedSlice); (c) sorting: GET /tasks takes sort (title, assignee, priority, status, dueDate) and order, GET /employees takes sort (name, position, department, tasks) and order; priority and status sort by meaning, text sorts ignore case, unassigned tasks always come last, ties break by due date then id so pages stay consistent; clickable column headers with aria-sort on both tables, a sort change returns to page 1 and Clear filters keeps the sort; the Employees "Tasks" column is sortable because it answers "who is overloaded or free?" 70 server tests and 181 client tests, typecheck and build pass; mutation checks caught priority order, unassigned-last and the page reset. After pulling this: stop `npm run dev`, run `npx prisma generate` in server/ if the server complains about the Prisma client, then start it again (the database migration is already applied to dev.db).
- Task form dropdowns: Priority, Status and Assigned to now use the custom Select (field variant) like Position and Department; options can carry an icon (priority bars, status dot, from TaskBadges). Task tests pick options by clicking. 183 client tests, typecheck and build pass.
- Removed the forgot-password feature on request (single admin, no email service, so it could not deliver anyway): deleted its two pages, routes, the sign-in link, both API endpoints, the mailer, the token table (new migration remove_password_reset drops it; the older add_password_reset migration stays in history) and its tests and docs. Login is unchanged. AuthLayout stays as the sign-in page frame. 55 server tests and 174 client tests, typecheck and build pass (the 15 server and 10 client tests of the removed feature are gone).
- Donut hover is now animated: every slice stays drawn and only its style changes, so the hovered slice slides outward 10px, lifts (dark base + shadow) over 240ms while the others fade (DonutSlice with a hover context; the chart's own tooltip is gone, the middle of the donut shows the hovered status and its count instead, also when the legend is hovered). Dropdown lists (Select) now draw on the page like the calendar (portal, fixed position, flips above when there is no room, follows scroll and resize), so they no longer grow or scroll dialogs. 178 client tests, typecheck and build pass.
- White line on the tables when sorting (reported with a screenshot that did not show the line, so the cause is a best guess, not confirmed): tables are now border-separate with dividers drawn on the cells, so the sticky header cannot leave a 1px gap that lets scrolled row text show through, and the "Refreshing..." overlay lost its 1px backdrop blur (its edge can draw a bright halo). Needs an eye check; if the line is still there, a close-up of it is needed. 178 client tests, typecheck and build pass.
- Adding an employee: the dialog now closes as soon as the API answers yes (create, edit, delete and the task actions no longer wait for the list to reload), the table shows the "Refreshing..." loader while the list reloads and then the list; the new employee comes first, because after a create the table switches to a new sort (GET /employees sort=createdAt, order=desc) and shows a "Newest first" chip that returns to the name order. Edits keep the current order. 56 server tests, 181 client tests, typecheck and build pass; making the dialog wait again fails 2 tests.
- No due dates in the past: the calendar shows days before today greyed out, struck through and unclickable (the arrow keys can pass over them, Enter on one does nothing), and its previous-month and previous-year buttons stop at the current month; the form also refuses a typed past date ("The due date cannot be in the past"); today is allowed (due today is not overdue until the day ends); an existing task keeps the due date it has, so an overdue task can still be edited, but cannot be moved to another past date. This is enforced in the client only: the API still accepts past dates (its tests and the seed use them to make overdue tasks), so a script calling the API directly could still create one. 188 client tests, typecheck and build pass; two mutation checks caught.
- Calendar popover moved out of the dialog: DatePicker now draws it on the page (React portal to document.body, fixed position under the text box, flips above it when there is no room, follows scroll and resize), so it no longer stretches or scrolls the dialog; the look is unchanged. 184 client tests, typecheck and build pass. The custom dropdown lists (Select) still open inside the dialog.

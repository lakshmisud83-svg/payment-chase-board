# Tech Stack — Payment Chase Board

**Inputs:** `PRD.md` (this repo) and a stated scale of **100 users**.
**One Supabase project only.** No separate dev and prod project. Local development replaces the dev project.

---

## The scale, in numbers, before any choice

"100 users" means 100 physiotherapist accounts. Each is a solo practitioner. Each has, at most, a few hundred obligations in total across a year.

| Quantity | At 100 users | Consequence |
|---|---|---|
| Accounts | 100 | Any auth system works. Auth vendors are a cost, not a capability, at this size. |
| Rows on the busiest board | ~50 per user, ~5,000 across all users | One indexed query. No read replica, no cache, no queue. |
| Marks per day | ~5 per active user, ~500/day total | Roughly 0.006 writes/second. Concurrency is not a design input. |
| Data per year | ~10–60 MB including an event log | The free database tier holds years of this. |
| Peak concurrent sessions | Under 20 (physios work at different times of day) | No connection pooling problem. |
| Request rate | Under 50 requests/minute at peak | Every free hosting tier is idle at this load. |

The honest conclusion: **100 users is a rounding error for every modern platform.** Nothing here is chosen for scale. Everything is chosen for the cheapest thing that does not lie about money, and for how little work it is to operate alone.

---

## Layer 1 — Database

**Choice: Postgres, hosted in the single Supabase project, with money stored as integer paise in `bigint` and all board writes going through SQL functions.**

**Constraint that forced it:** the PRD's core promise is that the totals at the top are correct and that a mark moves a row and changes totals together. "Correct together" is a transaction. The PRD also requires every row to be showable without a hidden filter, which means real queries with real indexes, not a document fetched whole into memory.

**What this buys against the PRD:**
- `paid` / `promised` / `lost` and the recomputed totals happen in one transaction, so the number at the top can never disagree with the rows below it.
- Integer paise means ₹1,500.50 is `150050`, and two rows cannot add up to a rounding surprise.
- An append-only `outcome_events` table gives the "where did the row go" visibility the PRD asks for without a second screen.

**Rejected:**
- **A document store (Firestore, Mongo).** Rejected because money totals across rows are the product. Multi-document transactions and aggregate queries are the awkward path there, and the PRD explicitly depends on an always-correct total.
- **Google Sheets as the database.** Rejected despite being the cheapest possible option. No row-level access control, concurrent marks overwrite each other, and a formula cannot be trusted as the source of truth for money. It is the option the client may already be using; that is the reason, not a defence.
- **SQLite in the browser as the only store.** Rejected because the board must survive a lost phone and be readable by a second person if Q11 says so. Local-only also fails the "every patient" guarantee after a device change.
- **A separate Postgres host (Neon, Railway).** Rejected because it duplicates the vendor, the backup story and the auth integration for no gain at 100 users.

**Schema shape that matters (not the full DDL):**
- `patients` — owned by one account, row-level security on `owner_id`.
- `obligations` — one per thing owed; carries `amount_paise`, `reason` (`pending_money`, `missed_session`, `feedback_not_asked`), and current `status`.
- `outcome_events` — append-only: who marked it, when, paid/promised/lost, optional promise date, optional note.
- `board_rows` — a view over obligations and the latest event, not a table. The board is a projection, never a second copy of the truth.

**MVP vs production:** the same. No managed cache, no read replica, no partitioning, no queue. The only production change is enabling point-in-time recovery, which is a plan setting, not a schema change.

---

## Layer 2 — Authentication

**Choice: Supabase Auth, email one-time code (magic link / OTP), one account per physio, row-level security keyed to the account.**

**Constraint that forced it:** 100 users means auth is a solved commodity, and the PRD's unit of privacy is "this physio's patients". We need identity and per-row isolation, not teams, roles or SSO. Supabase Auth lives in the same project we already need, so it adds no vendor, no extra bill and no second user table.

**Rejected:**
- **Clerk / Auth0 / WorkOS.** Rejected on cost and on a second bill for a capability Postgres already sits next to. At 100 users these are a monthly fee for features the PRD excludes (organisations, enterprise SSO, roles).
- **Rolling our own password auth.** Rejected because password reset, hashing and session handling are pure risk with zero product value here.
- **Phone OTP in the MVP.** This is the one that hurts. Indian physios may expect a phone-first login, and phone OTP is the natural fit. It is rejected in the MVP only because it requires an SMS provider with per-message cost and a paid Supabase Email/SMS setup, which contradicts "free tier until proven otherwise". It is a **config-plus-provider change, not a rewrite** — the `auth.users` identity changes, the `owner_id` foreign key does not. Flag it as a product decision in Q11 territory, not a settled stack choice.

**The real free-tier trap here:** Supabase's built-in email sender is rate-limited to a handful of messages per hour and is not meant for real traffic. **Change before the first real user:** connect a custom SMTP provider (Resend free tier, 3,000 emails/month, 100/day) in the project's auth settings. This is configuration, not code.

**MVP vs production:** email OTP in both. Production adds custom SMTP (config) and, only if the client insists, phone OTP (new provider plus a small auth flow change).

---

## Layer 3 — Frontend framework

**Choice: React + TypeScript, built with Vite, as a single-page app. No server-side rendering.**

**Constraint that forced it:** the PRD says one page, opened on a phone, between visits, often on a weak connection. There is no public content, no SEO, no first paint that needs to be fast for strangers, and no shareable pages. Every reason to choose server rendering is absent. A static single-page build is the fewest moving parts that can render 50 rows on a phone.

**Rejected:**
- **Next.js.** Rejected because it brings a server runtime, routing conventions and a build target we do not need, and its natural home is a host whose free tier forbids commercial use (see Layer 4). Choosing it would mean adopting a framework to solve a problem (SEO, server rendering) the PRD excludes.
- **SvelteKit / SolidStart.** Fine products, rejected on team familiarity and because the win over React here is a few kilobytes on a page whose real cost is the data query. This is a preference, and I am naming it as one so it is not re-argued as a technical fact.
- **A no-framework HTML page with hand-written DOM code.** Genuinely tempting at 100 users and one page, rejected because the board has enough interactive state (optimistic marks, retry queue, totals recompute) that hand-written state would become the bug surface.

**Supporting libraries (each with a constraint):**
- **TanStack Query** — cache and refetch discipline. Constraint: after a mark, the board and totals must agree; a single cache owner is how that stays true.
- **Dexie (IndexedDB)** — the pending-mark queue for weak signal. Constraint: PRD assumption A5. Not a second database, only an outbox.
- **Tailwind CSS** — constraint: one developer, one page, small screens. Rejected component kits (MUI, Chakra) because they are a design system we would spend days overriding for one screen.
- **No client-side money maths on the totals.** The totals come from the database. Constraint: PRD metric "every rupee is visible" cannot tolerate a client that recomputes differently from the store.

**MVP vs production:** identical. The frontend has no rewrite scheduled.

---

## Layer 4 — Hosting

**Choice: Cloudflare Pages (free plan), static build, custom domain.**

**Constraint that forced it:** this is a commercial product — the client charges ₹15,000 setup and ₹5,000 a month. The cheapest popular host, Vercel Hobby, **forbids commercial use in its terms**. So the genuinely free, commercially permitted option is Cloudflare Pages: unlimited requests and bandwidth on the free plan, 500 builds a month, and the static site is the whole deployment.

**Rejected:**
- **Vercel Hobby.** Rejected on licence terms, not on capability. Vercel Pro is $20/month and is the fallback if the team insists on the Vercel workflow; that is a paid decision, not a technical one.
- **Netlify free.** Comparable, rejected only to avoid re-litigating two near-identical hosts. If Cloudflare's free build limit (500/month) is ever hit, Netlify free is the drop-in.
- **Cloudflare Workers for the app itself.** Rejected because the app is static; the only server logic is in the database (Layer 5).
- **Supabase Storage static hosting.** Rejected because Storage is for files, not for a build pipeline, and its free bandwidth is a shared resource with data egress.

**MVP vs production:** same host. Production adds a proper domain and caching headers — configuration, not a rebuild.

---

## Layer 5 — Server functions

**Choice: none in the MVP for the core loop. All writes go through Postgres functions called from the client. No Edge Functions.**

**Constraint that forced it:** the PRD's only server-worthy action is "mark this row, move it, update totals, all at once". That is a transaction, and Postgres is already the transaction boundary. An Edge Function in front of it would add a network hop, a cold start on a phone in an apartment stairwell, and a second place where the rules live — for zero additional capability.

**What the database functions do:**
- `mark_outcome(obligation_id, outcome, promised_for, note)` — validates the outcome, writes the append-only event, updates the obligation status, returns the new totals. Idempotent on a client-supplied key, because the phone may retry.
- `board_totals()` — one query, so the header cannot drift from the rows.

**Rejected:**
- **A separate Node/Express server.** Rejected outright: it would need a host, a deploy, secrets and uptime, to wrap queries Supabase already exposes safely.
- **Supabase Edge Functions for the mark.** Rejected for latency and for splitting the rulebook, as above. Kept in reserve for one thing only: scheduled work, if a later phase adds a reminder. That would be additive, not a rewrite.
- **Doing the totals in the client after reading rows.** Rejected because it makes the "totals are correct" promise depend on every client version.

**MVP vs production:** same. Phase 3 might add one scheduled Edge Function; that is a new, isolated function, not a migration of existing logic.

---

## Layer 6 — Offline and weak-signal behaviour

**Choice (MVP): optimistic UI plus a durable outbox. A mark is written to IndexedDB immediately, shown as "pending", retried on reconnect with an idempotency key, and reconciled against the server response. The board renders server data plus pending local marks.**

**Constraint that forced it:** PRD assumption A5 — home visits happen in homes and stairwells, and a lost mark means a lost rupee. The PRD's success metric "a mark takes under 5 seconds" is only true if the mark does not wait on a bad connection.

**Rejected:**
- **Require a connection for every mark.** Rejected because it fails the primary environment.
- **A full local-first sync engine (PowerSync, ElectricSQL, Replicache) in the MVP.** Rejected as the single most over-built option available here. It solves multi-device conflict, which 100 solo users on one phone do not have. It is the obvious **rewrite** trigger if Q11 says a physio and an assistant both mark the same board — see the table below.
- **Service worker caching of the whole board for cold offline open.** Rejected for the MVP; the outbox protects the rupee, and the next open with signal shows the truth.

**MVP vs production:** MVP keeps the outbox. Production changes only if multi-device marking becomes real, at which point the data layer is replaced — this is one of the two rewrites in this document.

---

## Layer 7 — Money handling

**Choice: integer paise everywhere, `bigint` in the database, formatted to rupees only at render. Timezone `Asia/Kolkata` on the project. One currency, INR.**

**Constraint that forced it:** the PRD's top-line promise is a rupee total that equals the physio's own count. Floating point rupees eventually disagree with a hand count by a paisa, and a board that is off by a paisa is a board the physio stops trusting.

**Rejected:** `numeric` with decimals is acceptable and safer for future fractional rates, but it invites accidental division in the client; integers plus explicit formatting is the smaller failure surface for one currency. This is a low-cost choice to reverse (a migration that multiplies by 100 is mechanical), unlike the row model.

**MVP vs production:** same.

---

## Layer 8 — Email, files, observability, testing

| Need | MVP | Constraint | Rejected |
|---|---|---|---|
| Transactional email (login codes) | Resend free (3,000/month, 100/day) as Supabase custom SMTP | Free, commercial-permitted, and the built-in sender is rate-limited | Supabase built-in SMTP for real users; SendGrid for a simpler product at this size |
| File storage | **None.** The PRD excludes receipts and documents | Adding storage would add a privacy surface and a 1 GB free cap for no in-scope feature | Supabase Storage in the MVP |
| Error visibility | Sentry free tier, client + database function errors | A money board that fails silently is worse than one that is down | Full APM; log aggregation stacks |
| Analytics | One table of product events, or nothing | The PRD has no funnel to optimise | A third-party analytics vendor |
| Tests | Vitest for money and outcome rules, Playwright for the one page | The rules that matter are pure functions and one screen | A full test pyramid for a single page |
| CI | GitHub Actions free tier: typecheck, unit tests, build, deploy to Cloudflare Pages | One developer, one page | Self-hosted runners |

---

## The free tier, and the exact limit that forces you off it

| Service | Free limit that matters | Verdict at 100 users |
|---|---|---|
| Supabase | 500 MB database, 1 GB file storage, 5 GB egress/month, 50,000 monthly active users, **2 active projects**, project pauses after ~7 days of inactivity, **no point-in-time recovery** | Database, auth and egress are not close to the limit for years. The blockers are backups and the pause, not size. |
| Cloudflare Pages | Unlimited requests and bandwidth, 500 builds/month | Never hit by this product. |
| Resend | 3,000 emails/month, 100/day | 100 users logging in a few times a week is under 1,000/month. |

**The limit that actually forces a paid plan is not traffic. It is recoverability.** A board whose entire value is "the rupee figure is right" cannot run on a free database with no point-in-time recovery and a project that pauses when quiet. The first paid switch is **Supabase Pro (~$25/month)** for backups and no pausing. If the client refuses that, the correct decision is to move to a cheaper managed Postgres with backups, not to accept a money store with no recovery.

**Second paid switch, optional:** Vercel Pro ($20/month) only if the team insists on that host. Cloudflare Pages avoids it.

**Total realistic running cost at 100 users:** ~$25/month plus a domain. That is the honest number, and it is one-tenth of one client's monthly fee.

---

## MVP versus production, and what kind of change each is

| Layer | MVP | Production | Change type |
|---|---|---|---|
| Database | Supabase Postgres, event log, board as a view | Same, with PITR enabled | **Config** |
| Auth | Email OTP | Same; optionally phone OTP | **Config + provider** (phone OTP adds a small flow change) |
| Frontend | React + Vite static app | Same | None |
| Hosting | Cloudflare Pages free | Same, custom domain | **Config** |
| Server logic | Postgres functions only | Same | None |
| Offline | IndexedDB outbox, optimistic marks | Same, unless multi-device marking is required | **Rewrite** only in the multi-device case |
| Email | Resend free SMTP | Same, watch the 100/day cap | **Config** |
| Backups | None (free tier) | PITR on Supabase Pro | **Config, but a paid one** |
| Observability | Sentry free | Same | **Config** |

**The two rewrites to care about:**

1. **Multi-device or multi-user marking.** The moment two people can touch the same row offline, the outbox is no longer enough and the data layer becomes a sync engine. The schema survives; the client data layer and the merge rules are replaced.
2. **Moving the money store to obligation-level history after shipping patient-level rows.** If the MVP collapses a patient's several dues into one row and the client later needs per-visit chasing, the board, the totals and the event log all change meaning. The append-only design is chosen specifically to make this survivable, but the UI and the totals definition still get rebuilt.

Everything else on this list — host, email provider, OTP type, backups — is a switch, not a rewrite. That asymmetry is the point of the next section.

---

## The decision most expensive to reverse

**The data model: every rupee movement is an append-only event, and the board is a projection over those events, not a table of rows that get edited in place.**

This is the choice that would hurt most to undo in six months, more than Supabase, more than the host, more than the framework.

Why it is expensive: by then the `outcome_events` table holds the only record of what the physio actually did — which call was made, what was promised, what was written off. Any later need the PRD hints at (Q7's "where did the row go", Q8's undo, Q9's promise dates, the "every rupee is visible" metric) is a query against that log. Replacing it with mutable status columns would mean either losing the history or writing a migration that reconstructs events from snapshots that were never taken. Undoing it later costs a data migration on the one dataset the client cares about, plus a rewrite of the totals.

The alternative — editing an `obligations.status` column in place — is genuinely simpler to build for a week, and it is the one I would reject again. The event log is the cheap insurance that keeps every later PRD question answerable without a rebuild.

The second-most expensive, for the record: choosing Supabase as a single vendor for database and auth. It is a real lock-in, but at 100 users the migration is a weekend of SQL and auth re-pointing, not a six-month wound. The data model is the one that bleeds.

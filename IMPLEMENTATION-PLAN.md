# Implementation Plan — Payment Chase Board

**Inputs:** `PRD.md`, `TECH-STACK.md`.
**Ordering rule:** every step below ends with something openable on a phone. If it does not, it is a bad step.

**Time estimates are agent-minutes** — how long the build takes me, not how long a person takes. They assume the decisions at the gates are already answered.

---

## Gates before step 1

These come from the PRD's open questions. I am not resolving them, but the first two steps cannot start without an answer. If the answer is "you decide", the default is written here so the build does not stall — and it is marked as a default, not a decision.

| Gate | Question | Why it blocks | Default if forced |
|---|---|---|---|
| G1 | **Q5** — one row per patient, or per unpaid visit? | It is the shape of the board, the totals and the event log. A mistake here is unwound at step 9. | One row per obligation (per unpaid visit or package), because the event log makes a patient-level rollup addable later; the reverse is not true. |
| G2 | **Q4** — what does "amount at risk" mean? | The header totals cannot be built or tested without it. | The full unpaid amount per row, summed at the top. |
| G3 | **Q1** — where do amounts come from? | Step 2 seeds data; if it must arrive from elsewhere, the seeding step changes. | Entered on the board in the MVP, with imported data as a later path. |
| G4 | **Q7** — where does each of paid / promised / lost send the row? | Step 4 is unbuildable without knowing the destination of each outcome. | Paid and lost move to a settled section below the board; promised stays on the board and is tagged. |
| G5 | **Q8/Q9** — is there a fourth "not reached" state, and does a promise have a date? | Both change the mark interaction in step 4. | No fourth state in the MVP; a promised row carries an optional date, because it is one field and a chase board without it is weaker. |

If these are unanswered when the build starts, I will build the defaults and say so loudly at every demo. That is a stall-avoidance mechanism, not an agreement.

---

## Phase A — Proof (steps 1–4)

The goal of this phase is to find out, on a phone, whether the one-page promise survives contact with 50 real-looking rows and three actions. Mistakes found here cost minutes.

### Step 1 — The board, drawn, with fake rows
**Build:** one screen, one page. Header with totals placeholders. A list of 8–10 hardcoded rows: patient name, a reason tag, a rupee amount, three action buttons. Phone layout, 375 px, one-handed.
**What I can see on a phone:** the whole board, scrollable, with rupee amounts and the three buttons reachable without zooming. Nothing works yet.
**Verification:** open at 375 px and 1440 px. Check the amount and the three buttons are tappable at 44 px. Check no row scrolls sideways. Screenshot both widths and look at them. A row that clips the amount fails the step.
**Time:** 45 min.

### Step 2 — Real rows from the database, seeded
**Build:** the Supabase project, the `patients` / `obligations` / `outcome_events` schema, row-level security, seed data for ~10 patients and ~25 obligations, and the board reading from it. The event log is created here, empty.
**What I can see on a phone:** the same board, now showing seeded real rows with real rupee values and the totals computed in the database.
**Verification:** run the totals query by hand for the seeded data and compare it to the number rendered on the phone. They must match to the paise. Write the expected sum into a test and run it. A mismatch fails the step.
**Time:** 60 min.
**This is where the expensive decision happens** — see the section below.

### Step 3 — Login, and only your rows
**Build:** email OTP login, an account per user, and row-level security proven with two seeded accounts.
**What I can see on a phone:** log in with an email code, land on a board containing only that account's rows.
**Verification:** log in as account A, note a row name. Log in as account B, confirm that name is absent. Attempt to read account A's row directly with account B's session and confirm it is refused. Both checks are the test; "the login screen appeared" is not.
**Time:** 45 min.

### Step 4 — The mark that moves the row and changes the total
**Build:** `mark_outcome()` as a Postgres function: validate the outcome, append an event, change the obligation status, return the new totals. The three buttons wired to it with optimistic UI. Rows move per G4's answer.
**What I can see on a phone:** tap **paid** on a row. The row leaves the board, the total drops by exactly that row's amount, and the row is visible in the settled area. Repeat for **promised** and **lost**.
**Verification:** three tests, one per outcome. Each asserts the row's new place, the event row written, and the header total changed by exactly the row amount. Then do it by hand on the phone and compare against a calculator. Any discrepancy fails the step.
**Time:** 75 min.

**Phase A exit criteria — tick these, not a feeling:**
- [ ] The board opens on a phone at 375 px with no sideways scroll.
- [ ] The totals on screen equal a hand-summed total, to the rupee.
- [ ] Two accounts cannot see each other's rows, proven by a refused read.
- [ ] Each of paid / promised / lost moves the row and changes the total by exactly that row's amount.
- [ ] Every one of the above has a written test in the repo, and the test suite passes.

---

## Phase B — Trust (steps 5–7)

The goal of this phase is to make the board trustworthy enough that the physio would chase from it instead of a notebook. The failure mode to catch here is a board that looks right and is quietly wrong.

### Step 5 — The three reasons, visibly different
**Build:** reason tags on every row (`money pending`, `session missed`, `feedback not asked`), a row that can carry more than one, and the header count of rows and reasons.
**What I can see on a phone:** a row that says *pending + missed*, and a row that says only *feedback not asked*, and the counts above matching what is visible.
**Verification:** seed one patient of each reason type and one with two reasons. Assert the tag set per row and the counts. Then read the screen and check the counts match the rows you can count by eye on the phone.
**Time:** 45 min.

### Step 6 — Honest edges: empty, all rows, and where the row went
**Build:** the empty state, the "showing all N" line, the settled/lost area below the board, and an inline expand on a row showing its outcome events.
**What I can see on a phone:** an empty board that says it is empty and why, an "all N rows" line that cannot be hidden, and a row you can tap to see the calls already made on it.
**Verification:** test with zero rows, one row, and 60 rows. Assert the count line equals the row count in every case. Mark a row, then expand it and confirm the event is there. "It looked fine" does not pass.
**Time:** 45 min.

### Step 7 — Offline marks that do not vanish
**Build:** the IndexedDB outbox, idempotency keys on the mark call, pending/reconciled row states, and retry on reconnect.
**What I can see on a phone:** put the phone in airplane mode, mark a row paid. The row shows *pending*. Turn the network back on. The row reconciles and the total settles once — not twice.
**Verification:** the double-submit test is mandatory: replay the same idempotency key twice and assert one event, not two. Then do the airplane-mode test by hand and confirm exactly one event exists afterwards.
**Time:** 90 min.

**Phase B exit criteria:**
- [ ] Every row shows why it appears; a row can show more than one reason.
- [ ] Visible counts equal countable rows at 0, 1 and 60 rows.
- [ ] No default filter can hide rows, and the "all N" line proves it.
- [ ] A marked row can be expanded to show what happened to it.
- [ ] A mark made offline survives a reconnect and creates exactly one event.
- [ ] All of the above have tests, and those tests pass in CI.

---

## Phase C — Ship (steps 8–10)

### Step 8 — The totals, defined and frozen
**Build:** the final set of header totals per G2, one query, and a test fixture that recomputes every total from the event log.
**What I can see on a phone:** the agreed totals, matching a hand count on the same seed.
**Verification:** a property test over a randomised event log: sum of events equals the header. This is the test that protects the PRD's "every rupee is visible" metric.
**Time:** 30 min.

### Step 9 — Live on a public URL
**Build:** the production build, Cloudflare Pages deploy, custom SMTP (Resend) for login codes, and PITR enabled.
**What I can see on a phone:** the board at its real URL, over mobile data, with a login email arriving in a real inbox.
**Verification:** open the live URL on the phone and paste the status line. Log in end to end with a real email. Mark one row live and confirm the total changes. Enable backup/PITR and confirm it shows as on.
**Time:** 45 min.

### Step 10 — Phone polish and the last mile
**Build:** touch target pass, the one-handed reach check, loading and error states, and the "no rows" copy.
**What I can see on a phone:** the same board, but nothing jumps, nothing clips, and every action is reachable with a thumb.
**Verification:** screenshot at 375 px and at 1440 px and read both. Tap every action once. No element smaller than 44 px.
**Time:** 30 min.

**Phase C exit criteria:**
- [ ] Header totals reproduce from the event log in a test.
- [ ] The live URL loads on a phone over mobile data (status line pasted).
- [ ] A real login email arrives end to end.
- [ ] One real mark is made live and the total changes.
- [ ] Backups/PITR confirmed on.
- [ ] Screenshots at 375 px and 1440 px exist and were looked at.

---

## Decisions most expensive to reverse, and where they happen

| Decision | Step | Why it is expensive | What to do before that step |
|---|---|---|---|
| **The data model: append-only event log, board as a projection** | **Step 2** | It is the only record of what the physio did. Losing it means losing the history the PRD needs for Q7, Q8 and the "every rupee" metric. | Nothing to build — but it must be committed before the first write path exists. Do not "simplify" it at step 4. |
| **Row = obligation, not patient** (G1) | **Step 1–2** | Changing it later changes what a row means, what the totals sum, and what an event points at; the UI and totals get rebuilt. | Get G1 answered before step 1. The default (obligation-level) is the reversible direction. |
| **The meaning of "at risk"** (G2) | **Step 2, finalised step 8** | Every total and every metric is computed from it. Two definitions cannot coexist. | Lock it in writing at G2 before step 8. |
| **Auth is email OTP, not phone OTP** | **Step 3** | If physios will not use email, the login step is redone and every demo needs re-testing. | Cheap to reverse in code, expensive in user trust. Test with three real physios before step 9. |
| **Offline model: outbox, not sync engine** | **Step 7** | Only becomes expensive if Q11 makes two people mark the same board; then the client data layer is replaced. | Confirm Q11 (solo vs shared) before step 7. |
| **Supabase as the single vendor** | **Steps 2–3** | Real lock-in, but a weekend to unwind at 100 users. | Accepted deliberately in `TECH-STACK.md`. |

The ordering is deliberate: the two genuinely expensive decisions — the event log and the row meaning — happen at steps 1 and 2, before any UI, auth or offline code exists to unwind. The cheapest-to-reverse things (host, email provider, OTP type) happen last.

---

## What we drop if we run short tonight

Dropped in this order, lowest value first:

1. **Step 10 polish** — ship the unpolished board; it is still usable.
2. **Step 9 custom domain** — stay on the generated hostname, ship anyway. The public URL exists; it is just uglier.
3. **Step 8 extra totals** — keep the single at-risk total, drop the secondary figures. One correct number beats four disputed ones.
4. **Step 7 pending animations** — keep the outbox and idempotency, drop the visual pending state. The rupee safety stays; only the reassurance goes.
5. **Step 6 inline history expand** — drop the expand, keep the "all N" line and the settled area. The PRD's "where did the row go" becomes less convenient, not absent.

**Never dropped, even at 2 a.m.:** the event log (step 2), row isolation (step 3), one-event-per-mark idempotency (step 7), and the totals test (step 8). Cutting any of those ships a money board that lies.

If we are short before step 4, stop and ship nothing. A board that shows amounts but cannot record an outcome is worse than the notebook, because it looks like progress.

---

## Verification, as a rule rather than a step

Every step above is marked complete only after its stated test exists and passes, in this order:

1. **Write the failing check** for the step's claim — a unit test for money and outcomes, a query assertion for totals and isolation, a browser check for the screen.
2. **Run it and see it fail.** If it passes before the code exists, the test is wrong.
3. **Build the step.**
4. **Re-run the check and see it pass.** Paste the output.
5. **Look at the screen on a phone.** Screenshot at 375 px. A passing test on a screen that clips the amount is still a failure.

A step with no failing-then-passing evidence is not done. "It should work" is not evidence, and neither is a test that would pass with the feature removed.

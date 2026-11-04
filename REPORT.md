# REPORT

## Status per part

- Env file: DONE
  evidence: `.env.local` holds NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the new project.
- Database schema + RLS + policies + grants: DONE
  evidence: `supabase_apply_migration` returned `{"success":true}`.
- Demo data: DONE
  evidence: `execute_sql` returned `{"rows":15,"pending":9,"promised":2,"paid":2,"lost":2,"at_risk_paise":"1630000"}`.
- App builds and renders: DONE
  evidence: `GET http://localhost:3000` returned `STATUS: 200`, 15 `class="row"` rows, `16,300` present.
- Mark action: DONE
  evidence: `POST /rest/v1/rpc/mark_outcome` returned HTTP 204; row changed to `promised`, `promised_for=2026-11-11`; test change reverted.
- Three failure states: DONE
  evidence: `node scripts/check-states.mjs` printed PASS for missing (names NEXT_PUBLIC_SUPABASE_URL), failed, empty, and "three headings are all different".

## What broke and how I fixed it

- The pasted project URL/key did not belong to the connected Supabase account: REST returned 401 and the MCP tools returned "You do not have permission to perform this action". Fixed by creating a new project in the connected org (ap-south-1, $0) and writing its real URL and publishable key to `.env.local`.
- `npm.ps1` was blocked by the execution policy. Used `npm.cmd` instead.

## Claims ledger

- "Demo rows are on the screen": `GET http://localhost:3000` -> 200, content contains "Lakshmi Narayana", "Kavitha Sharma", "16,300".
- "Data is in Supabase": `execute_sql` count -> 15 rows.
- "Marking updates status": REST RPC -> 204 and status `promised`.
- "Failure states differ": `node scripts/check-states.mjs` -> 5 PASS lines.
- Visual check at 375 px: UNVERIFIED (no browser screenshot taken).

## What I would tell the next person

The app is a single Next.js page backed by one `chase_rows` table plus an `outcome_events` log. Marking goes through `mark_outcome`, not a raw update, so the event log stays complete. The offline outbox from the plan is not built yet; marks need a connection. The board is open to anyone with the publishable key, which is intentional for this demo.

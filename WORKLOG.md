# WORKLOG

- Wrote .env.local with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -> Test-Path .env.local -> exists
- Pasted project hgzccdasmfventnekbok was unreachable -> GET https://hgzccdasmfventnekbok.supabase.co/rest/v1/ with its publishable key -> STATUS 401; supabase_get_project -> "You do not have permission to perform this action"
- Created project payment-chase-board (ap-south-1) -> supabase_create_project -> id nvqaipxbuzquwaugrxyl, status ACTIVE_HEALTHY
- Wrote new real URL and publishable key to .env.local -> read file -> https://nvqaipxbuzquwaugrxyl.supabase.co
- Applied schema + RLS + grants + mark_outcome + 15 demo rows -> supabase_apply_migration payment_chase_board -> {"success":true}
- Checked demo rows -> execute_sql count/sums -> rows 15, pending 9, promised 2, paid 2, lost 2, at_risk_paise 1630000
- State unit checks -> node scripts/check-states.mjs -> "PASS missing state names the setting: NEXT_PUBLIC_SUPABASE_URL" and 4 more PASS lines
- Tested mark path with publishable key -> POST /rest/v1/rpc/mark_outcome (Ravi Teja -> promised) -> HTTP 204, status promised, promised_for 2026-11-11
- Reverted test change -> execute_sql delete event + update status pending -> events 0
- Started one dev server -> npm.cmd run dev -> Next.js 16.4.5 Ready, Local http://localhost:3000
- Opened the page -> GET http://localhost:3000 -> STATUS 200, 15 rows, "16,300" present

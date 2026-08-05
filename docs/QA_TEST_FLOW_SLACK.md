:mag: *Hermoso — QA Test Flow Guide (Web + Mobile)*

This walks QA through exercising Hermoso end-to-end on the *web app* and *Android app* using test accounts. Full repo version (with tables): `docs/QA_TEST_FLOW.md`. Pair with the Postman collection for direct API testing.

━━━━━━━━━━━━━━━━━━━━

*1. Environments*

*Live (Vercel) — use this for QA*
• Backend API: https://hermoso-rx6j.vercel.app/  (`/api/...`)
• Web app: https://hermoso-seven.vercel.app/
• Mobile app: latest APK, shared separately in this channel — just install, no build needed

:warning: Before testing: confirm with the dev team whether the live DB already has the seeded test accounts below, or if separate staging creds were issued. The seed script wipes and regenerates data, so it must *not* be run against production without sign-off. Also confirm the APK points at `https://hermoso-rx6j.vercel.app/` — if requests fail silently or time out, check that first.

*Local dev (optional, offline testing only)*
• API: `cd server && npm run dev` → `http://localhost:5000/api`
• Web: `cd client && npm run dev` → Vite dev server
• Mobile: run from Android Studio, emulator uses `10.0.2.2:5000`
• Seed data: `cd server && npm run seed` (local DB only)

━━━━━━━━━━━━━━━━━━━━

*2. Test Users*

All pre-verified — no OTP needed to log in with these:
• *Super Admin* — `admin@hermoso.app` / `Admin@123` — full platform access
• *Salon Owner* — `shahrooz.alta.dev+owner0@gmail.com` ... `+owner99@gmail.com` / `Owner@123` — 100 owners, one per salon
• *Staff* — `shahrooz.alta.dev+staff0@gmail.com`, etc. / `Staff@123` — API-only, no UI yet (see Known Gaps)
• *Customer* — `shahro.naro89+customer0@gmail.com` ... `+customer49@gmail.com` / `Customer@123` — 50 customers

On live: verify these creds actually exist there first (see warning above). To test *register → OTP → login* itself, use a brand-new email not in this list.

━━━━━━━━━━━━━━━━━━━━

*3. Web App — Role-Based Flow*

Roles route automatically after login:
• `super_admin` / `admin` → `/admin/*`
• `salon_owner` → `/owner/*`
• `customer` → `/customer/*`

*3.1 Auth flow (all roles)*
1. `/register` → new email, defaults to customer role
2. Check email for OTP → `/verify-otp`
3. `/login` → should redirect to the role's section
4. Negative tests: wrong password, unverified login, bad/expired OTP, resend OTP

*3.2 Customer* (`/customer/*`)
`salons` (landing) → `salons/:id` (detail) → `scan` (AI skin scan) → `scan-results` (score + treatment/diet plan) → `matched-salons` → `booking` → `bookings` (history) → `progress` (tracking) → `profile`

*3.3 Salon Owner* (`/owner/*`)
`dashboard` → `services` (check `aiScanLink` field) → `events` → `pos` → `staff` → `bookings` → `customers` → `reviews` → `revenue` → `notifications` → `profile` (incl. "South Asian specialist" toggle)

*3.4 Admin* (`/admin/*`)
`dashboard` → `analytics` → `salons` (test PENDING → APPROVED) → `bookings` → `customers` → `reviews` → `revenue` → `payouts` → `notifications` → `settings` → `profile`

━━━━━━━━━━━━━━━━━━━━

*4. Mobile App (Android) — Role-Based Flow*

Install the APK, allow unknown sources if sideloading. Only *customer* and *salon_owner* have mobile UI today.

*4.1 Launch & Auth*
Splash (session check) → Auth screen (Login / Register / Verify OTP, same sequence as web) → role-based landing: `salon_owner` → Owner Dashboard, everyone else → Home

*4.2 Customer* (bottom nav: Home / AI Scan / Bookings / Progress)
Home → AI Scan (camera, live face-detection overlay, 8-category checklist) → Scan Results (fetched from `/api/scans/latest`) → Matched Salons → Salon Services/Detail → Booking (plain, pre-selected salon, pre-selected salon+service, or AI-scan-driven) → Bookings List (always reloads fresh — verify explicitly) → Tracker/Progress → Profile / Notifications (top bar, any screen)

*4.3 Salon Owner* (bottom nav: Dashboard / Calendar / Services / Insights)
Owner Dashboard → Owner Calendar → Owner Services → Owner Insights → Profile / Notifications (owner theme uses distinct purple background — good visual regression check)

*4.4 Session & Logout*
Logout revokes refresh token + clears session → Auth screen. Also test forced logout: invalidate token server-side, confirm app catches the 401 on next notification poll and bounces to Auth.

━━━━━━━━━━━━━━━━━━━━

*5. Cross-Platform Consistency Checks*

Run the same test user through both clients:
• Register → OTP → login
• Complete AI scan → view results
• Book via scan-recommended salon
• Booking appears in owner's queue (web `owner/bookings` vs mobile Owner Calendar/Dashboard)
• Booking status update reflects for customer on both
• Notification badge count matches on both

━━━━━━━━━━━━━━━━━━━━

*6. Known Gaps*
• *Staff role* — no web/mobile UI yet, API-only (use seeded staff creds via Postman)
• *iOS* — not covered here, confirm feature parity with the team before including in a QA pass
• Treat any "% complete" claims in other internal docs as stale — go by what's actually live

━━━━━━━━━━━━━━━━━━━━

*7. Reporting Bugs*
Include: role used, exact test account, platform (web/mobile + OS version), steps, expected vs. actual, screenshots. Check `docs/trello-board.md` for existing tracked issues before filing duplicates.

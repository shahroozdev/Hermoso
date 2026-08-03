# Hermoso iOS - Screen List & Navigation Flow

> Verified against the real Android source (2026-08-02 audit). Corrections/exact-behavior notes vs. the earlier draft are marked ⚠️.

## ⚠️ CRITICAL: dead code in the Android source — do not port

The Android app has leftover/unused implementations that must NOT be used as the port source of truth:

1. **Scan camera**: `ScanScreen.kt` is the ONLY one wired into navigation and has the real liveness-detection flow. `ScanCameraScreen.kt` + `ScanCameraComponents.kt` are dead code — an oval face guide with a hardcoded `for i in 0..100 { delay(50) }` fake progress loop that never captures a real photo (`onScanComplete(ByteArray(0))`). Build iOS scan camera from `ScanScreen.kt`'s spec below, not this.
2. **Scan results**: `ScanResultsScreen.kt` is the one actually reached via navigation (route `scan-results`, re-fetches `GET scans/latest`) and is the correct spec for the CR-08→CR-15 detailed report. `ScanResultsComponents.kt`'s `*Section` composables (dark-theme variant, roman-numeral treatment priority cards, gold/silver/bronze medal colors, different score-ring animation) are unused dead code — nothing calls them. Build iOS results screen from `ScanResultsScreen.kt`'s spec below.
3. There is also a **third, lighter-weight result view** baked directly into `ScanScreen.kt` (shown immediately after capture, before navigating away) — this only shows `summary` + `metrics` + `recommendedServices` (legacy fields), NOT the full detailed report. Its "View Full Plan" button navigates to **Recommendations**, not to the full Scan Results screen. See Screen 4 and Screen 4b below — these are two distinct screens/states, not one.

## Navigation Hierarchy

```
HermosoApp
├── SplashView (auto-navigate based on session)
│
├── AuthView (if not logged in)
│   ├── LoginMode (default)
│   ├── RegisterMode (toggle)
│   │   └── RoleSelection: Customer | Salon Owner
│   └── OTPVerificationMode (after register)
│
├── CustomerTabView (role == "customer")
│   ├── Tab 1: HomeView
│   ├── Tab 2: ScanView
│   ├── Tab 3: BookingsListView
│   └── Tab 4: TrackerView
│   │
│   └── [NavigationStack pushes from any tab]
│       ├── ScanResultsView (after scan complete)
│       ├── RecommendationsView
│       ├── MatchView → BookingView (AI booking)
│       ├── BookingView (multi-step: salon → service → staff → date → slot)
│       ├── SalonServicesView(salonId)
│       ├── SalonsListView(city)
│       ├── ProfileView
│       └── NotificationsView
│
├── OwnerTabView (role == "salon_owner")
│   ├── Tab 1: OwnerDashboardView
│   ├── Tab 2: OwnerCalendarView
│   ├── Tab 3: OwnerServicesView
│   └── Tab 4: OwnerInsightsView
│   │
│   └── [NavigationStack pushes]
│       ├── OwnerClientsView   ⚠️ unreachable in current app — no tab, no nav call site anywhere
│       ├── ProfileView
│       └── NotificationsView
```

### Exact Android route table (for reference — iOS routes/enum cases should map 1:1 in meaning, not literal strings)

```
splash, auth
home, scan, scan-results, recs, match, tracker
booking, booking/{salonId}, booking/{salonId}/{serviceId}, booking-ai/{salonId}/{services}
salon-services/{salonId}, bookings-list, salons?city={city}
owner-dashboard, owner-calendar, owner-services, owner-clients, owner-insights
profile, notifications
```

### App-shell behaviors worth replicating exactly

- Header (AppHeader) and bottom nav are only shown once logged in and past Splash — not on Splash/Auth.
- **Session refresh on launch**: if a refresh token exists, silently call `/auth/refresh` on app start (no forced navigation on success/failure from this call alone).
- **Unread notification count**: refetched on every navigation change while logged in (`GET notifications?page=1&limit=1&unreadOnly=true`, using its `meta.total`) — not a timer/poll loop, just re-triggered per nav event. A 401 from this specific call is the ONE place that force-logs-out and redirects to Auth with a full stack pop. 401s elsewhere are handled silently by the network layer's token-refresh-and-retry (see API_REFERENCE.md), falling back to a local error state, not a forced redirect.
- Bottom nav "Bookings" tab is considered "selected" for `bookings-list`, `booking`, `booking/{salonId}`, and `booking/{salonId}/{serviceId}` — but NOT for the AI booking route. Tapping the Bookings tab always forces a fresh list reload (no state restore), unlike the other three tabs which restore prior scroll/state.
- AppHeader visually renders identically for Customer and Owner — the `isOwnerTheme`-style differentiation some docs implied does not actually exist in the running app.

---

## Screen Details

### 1. SplashView
- Check session existence (refresh token in Keychain)
- Auto-refresh token if session exists
- Navigate to Auth or appropriate home based on role
- Show Hermoso logo + branding

### 2. AuthView
- **Login Mode:** Email + Password fields, Login button, toggle to Register
- **Register Mode:** Name, Email, Phone, Password, Role toggle (Customer/Salon Owner)
- **OTP Mode:** 6-digit OTP input, resend OTP option
- Validation: email format, password min 6 chars, name min 2, phone min 10 digits

### 3. HomeView (Customer)
- Greeting header with user name, time-based greeting
- Search bar for salon search
- Categories horizontal scroll (load from `/categories`)
- Top Salons horizontal scroll (`/salons?city=detected`)
- Events horizontal scroll (`/events`)
- Location permission: resolve city, show salons near detected city
- Distance calculation using Haversine formula

### 4. ScanView (Camera + Face Detection)
- Background: near-black purple `#0A0614` (distinct from `purpleDeeper`), 400pt camera preview box.
- **Liveness Check Steps** (state machine is one-directional/sticky — once advanced it doesn't regress):
  1. BLINK — validation message "Blink your eyes"; advances when both `leftEyeOpenProbability < 0.2` AND `rightEyeOpenProbability < 0.2`
  2. SMILE — "Now, give us a smile"; advances when `smilingProbability > 0.7`
  3. TURN_LEFT — "Turn your head slightly left"; advances when head yaw (Y rotation) `> 20°`
  4. COMPLETED — "Face Verified! Ready to scan."; enables "Analyze Now" button
  - At every step: if `|head roll (Z rotation)| > 10°` → blocks with "Keep your head straight" regardless of current step. 0 faces → "No face detected". >1 face → "Only one face allowed".
- Face overlay border: green when valid, yellow when a face is detected but not yet valid, translucent white when no face. Border thickness animates 2pt → 4pt on valid. While face detected but not valid, a horizontal scan-line sweeps top-to-bottom (2000ms, linear, reverses).
- Below the validation message (while face detected, pre-completion): three small step badges "Blink" / "Smile" / "Turn Left" — green if done, light-purple-with-border if active/current, translucent if not yet reached.
- **Capture**: front camera → mirror horizontally before upload → JPEG quality 80 → multipart field name literally `"image"` → `POST /scans/analyze`.
- While awaiting the analysis response: show the captured photo dimmed (40% black overlay) with a spinner + "Analyzing Skin..." text.
- **On success**, this screen shows a lightweight in-place result (NOT the full report — see 4b below): summary text, a `metrics` list as gradient progress bars, `recommendedServices` as tag pills, then "Retake" and **"View Full Plan" → navigates to Recommendations (screen 4c), not to the full Scan Results screen**.
- If the analyze call throws, the UI currently shows no explicit error state (a silent-failure gap in Android — recommend iOS show a real error here instead of replicating the silent failure).

### 4a. Full Scan Results Report (reached separately, NOT directly after capture)
This is a **separate navigation destination** (fetches `GET /scans/latest` fresh — it is not fed by the ScanView capture result in memory). Reached via any "View Report" / deep-link style entry point, not via ScanView's own "View Full Plan" button (that goes to Recommendations instead — see 4c).
- **Overall Skin Health Score** — animated ring (1000ms ease), 16pt stroke, color/number by threshold: `≥75` green `#10B981`, `≥50` amber `#F59E0B`, `<50` red `#EF4444`.
- Summary card (plain text, only if non-blank).
- **Analysis Sections** (each a card with a colored progress bar per metric + a vertical list of "Recommended Treatments" tag pills):
  - Skin Tone & Tanning — tone, evenness bar (`#A855F7`), tanning pattern
  - Eyebrow Assessment (only if data present) — arch shape, fullness "n/5", symmetry bar (`#3B82F6`), tail length
  - Hydration & Texture — hydration bar (`#0EA5E9`), texture bar (`#10B981`), dehydration zones list, pore condition
  - Dark Circles — type badge with exact color/label mapping (Type 1 Pigmentation `#A855F7`, Type 2 Vascular `#3B82F6`, Type 3 Structural `#F59E0B`), severity, color-delta as a progress bar
  - Acne & Breakout Zones — overall severity bar (`#EF4444`); zones filtered to exclude `type == "none"`, each shown with a small red progress bar; "No active acne zones detected" empty state
  - Lip Pigmentation — darkness level, melanin index bar (`#DB2777`), unevenness bar (`#F97316`), dryness bar (`#F59E0B`)
- **AI Treatment Priority Plan** — sorted by priority ascending; circular priority-number badge colored red (1) / amber (2) / green (3+); name, reason, price range, duration.
- **Diet & Nutrition Plan** — "Foods to Eat" (green header, ✓ marks) / "Foods to Avoid" (red header, ✗ marks) / daily water intake in a light-blue pill with a water-drop icon.
- Action buttons: "View Matched Salons" (filled) → MatchView, "Re-scan" (outlined) → ScanView. Share button exists in the toolbar but is currently a no-op stub in Android (safe to implement properly in iOS, or match the stub — your call).

### 4c. RecommendationsView (a separate, simpler screen — distinct from the full report)
Reuses `GET /scans/latest` but only reads `summary` + `recommendedServices` (the legacy top-level fields, not the CR-08+ breakdown).
- Header: 2-stop gradient `[purpleDark, purple]` (not the 3-stop global header gradient).
- Count badge (circle, pale-purple bg) showing number of recommended services.
- Each service card is tappable and navigates to the **generic** Booking flow (no salon/service preselected — context is lost here in Android; consider preselecting in iOS if that's a UX improvement worth making, otherwise match).

### 6. MatchView
- List of matched salons from `/scans/matches`
- Each card: name, city, match %, matched services as non-clickable tag pills (pale-purple bg, purple text)
- "Book Now" (disabled if no salonId) → AI BookingView, route encodes salonId + comma-joined matched services (URL-encoded)
- Header gradient `[textDark, purpleDark]` (⚠️ uses `textDark`, not `purpleDeeper` — an outlier vs other headers)
- Retry on error

### 7. BookingView
- Header gradient: 3-stop `[purpleDeeper, purpleDark, purple]`, title switches between "AI Recommended Treatments" and "Booking Details" depending on mode.
- **Standard flow:** 5-step form, all steps in one scroll view, numbered "1. Select Salon" … "5. Available Slots":
  1. Select Salon (custom dropdown; **locked/disabled** if arriving with a preselected salon)
  2. Select Service (dropdown, filter by salon, options show `"{name} (PKR {price})"`)
  3. Select Specialist (dropdown, filter by salon)
  4. Select Date (custom calendar component — see below; picking a past date clamps to today)
  5. Select Time Slot (`GET /bookings/availability`, only fires once salon+service+staff+date are all set; wrap/flow layout of chips — unavailable slots are greyed out and disabled, selected slot is filled purple)
  - **Cascading resets**: changing Salon clears Service/Staff/Time and reloaded service/staff lists; changing Service clears Staff/Time; changing Staff clears Time.
  - Booking Summary card (salon, service, specialist, formatted date "EEE, d MMM yyyy", time, total — total highlighted).
  - Confirm Booking button — disabled unless all 5 fields are set and not currently submitting. On success: green success text, only the time selection is cleared (other fields stay, allowing a quick repeat booking) — no navigation away.
  - If only a service (not full AI match) was preselected, once the services list loads it auto-selects that service.
- **AI Booking flow** (`isAiBooking`, pre-selected treatments — separate UI, not steps 1-5):
  - Info banner: "AI-Recommended — Book each treatment separately with your preferred staff"
  - Treatment-to-service matching: case-insensitive substring match in **either direction** between the AI treatment name and each loaded service name (runs once).
  - Each matched service renders as an **independent** mini booking flow (own staff/date/slots/submit state, own success/error message) — i.e. N separate cards, not a single shared multi-step form. Selecting a card's staff or date resets that card's slots only.

### CalendarView component (used by BookingView)
- Custom component, not a native date picker. White rounded container. Header row: "{Full Month} {Year}" + `<`/`>` arrow buttons only (no swipe gesture, no week-view). Weekday row is single letters `S M T W T F S` starting **Sunday** (not Monday). 7-column grid, 32pt circular day cells: selected = filled purple + white bold text; today (unselected) = purple bold text, no fill; other days = plain dark text.

### 8. BookingsListView
- `GET /bookings?page=1&limit=50` (fetches all-time list, no date/status filtering in the UI)
- Each item: service name (bold), salon name (muted), `"{date} - {time}"` (muted), status badge + `"PKR {price}"` (purple)
- Pull-to-refresh; empty state "No bookings yet."

### 9. TrackerView
- `GET /scans/improvements`. Header gradient `[#0F0A1A, purpleDeeper]`.
- Summary card: scan count, first/latest scan timestamps — ⚠️ Android shows these as **raw unformatted ISO strings** (doesn't run them through the date formatter used elsewhere); consider formatting properly in iOS as an improvement, or match exactly if strict parity matters.
- Each metric: label + delta (green if `positive != false`, i.e. `null` also renders green — red only when explicitly `false`), before/after values, horizontal progress bar sized to the "after" value (0–100 clamp).
- Empty state: "Need at least two successful scans to show progress." when fewer than 2 valid scans exist.

### 10. ProfileView
- Load profile from `/users/me`; viewing this screen also re-persists the session's cached name/role from the response as a side effect.
- Editable fields: Name, Phone, City, Country, Bank Account. **Email field is read-only/disabled** and is never sent in the update — treat email as immutable in the iOS form too.
- Validation: name required, ≥2 chars; phone (if provided) must be ≥10 chars.
- Change Password section: current + new password (both masked); new must be ≥6 chars and different from current.
- Settings: "Scan Result Alerts" / "Booking Reminders" toggles — ⚠️ these are **local UI state only** in Android, never read from or written to any API. Decide deliberately whether iOS should actually wire these up or intentionally match the no-op behavior.
- Save profile → `PATCH /users/me` with `{name, phone, city, country, bankAccount}` only.

### 11. NotificationsView
- `GET /notifications?page=1&limit=50`
- Unread items: pale-purple background card; read items: white. Tapping the trailing close icon on an unread item **optimistically** marks it read locally, then fires `PATCH /notifications/{id}/read` in the background — Android does not roll back on failure (silent). Timestamp format `"dd MMM, yyyy h:mm a"`.

### 12. SalonsListView
- Two live search fields (name + city), no debounce — fires on every keystroke.
- Each row: image, name, **5 static star icons** (filled count = `floor(rating)`), and ⚠️ a **hardcoded fake "· 0.8 km" distance label on every single salon** (an explicit Android code comment admits this is mock data, not computed) — unlike HomeScreen's salon cards, which compute real distance. Recommend iOS compute real distance here too rather than replicating the fake value, unless exact parity is required.
- Tap → SalonServicesView

### 13. SalonServicesView
- Hero: 300pt image with dark gradient overlay for legibility (or a purple gradient fallback if no image) — name, location, description, rating badge overlaid on the hero.
- Services list below, each selectable (selected = purple-tinted bg + purple border, no shadow; unselected = white + shadow).
- Sticky bottom bar appears only once a service is selected, showing the service name + "Book Now" → BookingView(preselect salon + service). List content has bottom padding reserved so the sticky bar never covers the last item.

### 14. OwnerDashboardView
- `GET /analytics/owner/dashboard`. Two rows of stat cards (dark purple bg): Today's Bookings / Upcoming Appointments, then Gross Revenue / Net Revenue (both `"PKR {int}"`).
- **AI Scan Referrals card is conditional** — only rendered when `aiScanBookings > 0 || aiScanRevenue > 0` (green-tinted card, "✨ AI Scan Referrals" header, bookings count + revenue).
- "Bookings by month" — a plain list of month/count rows in cards, **not an actual chart** despite earlier docs implying one; no charting library is used in Android.

### 15. OwnerCalendarView
- ⚠️ Despite the name, this is **not a real calendar UI** — it's `GET /bookings?page=1&limit=50&date={today}` (today's date only, no date picker, no month grid, no way to view other days). Each row: `"{time} - {clientName}"` + service name. If iOS wants an actual calendar/date-picker here, that would be a deliberate improvement over Android, not a port — flag this decision explicitly rather than silently diverging.

### 16. OwnerServicesView
- `GET /services?page=1&limit=100`. ⚠️ **Read-only list** — despite being named a "management" screen, there is no add/edit/delete UI in Android at all. Just name/duration/price rows. Decide deliberately if iOS should add real CRUD or match the read-only behavior.

### 17. OwnerClientsView
- `GET /customers?page=1&limit=100`. Name/email/phone rows, no search/filter.
- ⚠️ **Unreachable in the current Android app** — no bottom-nav tab, and no other screen navigates to it. It exists in code but is effectively dead. Worth deciding whether iOS gives it a real entry point (e.g. from OwnerDashboard) or leaves it similarly orphaned.

### 18. OwnerInsightsView
- ⚠️ **Not backed by a real insights/analytics API and has no charts.** It reuses the same `/analytics/owner/dashboard` endpoint as OwnerDashboardView and builds a single templated sentence client-side: *"AI suggests promoting your top service this week. You have {upcoming} upcoming bookings and PKR {net} net revenue trend."* Fallback text on error: "Unable to fetch AI insight right now." If iOS wants real revenue/booking trend charts here, that's a genuine enhancement beyond the Android app — call it out as a scope decision, don't assume it's already spec'd.

### 19. AppHeader (Reusable)
- Linear gradient background `[purpleDeeper, purpleDark, purple]`, "Hermoso" wordmark in Cormorant Garamond Light 28pt.
- Notification bell: 36pt translucent-white circle, red badge showing count (caps display at "9+").
- User avatar: 36pt circle, pink→purple gradient, first letter of the user's name (fallback "U"); tapping opens a menu with Profile / Logout.
- Renders **identically for Customer and Owner roles** — there is no role-based header styling in Android despite an unused `isOwnerTheme` parameter existing in the function signature.

### 20. Bottom Nav Bar (Reusable)
- Always white background container regardless of role/theme.
- Customer: Home, AI Scan, Bookings, Progress. Owner: Dashboard, Calendar, Services, Insights (no Clients tab — see screen 17).

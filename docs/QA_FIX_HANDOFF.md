# QA fixes — 10 September 2026

Source: https://docs.google.com/spreadsheets/d/1HQVV9T7DXt_FOiXFba3fiGT1DTYG5waW/edit?gid=247517634

The downloaded sheet contained 167 issues: 129 Closed, 2 Rejected, 1 In Progress, 14 Reopened, and 21 Open. This pass covers the 36 active rows; rejected requirements were not reinstated.

These are local implementation and verification results, not a claim that the deployed application or production database has been repaired. No sheet statuses were changed. No live messages, payments, refunds, or database migrations were executed.

## Why issues kept returning

- The paisa conversion changed required model fields, while older records can retain `price`/`amount` in rupees. The previous BUG-144 fix rejected those services with a clearer message rather than converting their known legacy prices. Booking and payout saves likewise failed required-field validation.
- The migration updated every document from its old fields, even when a document already had paisa values. A rerun or mixed old/new collection could overwrite valid amounts. The revised migration preserves existing paisa values, embedded record metadata, and its completion marker on reruns.
- Event totals were calculated in a save hook, after Mongoose's required-field validation. They now calculate before validation.
- Some fixes addressed only part of QA's acceptance criteria: minimum/maximum fields without an explicit comparison selector; a CSV export without an on-screen consolidated report; a description above the recipient table without the requested columns; date presets whose dates were hidden.
- The OTP recovery link existed, but its resend button used only the URL email. Entering an email after reopening the browser did not enable recovery.
- Services inside a salon view fetched a single page with no pagination controls. Styling the scrollbar alone could not expose the other records.

## Issue coverage

| Bug | Local result |
| --- | --- |
| 063 | Resend uses the entered email, resets its busy state, and verification returns to login without relying on a password left in a closed tab. Existing admin pending-verification indicator retained. Browser checked with mocked OTP API. |
| 097 | Title and description appear as columns in both recipient view and CSV. Browser and CSV checked. |
| 099 | Separate on-screen sent notification report covers all audiences; individual recipient reports and consolidated export remain available. Browser checked. |
| 100 | Existing unselected type and required-type guard confirmed in the browser; no additional default change needed. |
| 107 | Existing 12-word preview now has a bounded, single-line display with full text in the title tooltip. Browser checked. |
| 108 | Working and break times use explicit HH:mm input accepting 00:00–23:59; range validation tightened. Shared time input browser checked through staff shifts. |
| 111 | Shared comparison selector supports =, ≥, ≤ and inclusive between for bookings/spend. Preset dates remain visible. Browser checked. |
| 115 | Amount has the shared comparison selector. Existing other booking filters retained. |
| 124 | Booking count, gross revenue, commission percentage and platform earned use the shared comparison selector. |
| 129 | Payout hydration recovers a known legacy amount before validation/save. Model regression passes. Live payout retest remains. |
| 133 | Price/duration comparisons added; missing description filter added end to end. Legacy price filters retain salon scope. Model query regression passes. |
| 139 | Duration, price, discount and final price comparisons added. Fractional discount filter values accepted by validation. |
| 142 | Selected service chips display horizontally with bounded width and internal scrolling. Six-service browser save passes. |
| 144 | Known legacy service prices and embedded event prices recover to paisa; event totals calculate before validation. Model regression passes. Truly missing/corrupt prices still require verified data repair. |
| 145 | Existing successful-save close/invalidation now works with corrected event pricing. Multi-service save and modal close checked with mocked API. |
| 147 | Main flex content can shrink, headers wrap, laptop KPIs adapt, and modal/table widths are bounded. Admin and owner routes checked at laptop widths; visual acceptance on QA's exact screens remains. |
| 148 | Recipient records scroll inside their table, with modal controls outside the scrolling region. Browser geometry checked with 80 recipients. |
| 149 | Native date/time controls use the correct dark/light color scheme. Dark scheme browser checked. |
| 150 | Button renamed to Export Notification. Browser checked. |
| 151 | Category action icons inherit explicit theme foreground/danger colors. Category controls browser checked; visual contrast acceptance remains. |
| 152 | Case-insensitive category search and reset added. Browser checked. |
| 153 | Salon service table has bounded record scrolling and pagination. Browser geometry checked with 30 service fixtures. |
| 154 | Customer preset dates remain visible and populate using local calendar dates, avoiding UTC month-boundary shifts. Browser checked. |
| 155 | Booking label is Select Period; preset From/To disabled, Custom Range enables manual entry. Local calendar calculation corrected. |
| 156 | Legacy booking price recovered before cancellation validation/save. Model regression passes; live cancellation/refund path remains to retest. |
| 157 | Legacy booking price recovered before confirmation validation/save. Model regression passes; live confirmation remains to retest. |
| 158 | Already-applied review actions disabled; backend atomically rejects repeated actions and actions on removed reviews. Approved button browser checked. |
| 159 | Payout periods include explicit day, month and year with an ASCII “to”; CSV includes UTF-8 BOM for Excel. Shared period formatter used in the receipt. |
| 160 | Receipt downloads as a designed PNG containing payout ID, salon, period, amount, status, date and bank account. Download browser checked. |
| 161 | Same legacy payout recovery as 129. Model regression passes. |
| 162 | Service CSV exports decimal PKR numbers rather than formatted currency text; UTF-8 BOM added. Download contents browser checked. |
| 163 | Event price and final price CSV use decimal PKR numbers. |
| 164 | Staff export traverses all matching pages using the active filters. |
| 165 | Staff ID, name, designation, assigned service, salary comparison, joining-date range, shift-time ranges and status filters implemented on client/server. Controls browser checked. |
| 166 | Staff trigger has a stable wrapper; opening the form no longer adds an extra flex sibling to the toolbar. Button position browser checked. |
| 167 | Explicit HH:mm shift fields accept both 00:00 and 23:59. Browser checked. |

## Verification

- Client production build: passed (existing bundle-size/Browserslist warnings).
- Client and server TypeScript checks: passed. Three existing type inconsistencies were also corrected so these checks can run cleanly.
- ESLint on changed TypeScript files: passed.
- Six database-free Mongoose regression tests: passed. They cover old/mixed/missing service prices, booking/payout validation, event creation and legacy snapshots, and price-filter salon scope.
- Browser checks use local Vite, synthetic accounts and intercepted API responses. Results: `qa-browser-results.json`; runner: `qa-browser-check.cjs`. They verify UI behavior, not production integration.

Commands from the repository root:

```powershell
npm.cmd run build --prefix client
npx.cmd tsc --noEmit -p client/tsconfig.json
npx.cmd tsc --noEmit -p server/tsconfig.json
node --import ./server/node_modules/tsx/dist/loader.mjs --test server/tests/qa-money.test.ts
# Start the client separately, then run with an installed Playwright package:
$env:QA_PLAYWRIGHT_PATH = 'absolute/path/to/playwright'
node docs/qa-browser-check.cjs
```

## Deployment and live retest

Deploy client and server together. Confirm QA's URL runs the new revision before retesting. This session did not establish which revision QA's deployed URL currently serves.

Before any data migration, back up the target database and review the read-only `npm.cmd run migrate:paisa -- --dry-run` output from `server`. The migration has been repaired in code but has not been executed or integration-tested against a database in this session. For an already-marked database, a reviewed rerun requires `--force`; do not run an older copy of the script.

The compatibility layer recovers money only when an existing numeric legacy amount is available, preserving an existing paisa amount including zero. It does not invent amounts or recover values already lost by a previous migration. Review missing/corrupt records against a backup or source transaction. Analytics using raw cross-collection lookups also need the database migration to complete; model hooks do not rewrite those foreign collection lookups.

Retest the original problematic service, an old booking confirmation/cancellation, and an old payout after deployment. Also retest OTP email delivery, actual staff filters/exports, and QA's precise laptop layouts against staging. Only mark sheet rows Closed after that live acceptance pass.

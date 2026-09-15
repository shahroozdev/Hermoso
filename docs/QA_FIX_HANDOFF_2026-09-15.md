# QA follow-up — 15 September 2026

Source: https://docs.google.com/spreadsheets/d/1HQVV9T7DXt_FOiXFba3fiGT1DTYG5waW/edit?gid=247517634

Fresh CSV contains 226 issues: 194 Closed, 2 Rejected, 4 Reopened, 25 Open, 1 In Progress. This differs from the reported three reopened issues: BUG-133, BUG-147, BUG-176 and BUG-196 are all Reopened.

Implemented local fixes for all four reopened issues and 23 new issues. Two new issues require business-rule decisions, detailed below. Existing OTP recovery was regression-tested with intercepted API responses; actual email delivery remains a live check. No deployment or sheet status changes were made.

## Why the reopened issues persisted

- BUG-133: comparison filters existed on the owner Services page but not the services section inside View Salon. That second entry point now has name, category, description, AI Scan, duration and price filters, including comparison operators and reset.
- BUG-147: earlier checks focused on document overflow. Usability also depends on modal content height, control width and record-only scrolling. Added explicit measurements and screenshots for these conditions.
- BUG-176: auto-fit columns stretched two customer range controls across the full container. Filter columns and range controls now have bounded widths.
- BUG-196: the compact password class was attached to the profile-details form. Moved it to the actual Change Password form and bounded the input dimensions.

## Issue coverage

| IDs | Local result |
| --- | --- |
| 133 | Added all service filters to View Salon, retaining salon scope and paisa conversion. Owner Services filters aligned in a compact grid. Browser checks verify strict operator/value payloads. |
| 147 | Existing admin/owner laptop checks pass. Added owner-page width checks at 1024, 1280, 1366 and 1440 pixels; modal and revenue scrolling explicitly checked. |
| 176 | Booking/spend ranges capped at 210px with compact controls. |
| 196 | Correct password form capped at 380px; inputs measured at no more than 36px high. |
| 202 | Main page shows a small saved-rate summary and Edit Commission Rates action. Detailed fields open in a modal; closing discards unsaved edits, successful save closes it. |
| 203, 204 | Owner booking customer/service/staff/date/status filters and reset. Staff-name filter implemented on backend. Filtered CSV traverses all pages. Booking actions now refresh the list and report failures. |
| 205, 206 | Owner customer name/email/status/joined-date filters and reset, matching paginated CSV export. Server retains customer ownership scope and uses the same query for records/count. |
| 207, 208 | Owner review customer/rating/comment/status filters, reset and matching paginated CSV export. |
| 209, 210 | Owner revenue amount/status/created-date/payout-date filters, reset and matching paginated CSV export. Amounts convert from PKR to paisa; dates include the entire final day in UTC. |
| 211 | Working/break time controls use bounded 106px width and 32px height, with explicit accessible labels. |
| 212 | Services table retains a 280px scrolling region showing about four to five rows, independent of salon image. Modal body can scroll to reach the full section; header/footer remain available. |
| 214, 216, 218, 220, 223 | Confirmation dialogs precede salon/owner status changes, customer flag changes, booking cancellation and review moderation. Cancel sends no mutation; duplicate confirmation clicks are guarded. |
| 215, 217, 219, 222, 224, 226 | Consistent additional table-title padding across admin cards. |
| 225 | Revenue controls remain above an internally scrolling records area; pagination remains outside table scrolling. |
| 063 | Existing entered-email OTP recovery regression passes. No new claim about real email delivery or production account recovery. |

## Pending business decisions

These sheet rows explicitly make their acceptance criteria conditional on client approval. Clarification was requested during this pass and no answer had arrived when this handoff was written.

- **BUG-213 — category scope:** the current Category model is global, with a unique name index and no salon ownership field. Confirm global categories with a separate management page, or salon-specific categories. Changing ownership requires a decision about existing shared categories and service references. No category-scope change was made.
- **BUG-221 — cancelled booking reactivation:** current UI only confirms pending bookings. Cancellation can initiate a refund, while the existing backend status endpoint does not enforce a full transition policy. Confirm whether cancellation is final or whether reactivation is supported, including availability checks and payment/refund handling. No reactivation control or new transition policy was introduced.

## Verification

- Client production build passed; existing Browserslist/bundle-size warnings remain.
- Client/server TypeScript checks passed.
- ESLint on changed/new TypeScript files passed after removing an embedded BOM in AdminSalonsPage.
- All 14 server tests passed across `qa-money.test.ts`, `qa-round2.test.ts`, and `qa-sep15.test.ts`. New controller tests use mocked model calls to verify filter propagation and salon scope, not a live database.
- All 16 earlier browser groups passed: [runner](qa-browser-check.cjs), [results](qa-browser-results.json).
- All 15 new browser groups passed: [runner](qa-sep15-browser.cjs), [results](qa-sep15-results.json). Includes a 101-record export spanning two API pages, confirmation cancellation without writes, layout measurements and image-independent table height.
- Screenshots: [salon services](qa-sep15-salon.png), [revenue](qa-sep15-revenue.png).

Browser checks intercept all API traffic and use synthetic accounts. They do not validate production data, real emails, refunds or deployment. Deploy client and server together and retest these cases on staging before QA closes rows. BUG-213 and BUG-221 remain pending decisions; BUG-063 still needs live acceptance.

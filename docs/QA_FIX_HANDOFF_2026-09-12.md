# QA follow-up — 12 September 2026

Refetched the QA sheet (gid 247517634): 201 rows, including 34 Open, 14 Reopened and 1 In Progress. The other rows are 150 Closed and 2 Rejected.

These are local fixes and regression checks. Sheet statuses were not changed; client/server deployment and live acceptance remain outstanding.

## Why bugs reopened

Later working-tree edits restored the default Announcement type and hid preset customer dates, reversing previous acceptance criteria. Both are corrected. New requirements also explicitly request a sent-notification tab instead of a modal, strict comparison operators, denser laptop layouts and a graphical 24-hour picker. These now have implementations and browser coverage. The deployed revision and production data were not available for verification, so a deployment mismatch cannot be confirmed or excluded.

## Active issue coverage

| Issues | Result |
| --- | --- |
| 063 | Existing entered-email OTP recovery rechecked in mocked browser. Actual delivery remains a live check. |
| 100 | Blank required notification type restored; invalid/missing server types rejected. |
| 107 | Existing 12-word service preview and full tooltip rechecked. |
| 108, 167, 199 | Shared 24-hour input now includes hour/minute picker for 00:00–23:59, including staff shifts and salon times. |
| 111 | Customer preset dates visible again; comparison/reset behavior checked. |
| 115, 124, 133, 139, 180 | Compact symbol comparisons, including strict greater/less, propagated through frontend, query validation and backend ranges. Description filter retained. |
| 129, 144 | Legacy payout/service money recovery tests pass. Original production records still require a live retest; missing historical prices cannot be invented. |
| 142, 145 | Multiple selected services remain horizontally scrollable; event creation closes the modal in browser tests. Event pre-validation total calculation regression passes. |
| 147 | Owner/admin laptop layouts tested for document overflow. |
| 168, 170, 172, 175, 177, 178, 179, 183 | Compact laptop KPI cards and spacing; four overview/analytics cards per row verified at laptop size. |
| 169, 171 | Additional charts use backend booking status, monthly customer registration and paid-revenue series. Existing bookings chart renamed accurately. |
| 173, 174, 176, 184, 185, 190, 197 | Compact aligned filters and controls; staff fits at least seven filter columns at the tested laptop width. |
| 181, 182 | Compact commission controls moved above revenue report; bounded save button. |
| 186, 187, 188 | Sent Notifications is a separate tab with title/description, audience, sent-date and recipient-read filters, reset and matching CSV export. New sends record sentAt; older records use a timestamp fallback. |
| 189 | Styled notification preview section with title, message, type and audience. |
| 191 | Notification tabs keep their records in an internal scrolling area. |
| 192, 193 | Compact settings layout, admin table and Save/Invite controls. Editing settings retains loaded values. |
| 194, 195 | Admin role/date/search filters passed to server; export uses the filtered collection. Date boundaries and role scope tested. |
| 196 | Password form width reduced. |
| 198 | Staff Export and Add aligned on the right. |
| 200 | Staff Edit now opens a populated form and saves updates. Negative/out-of-range commission rejected in form, controller and model; zero accepted. |
| 201 | Laptop service record scrolling retained and modal table height bounded; salon service pagination/scroll test passes. |

## Verification

- Client production build passed (existing Browserslist and bundle-size warnings).
- Client/server TypeScript and changed-file ESLint checks passed.
- All 11 server regression tests passed: `npx.cmd tsx --test tests/qa-money.test.ts tests/qa-round2.test.ts` from server.
- All 16 browser check groups passed. Runner: [qa-browser-check.cjs](qa-browser-check.cjs); results: [qa-browser-results.json](qa-browser-results.json).
- Screenshots: [analytics](qa-round2-analytics.png), [sent notifications](qa-round2-notifications.png).

Browser tests use synthetic users and intercepted APIs. They verify UI behavior and request payloads, not production integration. No live notifications, payments or database migrations were executed.

Deploy both client and server, confirm QA is using that revision, and retest the original legacy service/payout plus real OTP delivery, reports, charts and staff saves. See the September 10 handoff for migration precautions and legacy-data limitations. Close sheet rows only after live acceptance.

# Hermoso QA Retest Checklist — 1 October 2026

Source: `Latest Hermoso_Retest_Bug_Report_Updated - Copy (3).docx` (30 September 2026). The report is QA evidence, not implementation instruction.

This supersedes the earlier mixed checklist. The latest report has 10 bugs: Bugs 04–08 are POS issues, not Admin-panel issues.

## QA report reconciliation

- [x] 01 — Login: place the Hermoso App logo inside the form card with consistent responsive spacing.
- [x] 02 — Verify OTP: show the 10-minute OTP validity separately from the 30-second resend cooldown.
- [x] 03 — Salon Owner branding: show the active salon name persistently in the sidebar/top header, without inserting it into page subtitles.
- [x] 04 — POS GST / Discount: numeric fields can be cleared and overwritten without retaining a leading `0`.
- [x] 05 — POS Customer: show the selected customer’s name and phone/email with a separate remove button.
- [x] 06 — POS Customer Search: query and display matching existing customers by name.
- [x] 07 — POS Proceed / Checkout: generate a non-conflicting receipt reference for new bills; retain the Retrieve flow and provide an in-app route to past bills if a legacy receipt-reference conflict is returned.
- [x] 08 — POS Add Item Search: selecting an inline search result replaces the table with the selected item only. Browse remains available for building a multi-item sale.
- [x] 09 — Events: calculate and display final price with paisa/decimal precision (e.g. Rs 70 less 5% = Rs 66.50).
- [x] 10 — New Salon Owner login: safely handle an account with no linked salon, preventing the dashboard error page after registration/login.

## Additional completed improvements

- [x] Registration validates Pakistan phone numbers with `libphonenumber-js` and stores normalized E.164 values.
- [x] Login, Registration, and OTP use the same responsive Hermoso App / AI Aesthetic Care brand header and heading scale.

## Retest notes

For a failed item, add the browser/device, role, reproduction steps, actual versus expected result, and screenshot/video or API error below.

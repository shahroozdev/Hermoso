# Hermoso Manual QA Checklist — 1 October 2026

Use this checklist for the next manual retest. Leave an item unchecked if it fails and add screenshots, steps, and the tested environment beneath it.

- [x] 01 — Login branding: logo is centred inside the form card with consistent responsive spacing.
- [x] Phone validation — Registration validates Pakistan numbers with `libphonenumber-js` and stores normalized E.164 values.
- [x] First-login stability — Guard the owner header when no salon is linked, preventing a null salon-name crash.
- [x] 02 — Email OTP: show separate 10-minute code-validity and 30-second resend-wait indicators to prevent timer confusion.
- [ ] 03 — Admin Overview: every booking-period option, especially Last Week, loads the chart without an error.
- [ ] 04 — Analytics: booking-period filters and registration-year selector are compact and return data without an error.
- [ ] 05 — Salon Owner header: the active salon name remains visible throughout all owner modules.
- [ ] 06 — Salon Owner dashboard: all chart period filters load correct scoped data and display an appropriate empty state.
- [ ] 07 — POS customer and add-item search: selected customer shows name/contact; typing finds matching services and events without opening Browse automatically.
- [ ] 08 — POS checkout: GST/Discount fields can be fully replaced; valid checkout succeeds; invalid checkout shows an in-app message, never a browser alert.
- [ ] 09 — Events and Staff: event final price retains decimals; staff time picker preserves selected hour/minute; staff status and schedules save correctly.
- [ ] 10 — Notifications: owner can Clear All after confirmation; the notification list updates and no other user’s history is affected.

## Test notes

Add failed-item evidence here: browser/device, role, steps to reproduce, actual result, expected result, screenshot/video, and API error if applicable.

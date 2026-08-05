# Hermoso iOS - Development Progress Tracker

## Legend
- [ ] Not started
- [x] Completed
- [~] In progress
- [!] Blocked

---

## CI: verifying the build

This whole app was written on Windows with no Swift compiler available. `.github/workflows/ios-build.yml` (repo root) runs on a `macos-15` GitHub Actions runner on every push/PR touching `ios/`: `xcodegen generate` → unsigned `xcodebuild` for the iOS Simulator. **As of the latest push, this build is green** — the app compiles cleanly on Xcode 16.4 / iOS 18.5 SDK. Two real compile errors were found and fixed along the way:
- `project.yml`'s `info:` block needed an explicit `path:` key even when the whole Info.plist is generated from `properties:` (XcodeGen quirk).
- `Text.foregroundStyle(_:)` (the overload returning `Text`, for gradient-text support) is iOS 17+ only; the general `View.foregroundStyle(_:)` is iOS 15+. Every call in this codebase used plain `Color` arguments (never gradients/materials), so all 220 occurrences across 30 files were swapped to `.foregroundColor(_:)`, which has identical behavior for that case and works back to iOS 13.

CI only proves the app *compiles* — it doesn't launch the simulator, exercise the UI, or touch the camera/location code paths, so real on-device testing is still needed for the Scan liveness feature especially.

---

## Phase 1: Project Setup & Foundation

- [x] Initialize Xcode project with SwiftUI — `project.yml` (XcodeGen manifest); `xcodegen generate` + `xcodebuild` now confirmed green in CI (see "CI: verifying the build" above)
- [x] Configure SPM dependencies (Kingfisher, KeychainAccess) — declared in `project.yml`; Kingfisher not yet consumed by any view (no image-loading screens built yet)
- [x] Create folder structure (App, Models, Views, ViewModels, Services, Utils)
- [x] Set up color assets (from THEME.md) — `Utils/Color+Theme.swift`, includes the corrected one-off colors and StatusBadge pairs
- [x] Configure API base URL in Config file — `Services/Config.swift`
- [x] Set up SwiftLint — `.swiftlint.yml` at `ios/` root

## Phase 2: Networking & Auth

- [x] Implement NetworkService (URLSession + async/await) — `Services/NetworkService.swift`
- [x] Implement AuthService (token storage in Keychain, auto-refresh) — `Services/SessionManager.swift` (Keychain via KeychainAccess), deliberately fixes the Android `clearSession()` role-not-cleared bug
- [x] Create all API request/response DTOs (Codable) — `Models/DTOs/*.swift`, covers every endpoint in API_REFERENCE.md including the flat `LoginResponse` and meta-less `/events` shape
- [x] Implement TokenAuthenticator (intercept 401, refresh, retry) — built into `NetworkService.send(_:retry:)`, single retry + shared in-flight refresh across concurrent 401s
- [x] AuthViewModel (login, register, verify OTP, logout, session check) — `ViewModels/AuthViewModel.swift`; logout not yet wired to a UI beyond the placeholder in ContentView

## Phase 3: Auth & Onboarding Screens

- [x] SplashView (session check with auto-refresh) — `Views/Onboarding/SplashView.swift`; the silent `/auth/refresh` + 2s hold now lives in `App/ContentView.swift` (root router)
- [x] AuthView (Login mode) — `Views/Auth/AuthView.swift`
- [x] AuthView (Register mode with role selection)
- [x] AuthView (OTP verification mode)
- [x] Input validation logic — exact validation order matched from AuthScreen.kt

> **Note on building/running:** this project was scaffolded on Windows, which cannot run Xcode or the iOS Simulator — all verification happens via the `macos-15` GitHub Actions build (see top of this file), which is green as of the latest push. To run it locally on a Mac: `brew install xcodegen` (if needed), then `xcodegen generate` from the `ios/` directory to produce `Hermoso.xcodeproj`, then open and run on a simulator/device — that exercises the camera/location paths CI can't. The "Hermoso" wordmark also needs the actual Cormorant Garamond (Light) font file added under `Hermoso/Resources/Fonts/` to match `UIAppFonts` in `project.yml` — until then it silently falls back to the system font.

## Phase 4: Customer Tab Navigation

- [x] CustomerTabView — `Views/Customer/CustomerShellView.swift` (custom-styled bottom bar, not a native `TabView`, to match Android's exact look — see THEME.md "Bottom Navigation"); `Views/Owner/OwnerShellView.swift` built alongside it since role-based routing needed both
- [x] AppHeaderView (reusable: logo, notifications badge, user avatar) — `Views/Shared/AppHeaderView.swift`; unread count is currently hardcoded to 0, real count wiring lands with NotificationsView
- [x] BottomNavBar (tab bar customization) — `Views/Shared/BottomNavBar.swift`, shared between Customer/Owner via `HermosoTab`

## Phase 5: Customer Screens

- [x] HomeView (greeting, search, categories, salons, events) — `Views/Customer/Home/HomeView.swift` + `ViewModels/HomeViewModel.swift`, matches the 300ms debounce and three-independent-loads behavior from HomeScreen.kt
- [x] LocationService (CoreLocation permission + city detection) — `Utils/LocationUtils.swift`
- [x] Distance calculation utility — uses `CLLocation.distance(from:)` (iOS equivalent of Android's `Location.distanceBetween`), not a hand-rolled Haversine formula — see ARCHITECTURE.md
- [x] ScanView (Camera preview with front camera) — `Views/Customer/Scan/ScanView.swift`, `Services/CameraService.swift` (AVFoundation, front camera, mirrored 0.8-quality JPEG capture matching ScanScreen.kt exactly)
- [x] Face detection + liveness check (BLINK → SMILE → TURN_LEFT) — `Services/FaceLivenessAnalyzer.swift` + `ViewModels/ScanViewModel.swift`. ⚠️ **Important caveat**: Android uses ML Kit's face classifier (direct smile/eye-open probabilities); Vision has no equivalent, so blink/smile here are geometric heuristics (eye-aspect-ratio, mouth-corner-lift) computed from landmark contours, not a verified equivalent-fidelity port. Roll/yaw thresholds map directly and reliably. **Not calibrated against a physical camera** — this is the single riskiest piece built so far; expect to tune thresholds on a real device.
- [x] Face overlay with animated scan border — `Views/Shared/FaceOverlayView.swift`
- [x] Image capture + upload to `/scans/analyze` — wired through `AuthApi.analyzeScan`
- [x] ScanResultsView (animated score ring, all analysis sections) — `Views/Customer/Scan/ScanResultsView.swift` + `ViewModels/ScanResultsViewModel.swift`, built from the live `ScanResultsScreen.kt` (not the dead-code `ScanResultsComponents.kt` variant)
- [x] TreatmentPlanCard (priority list) — inline in ScanResultsView, numbered priority-color badges matching Android (not the unused roman-numeral/medal-color variant)
- [x] DietPlanCard (foods to eat/avoid) — inline in ScanResultsView
- [x] MatchView (matched salons list) — `Views/Customer/Scan/MatchView.swift` + `ViewModels/MatchViewModel.swift`
- [x] RecommendationsView (screen 4c, the lightweight "View Full Plan" destination) — `Views/Customer/Scan/RecommendationsView.swift`; also added a "View Detailed Report" link into the full report since Android's own entry point into that screen wasn't identifiable from the audited source
- [x] BookingView (5-step standard flow) — `Views/Customer/Booking/BookingView.swift` + `ViewModels/BookingViewModel.swift`, matches BookingScreen.kt's cascading resets and salon-locked-when-preselected behavior. Deliberate improvement over Android: a preselected serviceId (from RecommendationsView) now actually gets applied once the service list loads, instead of being lost.
- [x] BookingView (AI booking with multiple service cards) — `Views/Customer/Booking/AiBookingView.swift` + `ServiceBookingCard.swift`, each matched treatment is a fully independent mini booking flow (own `ServiceBookingCardViewModel`), matching Android's per-card state exactly. Treatment→service matching is the same case-insensitive, either-direction substring check as BookingScreen.kt.
- [x] CalendarView component (month picker with date grid) — `Views/Shared/CalendarView.swift`, Sunday-first grid, arrow-only month nav (no swipe), matching CalendarComponent.kt
- [x] BookingsListView — `Views/Customer/Booking/BookingsListView.swift` + `ViewModels/BookingsListViewModel.swift`; also added `Views/Shared/StatusBadgeView.swift` (exact color pairs from StatusBadge.kt) and `Views/Shared/LabeledSelect.swift` (custom dropdown, shared by both booking flows)
- [x] TrackerView (progress metrics) — `Views/Customer/Tracker/TrackerView.swift`. Deliberate improvement over Android: first/latest scan dates are properly formatted here, where Android shows raw unformatted ISO strings (an audited gap, not replicated).
- [x] ProfileView (edit profile, change password, settings) — `Views/Shared/ProfileView.swift` + `ViewModels/ProfileViewModel.swift`, presented as a sheet from the AppHeader avatar menu (reachable identically from every tab, matching Android's global header dropdown)
- [x] NotificationsView (list with mark-as-read) — `Views/Shared/NotificationsView.swift`, presented as a sheet from the AppHeader bell
- [x] SalonsListView — `Views/Customer/Salons/SalonsListView.swift`. ⚠️ Deliberate improvement: computes real per-salon distance via LocationService, instead of replicating Android's hardcoded fake "0.8 km" (an explicit mock left in the Kotlin source). Category filter mentioned in this task's original description doesn't exist on Android's actual SalonsScreen — not built, to match real behavior.
- [x] SalonServicesView — `Views/Customer/Salons/SalonServicesView.swift`, hero + sticky bottom booking bar matching SalonServicesScreen.kt

**Phase 5 complete.** Full navigation is wired end-to-end: Home → Salons List/Detail → Booking; Scan → Recommendations/Full Report/Match → Booking/AI Booking; Bookings and Tracker tabs; Profile/Notifications as sheets from the header (available identically from Customer and Owner shells).

## Phase 6: Owner Screens

- [x] OwnerTabView (TabView with 4 tabs, dark theme) — `Views/Owner/OwnerShellView.swift` (built alongside CustomerShellView back in Phase 4, now with all 4 real screens wired in)
- [x] OwnerDashboardView (stat cards, AI scan referrals, chart) — `Views/Owner/OwnerDashboardView.swift` + `ViewModels/OwnerDashboardViewModel.swift`. ⚠️ "Chart" is a plain list, matching Android — no charting library is used by OwnerDashboardScreen.kt, so none was added here either.
- [x] OwnerCalendarView (monthly calendar with booking indicators) — `Views/Owner/OwnerCalendarView.swift`. ⚠️ Despite the PROGRESS.md description, Android's actual screen is NOT a monthly calendar — it's today's bookings only, no date picker. Built to match the real Android behavior rather than this original (inaccurate) task description; a real calendar would be a deliberate enhancement, not a port.
- [x] OwnerServicesView (CRUD services) — `Views/Owner/OwnerServicesView.swift`. ⚠️ Same gap: Android has no CRUD UI at all, just a read-only list (OwnerServicesScreen.kt). Built read-only to match; real CRUD would be a deliberate addition.
- [x] OwnerInsightsView (analytics) — `Views/Owner/OwnerInsightsView.swift`. ⚠️ No real analytics/charts in Android — a single client-side templated sentence reusing the dashboard endpoint. Built to match; real analytics would be a deliberate addition.
- [x] OwnerClientsView (customer list) — `Views/Owner/OwnerClientsView.swift`. Built for parity but intentionally left with no navigation entry point, matching Android where this screen is also unreachable (no tab, no other screen links to it).

## Phase 7: Reusable Components

- [x] LabeledSelect (dropdown with picker) — `Views/Shared/LabeledSelect.swift`
- [x] SummaryRow (key-value row) — `Views/Shared/SummaryRowView.swift`, extracted from BookingView's private `summaryRow` helper
- [x] StatusBadge — `Views/Shared/StatusBadgeView.swift`
- [x] ProgressBar (horizontal) — `MetricProgressBar` in `Views/Shared/ResultCard.swift`
- [x] ScoreRing (animated circular progress) — `Views/Shared/ScoreRingView.swift`, extracted from `ScanResultsView.overallScoreCard`; now animates the ring fill over 1000ms on appear (`withAnimation(.easeOut(duration: 1.0))`), matching Android
- [x] SectionHeader (title + "See all" link) — `Views/Shared/SectionHeaderView.swift`, used by HomeView's Top Salons/Events sections
- [x] Skeleton loading placeholders — `Views/Shared/ShimmerView.swift` (1.2s sweeping-highlight loop, matching `shimmerBrush()`'s duration/tone) + `Views/Shared/SkeletonComponents.swift` (`SalonCardSkeletonView`/`CategoryChipSkeletonView`/`EventCardSkeletonView`, sized to match this port's real card views rather than Android's raw dp numbers). Re-audited Android and found `SkeletonComponents.kt` is real, used only in `HomeScreen.kt` for categories/salons/events — nowhere else in the app. Wired into HomeView's three sections (5 skeletons each, gated on new `isLoadingCategories`/`isLoadingSalons`/`isLoadingEvents` flags on `HomeViewModel`, matching Android's `loading && list.isEmpty` condition). Every other screen's plain `ProgressView()` was already correct — Android doesn't use shimmer there either, so this was never actually the scope cut the earlier note claimed.
- [x] Error + Retry view — `Views/Shared/ErrorRetryView.swift` (message + optional retry action/label, configurable text/retry color for the dark Owner screens), wired into every list screen that had the inline duplicate. Screens with genuinely different behavior (ScanResultsView's pill "Go Back" button, AuthView/ScanView's footnote-styled inline errors) were deliberately left as-is rather than forced into the shared shape.
- [x] Empty state view — `Views/Shared/EmptyStateView.swift`, wired into NotificationsView, BookingsListView, TrackerView, OwnerCalendarView

## Phase 8: Polish & Testing

- [x] Pull-to-refresh on all list views — `.refreshable` added to Home, BookingsList, all 5 Owner screens, Notifications, Match, SalonsList, Tracker, ScanResults, Recommendations. Not added to Profile/SalonServices (forms/detail screens, not lists).
- [x] Network error handling / user-friendly messages — already solid: `NetworkService.swift`'s `NetworkError: LocalizedError` supplies friendly text for every case (server message when present, generic fallback otherwise), and every ViewModel surfaces it via `error.localizedDescription`; raw `URLError`s (offline, timeout) fall back to iOS's own friendly system text. Audited, no gaps found.
- [x] Loading states everywhere — audited every ViewModel's `isLoading`/`isSubmitting`/`isSaving` flags against their views. Found and fixed two real gaps: `BookingViewModel.isSubmitting` and `ServiceBookingCardViewModel.isSubmitting` were declared and already factored into the disabled state (`canSubmit`/`canBook`), but the button label never reflected it — both now swap to "Booking..." while in flight, matching the "Verifying..."/"Saving..." pattern already used on AuthView/ProfileView.
- [x] Dark mode support — Android's `HermosoTheme` is only ever called with no arguments (`darkTheme` defaults `false` at the single call site in `MainActivity.kt`), so the real app never renders in dark mode regardless of system setting. None of this port's `hermoso*` colors have dark variants either. Matched that with `.preferredColorScheme(.light)` on the root `WindowGroup` in `HermosoApp.swift`, rather than half-supporting a dark mode Android itself doesn't have.
- [x] Accessibility labels — added to every icon-only interactive control: notification bell + unread count, avatar/account menu, notification "mark as read" xmark, password show/hide toggle, salon detail back chevron. Bottom tab bar items get `.isSelected` trait. SalonsListView's 5-star rating row is collapsed into one `"Rated X out of 5"` element instead of 5 unlabeled star glyphs. (Decorative icons — search glyph, rating star icons that sit next to their own numeric text — were left alone.)
- [ ] Test on real device (camera, location) — still blocked on not having a physical device/Mac in this environment
- [x] App icon and launch screen — `Assets.xcassets/AppIcon.appiconset` (single 1024×1024 universal icon). First pass used a generated serif "H" placeholder; replaced with the real brand mark once pointed at `client/public/assets/icons/HermosoLogo.svg` (the 5-petal gold mandala) — reconstructed the SVG's rotated-ellipse/radial-gradient geometry in Pillow (no cairo/native SVG renderer available in this environment) at full opacity on Android's actual launcher gradient (`#4C1D95`→`#7C3AED`, from `ic_launcher_background.xml`) rather than the muddy look full SVG opacity produced when alpha-blended over purple. `Assets.xcassets/LaunchBackgroundColor.colorset` wired via `UILaunchScreen.UIColorName` in `project.yml` so the native launch screen is a solid fill in that same purple instead of a flash of white.

---

## Notes

- All ViewModels follow the same pattern: `@Published var isLoading`, `@Published var errorMessage`
- All list views use `ReloadKey` pattern (increment to trigger refresh)
- Color constants match the Android palette exactly
- Navigation uses `NavigationStack` with `.navigationDestination`

## File Count Estimate

| Category | Files |
|----------|-------|
| DTOs | ~50 structs |
| ViewModels | ~15 files |
| Views | ~25 files |
| Services | ~5 files |
| Utils | ~8 files |
| **Total** | **~103 files** |

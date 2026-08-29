# Hermoso Mobile Split — Progress Tracker

Tracks execution of [APP_SPLIT_PLAN.md](APP_SPLIT_PLAN.md). Update this file as work lands;
don't let it drift the way the plan doc warns the four codebases themselves can.

**Overall: all 4 apps build green in CI. Not yet smoke-tested against a live backend, not store-ready.**

| Area | Status |
|---|---|
| Android split (§6) | ✅ Done, including app icon (unified, see below) |
| iOS split (§7) | ✅ Done, including app icon (unified, see below) |
| Sign-up role picker removed (§8) | ✅ Done, both platforms |
| Login-role guard (§9) | ✅ Done, both platforms |
| CI build verification | ✅ All 4 apps (`android-customer`, `android-owner`, `ios-customer`, `ios-owner`) build green |
| Manual smoke test against backend | ❌ Not started |
| Store & release readiness (§11) | ❌ Not started |
| Legacy `android/` / `ios/` removal (§4) | ⏸ Pending smoke test — see §"Next actions" |

---

## Android — `android-customer/` (Hermoso App)

- [x] New Gradle project scaffolded, `applicationId = com.hermoso.customer`
- [x] Customer screens copied (Home, Scan, ScanResults, Match, Recommendations, Tracker, Booking, BookingList, Salons, SalonServices)
- [x] Shared infra copied (AuthApi, AuthScreen, AppHeader, ProfileScreen, NotificationScreen, SplashScreen, DataModels, StatusBadge, DateTimeUtils, LocationUtils)
- [x] Dead code dropped (`ScanCameraScreen.kt`, `ScanCameraComponents.kt`, `ScanResultsComponents.kt`)
- [x] `HermosoApp.kt` rewritten — no role branching, single `NavHost`, hardcoded start destination (Home)
- [x] Sign-up role picker removed — hardcoded `role = "customer"`
- [x] Login-role guard added — rejects `salon_owner` login with redirect message
- [x] `isOwnerTheme` dead param removed from `AppHeader.kt`
- [x] Unused `OwnerNavy`/`OwnerGold`/`OwnerTextLight` tokens removed from `Color.kt`
- [x] App icon — `HermosoLogo.svg` mark on purple gradient (adaptive icon vector + all legacy mipmap densities)
- [x] `./gradlew assembleDebug` runs and passes in CI
- [ ] Smoke-tested against live backend

## Android — `android-owner/` (Hermoso Business)

- [x] New Gradle project scaffolded, `applicationId = com.hermoso.business`
- [x] Owner screens copied (Dashboard, Calendar, Services, Clients, Insights)
- [x] Shared infra copied (own copy of AuthApi, AuthScreen, AppHeader, ProfileScreen, NotificationScreen, etc.)
- [x] `HermosoApp.kt` rewritten — no role branching, single `NavHost`, hardcoded start destination (Owner Dashboard)
- [x] Sign-up role picker removed — hardcoded `role = "salon_owner"`
- [x] Login-role guard added — rejects `customer` login with redirect message
- [x] `isOwnerTheme` dead param removed from `AppHeader.kt`
- [x] `OwnerNavy`/`OwnerGold`/`OwnerTextLight` tokens kept (unused, available for a future real redesign)
- [x] **Beyond original plan**: pruned unused camera/location dead weight — deleted `LocationUtils.kt` (never called), removed `CAMERA`/`ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION` from `AndroidManifest.xml`, removed `play-services-location`, `mlkit:face-detection`, `kotlinx-coroutines-play-services`, `accompanist-permissions`, and all `androidx.camera.*` deps from `build.gradle.kts`
- [x] App icon — confirmed byte-identical to `android-customer`'s (`HermosoLogo.svg` mark on purple gradient); §5's "needs a new navy/gold icon" is superseded — unified branding across both apps was the actual call (per user decision 2026-08-24)
- [x] `./gradlew assembleDebug` runs and passes in CI
- [ ] Smoke-tested against live backend

## iOS — `ios-customer/` (Hermoso App)

- [x] New XcodeGen project scaffolded (`project.yml`, bundle `com.hermoso.customer`)
- [x] Customer views/view models copied (Home, Scan, ScanResults, Match, Recommendations, Tracker, Booking, BookingsList, Salons, SalonServices)
- [x] Full shared infra copied (Services, Models/DTOs, Utils, chrome `Shared/` views)
- [x] `ContentView.swift` simplified — no `userRole` branch, straight to `CustomerShellView`
- [x] Sign-up role picker removed from `AuthView.swift` — hardcoded `role = "customer"`
- [x] Login-role guard added in `AuthViewModel.swift` — rejects `salon_owner` login with redirect message
- [x] `AppHeaderView.swift` rebranded to "Hermoso App"
- [x] `BottomNavBar.swift`/`HermosoTab` trimmed to customer-only tabs
- [x] `Assets.xcassets` copied
- [ ] `ios/context/*.md` docs duplicated into project — **skipped**, those files are gitignored local reference docs, not shipped source; low priority
- [x] App icon — `HermosoLogo.svg` mark on purple gradient (`icon-1024.png`, confirmed byte-identical to `ios-owner`'s)
- [x] `xcodegen generate` + Xcode build runs and passes in CI
- [ ] Smoke-tested against live backend

## iOS — `ios-owner/` (Hermoso Business)

- [x] New XcodeGen project scaffolded (`project.yml`, bundle `com.hermoso.business`)
- [x] Owner views/view models copied (Dashboard, Calendar, Services, Clients, Insights)
- [x] Full shared infra copied (Services, Models/DTOs, Utils)
- [x] `ContentView.swift` simplified — no `userRole` branch, straight to `OwnerShellView`
- [x] Sign-up role picker removed from `AuthView.swift` — hardcoded `role = "salon_owner"`
- [x] Login-role guard added in `AuthViewModel.swift` — rejects `customer` login with redirect message
- [x] `AppHeaderView.swift` rebranded to "Hermoso Business"
- [x] `BottomNavBar.swift`/`HermosoTab` trimmed to owner-only tabs (no Clients tab, matches Android)
- [x] `Assets.xcassets` copied
- [x] **Beyond original plan**: pruned unused camera/location dead weight — deleted `CameraService.swift`, `FaceLivenessAnalyzer.swift`, `CameraPreviewView.swift`, `FaceOverlayView.swift`, `LocationUtils.swift`, and 12 customer-only `Shared/` components (`SalonCardView`, `EventCardView`, `ResultCard`, `ScoreRingView`, `SummaryRowView`, `FlowTagsView`, `LabeledSelect`, `CalendarView`, `StatusBadgeView`, `ShimmerView`, `SkeletonComponents`, `SectionHeaderView`); removed `NSCameraUsageDescription`/`NSLocationWhenInUseUsageDescription` from `project.yml`
- [x] App icon — confirmed byte-identical to `ios-customer`'s `icon-1024.png` (`HermosoLogo.svg` mark on purple gradient); §5's "needs a new navy/gold icon" is superseded — unified branding across both apps was the actual call (per user decision 2026-08-24)
- [x] `xcodegen generate` + Xcode build runs and passes in CI (fixed a real bug found by CI: `OwnerCalendarViewModel.swift` referenced `BookingViewModel.dateFormatter`, a customer-only symbol correctly pruned from this project — replaced with a self-contained `private static let dateFormatter`)
- [ ] Smoke-tested against live backend

## CI

- [x] `.github/workflows/ios-build.yml` — matrix build on `macos-15` for `ios-customer`, `ios-owner`, and the legacy `ios/` (kept until deletion); XcodeGen + unsigned simulator build
- [x] `.github/workflows/android-build.yml` — matrix build on `ubuntu-latest` for `android-customer`, `android-owner`; JDK 21 + `./gradlew assembleDebug`
- [x] All 4 apps build green (`android-customer`, `android-owner`, `ios-customer`, `ios-owner`)

## Not started (§11 — store & release)

- [x] ~~Hermoso Business app icon design (navy/gold)~~ — resolved 2026-08-24: user confirmed unified branding (`HermosoLogo.svg` on purple) across both apps instead, already in place on all 4 projects
- [ ] Two Play Store listings + screenshots
- [ ] Two App Store Connect listings + screenshots
- [ ] Two Android signing keys
- [ ] Two iOS provisioning profiles/certs
- [ ] Confirm neither legacy app (`com.example.myapplication` / `com.hermoso.ios`) is already live with real users (§13 open question — still unanswered)

## Next actions, in order

1. ~~Trigger the two CI workflows and fix whatever the first real build turns up.~~ ✅ Done — all 4 apps build green.
2. ~~Commission the Hermoso Business app icon.~~ ✅ Resolved — unified branding, already in place on all 4 projects.
3. Manual smoke test: run each of the 4 apps against the dev backend, exercise login/sign-up on the wrong role to confirm the guard message shows correctly, exercise the main nav flow per app.
4. Once smoke-tested, delete `android/` and `ios/`.
5. Store listings, signing, screenshots (§11) — separate workstream, not blocking the code split.

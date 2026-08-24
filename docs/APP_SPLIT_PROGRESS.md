# Hermoso Mobile Split — Progress Tracker

Tracks execution of [APP_SPLIT_PLAN.md](APP_SPLIT_PLAN.md). Update this file as work lands;
don't let it drift the way the plan doc warns the four codebases themselves can.

**Overall: code-complete on both platforms, build-unverified, not store-ready.**

| Area | Status |
|---|---|
| Android split (§6) | ✅ Done, except owner app icon (design dependency) |
| iOS split (§7) | ✅ Done, except owner app icon (design dependency) |
| Sign-up role picker removed (§8) | ✅ Done, both platforms |
| Login-role guard (§9) | ✅ Done, both platforms |
| CI build verification | ⚠️ Workflows added, **not yet run** — no green build exists for any of the 4 apps |
| Manual smoke test against backend | ❌ Not started |
| Store & release readiness (§11) | ❌ Not started |
| Legacy `android/` / `ios/` removal (§4) | ⏸ Intentionally kept until verification above passes |

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
- [ ] App icon — reusing existing purple launcher icon as-is (no new design needed here)
- [ ] `./gradlew assembleDebug` actually run and passing (CI added, not yet triggered/observed)
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
- [ ] App icon — **blocked on design**, needs navy/gold icon (§5/§11)
- [ ] `./gradlew assembleDebug` actually run and passing (CI added, not yet triggered/observed)
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
- [ ] App icon — reusing existing icon as-is (no new design needed here)
- [ ] `xcodegen generate` + Xcode build actually run and passing (CI added, not yet triggered/observed)
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
- [ ] App icon — **blocked on design**, needs navy/gold icon (§5/§11)
- [ ] `xcodegen generate` + Xcode build actually run and passing (CI added, not yet triggered/observed)
- [ ] Smoke-tested against live backend

## CI

- [x] `.github/workflows/ios-build.yml` — matrix build on `macos-15` for `ios-customer`, `ios-owner`, and the legacy `ios/` (kept until deletion); XcodeGen + unsigned simulator build
- [x] `.github/workflows/android-build.yml` — matrix build on `ubuntu-latest` for `android-customer`, `android-owner`; JDK 21 + `./gradlew assembleDebug`
- [ ] **Neither workflow has actually run yet** — no push/PR has touched these paths since they were added, and `workflow_dispatch` hasn't been triggered. Until one of these goes green, none of the 4 apps have been proven to compile.

## Not started (§11 — store & release)

- [ ] Hermoso Business app icon design (navy/gold) — blocks both `android-owner` and `ios-owner` icon assets
- [ ] Two Play Store listings + screenshots
- [ ] Two App Store Connect listings + screenshots
- [ ] Two Android signing keys
- [ ] Two iOS provisioning profiles/certs
- [ ] Confirm neither legacy app (`com.example.myapplication` / `com.hermoso.ios`) is already live with real users (§13 open question — still unanswered)

## Next actions, in order

1. Trigger the two CI workflows (push a no-op commit touching one of the watched paths, or run `workflow_dispatch` manually) and fix whatever the first real build turns up — nothing here has compiled yet.
2. Manual smoke test: run each of the 4 apps against the dev backend, exercise login/sign-up on the wrong role to confirm the guard message shows correctly, exercise the main nav flow per app.
3. Commission the Hermoso Business navy/gold app icon; drop into both `android-owner/app/src/main/res/mipmap-*` and `ios-owner/Hermoso/Assets.xcassets/AppIcon.appiconset`.
4. Once both platforms are green + smoke-tested, delete `android/` and `ios/`.
5. Store listings, signing, screenshots (§11) — separate workstream, not blocking the code split.

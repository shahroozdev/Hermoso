# Hermoso iOS - Design System & Theme

> Verified against `android/app/src/main/java/com/example/myapplication/ui/theme/{Color,Theme,Type}.kt` and every screen's inline colors (2026-08-02 audit). Corrections vs. earlier draft are called out explicitly.

## Color Palette

```swift
// Hermoso Consolidated Palette (from Color.kt) — the palette actually used app-wide
extension Color {
    static let purple = Color(hex: "#7C3AED")        // Primary
    static let purpleLight = Color(hex: "#A855F7")    // Light primary
    static let purplePale = Color(hex: "#F3E8FF")     // Background tint
    static let purpleDark = Color(hex: "#4C1D95")     // Dark primary
    static let purpleDeeper = Color(hex: "#2E1065")   // Deepest purple (headers)
    static let cream = Color(hex: "#FDF8FF")          // Background
    static let textDark = Color(hex: "#1A0F2E")       // Primary text
    static let textMuted = Color(hex: "#7C6890")      // Secondary text
}
```

**⚠️ CORRECTION:** `Color.kt` also defines an "Owner/Business" navy/gold palette (`OwnerNavy #0D1B2A`, `OwnerNavyMid #162032`, `OwnerNavyCard #1A2A3E`, `OwnerGold #D4A843`, `OwnerGoldLight #F0C96A`, `OwnerTextLight #E2EAF4`) — **but it is never referenced by any screen.** Real Owner screens use the same purple family as Customer screens (`purpleDeeper` background, `purpleDark` cards, `purpleLight` accents, `cream`/`textMuted` text), just always in "dark mode" styling. **Do not build an iOS navy/gold owner theme** — use purple-on-dark instead.

Also unused, don't port: `Purple80/PurpleGrey80/Pink80/Purple40/PurpleGrey40/Pink40` (Android Material3 defaults, superseded by the palette above) and the `HermosoPlum*`/`HermosoText`/`HermosoCream` aliases (same values as `purple`/`textDark`/`cream`, kept only for Android backwards-compat).

### Inline / one-off colors (scattered per-screen, not in the base palette — needed for exact parity)

```swift
extension Color {
    static let errorRed = Color(hex: "#B00020")           // all error messages app-wide
    static let successGreen = Color(hex: "#0A7D3B")       // booking/profile success text
    static let otpSuccessGreen = Color(hex: "#0F9D58")    // AuthScreen OTP success message
    static let ownerErrorRed = Color(hex: "#FCA5A5")      // error text on dark Owner screens
    static let notificationBadge = Color(hex: "#EF4444")  // unread badge (bell + notif list)
    static let starGoldHome = Color(hex: "#FBBF24")       // HomeScreen rating stars
    static let starGoldSalons = Color(hex: "#FFB800")     // SalonsScreen / SalonServicesScreen rating stars — INCONSISTENT with Home; pick one for iOS (recommend unifying on one gold)
    static let aiReferralGreen = Color(hex: "#10B981")    // Owner dashboard AI Scan Referrals text
    static let aiReferralGreenBg = Color(hex: "#065F46")  // ...card bg, at 20% opacity
    static let scanBackground = Color(hex: "#0A0614")     // ScanScreen bg (near-black purple, NOT purpleDeeper)
    static let trackerHeaderStart = Color(hex: "#0F0A1A") // TrackerScreen header gradient start
    // Score ring thresholds (ScanResultsScreen): >=75 green, >=50 amber, <50 red
    static let scoreHigh = Color(hex: "#10B981")
    static let scoreMid = Color(hex: "#F59E0B")
    static let scoreLow = Color(hex: "#EF4444")
}
```

### StatusBadge exact color pairs (from `ui/components/StatusBadge.kt`)

Status string is lowercased/trimmed; unknown/null defaults to "pending" styling.

| status | background | text |
|---|---|---|
| confirmed | `#D1FAE5` | `#065F46` |
| cancelled | `#FEE2E2` | `#7F1D1D` |
| expired | `#FEF3C7` | `#78350F` |
| pending / other | `#DDD6FE` | `#3F0F63` |

Badge shape: `RoundedRectangle(cornerRadius: 6)`, padding 10pt horizontal / 4pt vertical, font 12pt semibold.

## Typography

**⚠️ CORRECTION:** Only **one** Material3 type role is actually customized in `Type.kt` — everything else uses Material3/system defaults. Don't invent custom sizes for headlines/labels; match SwiftUI's default Dynamic Type scale for those roles instead.

- **bodyLarge (the only override):** system font, regular weight, 16pt, 24pt line height, 0.5pt tracking
- **Everything else** (headlines, titles, labels, body medium/small): system default type scale — no custom weight/size was set in the Android source
- **Special — "Hermoso" wordmark ONLY:** Cormorant Garamond, Light weight — used in exactly two places: `AppHeader` logo text (28pt) and `SplashScreen` title (56pt). Nowhere else in the app. iOS needs to bundle "Cormorant Garamond" (Light) as a font resource just for these two spots.

**Dark mode:** Android's `HermosoTheme` always passes `darkTheme = false` (never wired to system setting) and `dynamicColor = false`. The app never actually uses system dark mode or Android dynamic color — treat this as a fixed light-palette-with-dark-owner-screens design, not a light/dark adaptive theme.

## Common UI Patterns (from Android)

| Android (Jetpack Compose) | iOS (SwiftUI) Equivalent |
|---|---|
| `LazyColumn` | `List` or `ScrollView` + `LazyVStack` |
| `LazyRow` | `ScrollView(.horizontal)` + `LazyHStack` |
| `Card` + `RoundedCornerShape` | `VStack` in `RoundedRectangle` overlay |
| `FlowRow` | `FlexibleView` or custom `WrappingHStack` |
| `CircularProgressIndicator` | `ProgressView()` |
| `Scaffold` | `NavigationStack` + `TabView` |
| `Button` | `Button` with custom styling |
| `OutlinedTextField` | `TextField` with `.textFieldStyle(.roundedBorder)` |
| `TopAppBar` | `NavigationStack`'s `.toolbar` |
| `IconButton` | `Button` with system image |
| `LazyVerticalGrid` | `LazyVGrid` with `GridItem` |
| `Surface` | `ZStack` with `.background` modifier |

## Spacing

- Base unit: 4pt (Android: 4dp equivalent)
- Standard padding: 16pt
- Card content padding: 14pt
- Section spacing: 24pt

## Corner Radius

- Small chips/badges: 6pt
- Cards: 12-14pt
- Buttons: 12-16pt
- Modal/Card: 24pt

## Gradients

**⚠️ CORRECTION:** Header gradients are NOT consistent across screens — each screen uses its own variant. Exact per-screen gradients:

| Screen | Gradient (top → bottom or start → end) |
|---|---|
| AppHeader (global top bar), HomeScreen, SalonsScreen | `linearGradient([purpleDeeper, purpleDark, purple])` (3-stop) |
| AuthScreen | `verticalGradient([purpleDeeper, purpleDark])` (2-stop) |
| SplashScreen | `verticalGradient([purpleDark, purpleDeeper])` (2-stop, **reversed order** vs AuthScreen — lighter top, darker bottom) |
| MatchScreen | `linearGradient([textDark, purpleDark])` (uses `textDark`, not `purpleDeeper` — distinct from the rest) |
| RecommendationsScreen | `linearGradient([purpleDark, purple])` (2-stop, no `purpleDeeper`) |
| TrackerScreen | `linearGradient([trackerHeaderStart #0F0A1A, purpleDeeper])` |
| BookingScreen | `linearGradient([purpleDeeper, purpleDark, purple])` (same 3-stop as global header) |
| SalonServicesScreen hero fallback (no image) | `linearGradient([purpleDeeper, purpleDark])` |
| SalonServicesScreen hero image overlay | `linearGradient([black@30%, black@60%])` over the photo, for text legibility |

- Event cards (HomeScreen): 5 gradient pairs cycling by `index % 5`: `[#6B21A8,#9333EA]` purple, `[#BE185D,#EC4899]` pink, `[#1E40AF,#3B82F6]` blue, `[#047857,#10B981]` green, `[#B45309,#F59E0B]` amber.
- Avatar (AppHeader): `linearGradient([#EC4899, purpleLight])` (pink → purple).

## Shadows

- Card elevation: shadow with 2pt offset, 2pt blur, 15% opacity
- SalonServicesScreen sticky booking bar: `tonalElevation 8pt` + `shadowElevation 16pt` (heavier than standard cards — it floats above scroll content)

## Bottom Navigation (exact)

- Container background is **always white** (`Color.white`), regardless of Customer/Owner theme — even on dark Owner screens the tab bar itself stays white.
- Selected tab color: `purple`. Unselected: `textMuted`. Icon 24pt, 4pt spacer to label.
- Customer tabs: Home / "AI Scan" (face icon) / Bookings (calendar icon) / "Progress" (line-chart icon).
- Owner tabs: Dashboard / Calendar / Services (face icon, reused) / Insights. **Owner Clients has no tab** — it's unreachable in the current app (no nav entry point anywhere).

## Shimmer / Skeleton Loading

- Shimmer gradient: 3-stop `lightGray` with alpha `[0.6, 0.2, 0.6]`, animated diagonally over **1200ms**, ease `fastOutSlowIn` (≈ `.easeInOut`), repeats by restarting (not reversing).
- Used for: salon card skeletons (matches real card layout: image block + title bar + two small bars), category chip skeletons (100×36pt pill), event card skeletons (200×100pt, static translucent white blocks rather than shimmer for inner placeholders).

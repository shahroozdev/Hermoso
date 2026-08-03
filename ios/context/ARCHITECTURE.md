# Hermoso iOS - Architecture Document

## 1. Project Overview

**Hermoso** is a multi-tenant salon management and booking platform. This iOS app serves two user roles:
- **Customer** - Browse salons, AI skin scan, match with salons, book appointments, track progress
- **Salon Owner** - Dashboard, calendar, services management, clients, insights

## 2. Technology Stack (iOS)

| Layer | Technology |
|-------|-----------|
| Language | Swift 5.9+ |
| UI Framework | SwiftUI |
| Architecture | MVVM (Model-View-ViewModel) |
| Navigation | NavigationStack / NavigationPath |
| Networking | URLSession + async/await |
| Persistence | UserDefaults + Keychain |
| Camera | AVFoundation / Vision |
| Face Detection | Vision (VNDetectFaceRectanglesRequest) |
| Image Loading | AsyncImage / Kingfisher |
| Code Style | SwiftLint, SwiftFormat |

## 3. App Architecture (MVVM)

```
View (SwiftUI)
    ↕ ObservedObject / StateObject
ViewModel (ObservableObject)
    ↕ async/await
Service Layer (NetworkService, AuthService, etc.)
    ↕ URLSession
API Layer (Request/Response DTOs)
```

## 4. Navigation Structure

```
App (entry point)
├── SplashView → AuthCheck
├── AuthView (Login / Register / OTP)
│
├── Customer TabView (if role == customer)
│   ├── HomeView
│   ├── ScanView (Camera + Face Detection)
│   ├── BookingsListView
│   └── TrackerView
│
├── Owner TabView (if role == salon_owner)
│   ├── OwnerDashboardView
│   ├── OwnerCalendarView
│   ├── OwnerServicesView
│   └── OwnerInsightsView
│
├── Shared (via NavigationStack push)
│   ├── ScanResultsView
│   ├── RecommendationsView
│   ├── MatchView
│   ├── BookingView (with/without preselect)
│   ├── SalonServicesView
│   ├── SalonsListView
│   ├── ProfileView
│   └── NotificationsView
```

## 5. Key Architectural Decisions

- **MVVM** over MVC - better testability, SwiftUI integration
- **NavigationStack** (iOS 16+) instead of UINavigationController
- **async/await** for all networking (no Combine unless needed)
- **EnvironmentObject** for auth state (logged in, role, tokens)
- **@AppStorage** for UserDefaults-backed settings
- **Keychain** for secure token storage (access + refresh tokens)

## 6. Error Handling Strategy

- Network errors → user-friendly messages via ViewModel
- 401 responses → auto-refresh token flow (single retry, then fall back to clearing the session — see API_REFERENCE.md "Token Management" for the exact retry-once behavior verified from Android's `TokenAuthenticator`)
- Each ViewModel has `errorMessage: String?` and `isLoading: Bool`
- Pull-to-refresh on list views with ReloadKey pattern

## 6a. Session Management (verified from `SessionManager` in `AuthApi.kt`)

- Stored keys: `accessToken`, `refreshToken`, `userName`, `userRole` (Android backs these with SharedPreferences; iOS should use Keychain for the tokens per INSTRUCTIONS.md, and can keep name/role in UserDefaults/Keychain as preferred).
- **Session existence is defined solely by a non-blank refresh token** — not by the presence of an access token. `hasSession()` should check `refreshToken` only.
- ⚠️ **Known Android quirk**: `clearSession()` does not explicitly null out the cached `userRole` — it's an easy trap to copy by accident if porting the function signature literally (a `role` param defaulting to "keep current value"). For iOS, prefer clearing role explicitly on logout — this is a bug in Android worth fixing rather than replicating.
- On app launch: if a refresh token exists, silently call `/auth/refresh` once to keep the session warm — success updates stored tokens in place; failure clears the session. This does not by itself force a navigation change (see SCREENS.md app-shell notes for where 401-triggered redirects actually happen).

## 6b. Do not port these Android source files' behavior

Confirmed dead/unused code in the Android app — build iOS from the *other* implementation named alongside each, not these:
- `ScanCameraScreen.kt` / `ScanCameraComponents.kt` — unused fake-progress camera flow (never captures a real photo). Use `ScanScreen.kt`'s real ML-Kit-driven liveness flow instead (see SCREENS.md screen 4).
- `ScanResultsComponents.kt`'s `*Section` composables — unused dark-theme variant of the results report. Use `ScanResultsScreen.kt`'s spec instead (see SCREENS.md screen 4a).

## 7. Dependency Injection

Use manual DI via initializers for ViewModels and Services:

```swift
protocol NetworkServiceProtocol { ... }
class NetworkService: NetworkServiceProtocol { ... }
class AuthViewModel: ObservableObject {
    init(networkService: NetworkServiceProtocol) { ... }
}
```

## 8. Key Libraries (SPM)

| Library | Purpose |
|---------|---------|
| Kingfisher | Async image loading/caching |
| KeychainAccess | Secure token storage |
| SwiftLint | Code style enforcement |

## 9. Folder Structure

```
Hermoso-iOS/
├── App/
│   ├── HermosoApp.swift          # @main entry
│   └── ContentView.swift         # Root navigation
├── Models/
│   ├── DTOs/                    # API request/response models
│   ├── Domain/                  # Domain models (mapped from DTOs)
│   └── Enums/                   # Role, BookingStatus, LivenessStep, etc.
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── HomeViewModel.swift
│   ├── ScanViewModel.swift
│   ├── BookingViewModel.swift
│   └── ... (one per screen)
├── Views/
│   ├── Auth/
│   ├── Customer/
│   │   ├── Home/
│   │   ├── Scan/
│   │   ├── Bookings/
│   │   └── Tracker/
│   ├── Owner/
│   │   ├── Dashboard/
│   │   ├── Calendar/
│   │   ├── Services/
│   │   └── Insights/
│   └── Shared/
├── Services/
│   ├── NetworkService.swift     # URLSession wrapper
│   ├── AuthService.swift        # Token management
│   ├── LocationService.swift    # CoreLocation wrapper
│   └── NotificationService.swift
├── Utils/
│   ├── DateFormatter+Ext.swift
│   ├── Color+Theme.swift
│   ├── View+Extensions.swift
│   └── LocationUtils.swift
└── Resources/
    ├── Assets.xcassets
    ├── Colors.xcassets
    └── GoogleService-Info.plist
```

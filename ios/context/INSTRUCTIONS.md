# Hermoso iOS - Development Instructions for Cursor

## Guidelines

1. **SwiftUI + MVVM**: All UI in SwiftUI using MVVM pattern. Each screen gets:
   - A View file (View layer)
   - A ViewModel file (business logic, ObservableObject)
   - DTOs in Models/DTOs/ (shared Codable structs)

2. **Navigation**: Use `NavigationStack` (iOS 16+) with programmatic navigation via `NavigationPath`. Tab views use `TabView` with `.tabItem`.

3. **Networking**: All network calls use async/await with `URLSession`. The `NetworkService` handles base URL, headers, token injection, and 401 auto-refresh. Never use completion handlers or Combine publishers for networking.

4. **State Management**: 
   - `@State` for local view state
   - `@StateObject` for ViewModel creation
   - `@ObservedObject` for ViewModel injection
   - `@Published` in ViewModels
   - `@AppStorage` for UserDefaults settings
   - Keychain for tokens (via KeychainAccess)

5. **Naming Conventions**:
   - Files: `PascalCase.swift` 
   - DTOs: `LoginRequest.swift`, `SalonDto.swift`
   - Views: `HomeView.swift`, `ScanView.swift`
   - ViewModels: `HomeViewModel.swift`, `ScanViewModel.swift`
   - Services: `NetworkService.swift`, `AuthService.swift`
   - Utils: `DateFormatter+Ext.swift`

6. **Models vs DTOs**: Raw API models go in `Models/DTOs/`. Domain models (with computed properties, defaults) go in `Models/Domain/` if needed. Often DTOs are used directly.

7. **Error Handling Pattern**:
   ```swift
   class SomeViewModel: ObservableObject {
       @Published var isLoading = false
       @Published var errorMessage: String?
       
       func loadData() async {
           isLoading = true
           errorMessage = nil
           do {
               let result = try await networkService.getSomething()
               // handle result
           } catch {
               errorMessage = error.localizedDescription
           }
           isLoading = false
       }
   }
   ```

8. **Color Constants**: Use the hex colors from `THEME.md`. Add all colors as `static let` extensions on `Color` in a single file.

9. **Design System**: Follow the spacing, corner radius, and typography from `THEME.md` exactly.

10. **Validation**: Mirror validation logic exactly from Android:
    - Email: regex pattern
    - Password: min 6 chars
    - Name: min 2 chars
    - Phone: min 10 digits
    - OTP: exactly 6 digits

11. **Camera & Permissions**: 
    - Add `NSCameraUsageDescription` to Info.plist
    - Add `NSLocationWhenInUseUsageDescription` to Info.plist
    - Use `AVCaptureSession` + `AVCaptureVideoPreviewLayer` wrapped in `UIViewRepresentable`
    - Face detection via `Vision` framework (`VNDetectFaceRectanglesRequest` + `VNDetectFaceLandmarksRequest`)
    - Liveness probability uses `VNFaceObservation` properties

12. **Image Handling**: Use `Kingfisher` for remote image loading with caching. For captured photos, use native `Data` → JPEG conversion.

13. **Progress Tracking**: Update `PROGRESS.md` as items are completed.

## Build Process Priority

1. Network layer + DTOs (foundation)
2. Auth flow (login, register, session)
3. Customer main screens (Home, Scan, Bookings, Tracker)
4. Scan + Results flow (most complex feature)
5. Booking flow
6. Owner screens
7. Polish (loading, errors, pull-to-refresh)

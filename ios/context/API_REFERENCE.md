# Hermoso iOS - API Reference

> Verified against `AuthApi.kt` (2026-08-02 audit). Response-shape corrections below are important — some endpoints do NOT follow the generic `ApiResponse<T>`/`ListResponse<T>` pattern.

**Base URL:** Configurable via `API_BASE_URL` (default: `http://10.0.2.2:5000/api/` for Android emulator, for iOS use `http://localhost:5000/api/`)

## ⚠️ Response shape exceptions — read before implementing DTOs

- **`/auth/login` and `/auth/refresh` do NOT return `ApiResponse<T>`.** They return a flat object: `{ success, message, token, accessToken, refreshToken, user }` directly — there's no `data` wrapper. Model this as its own `LoginResponse` struct, not `ApiResponse<LoginResponse>`.
- **`/events` does NOT return `ListResponse<T>`.** It returns `{ success, message, data: [EventDto] }` — a plain `ApiResponse<[EventDto]>`, with **no pagination `meta`** object, unlike `/salons`, `/bookings`, `/notifications`, `/customers`, `/services` which all use `ListResponse<T>` (`{ success, data, meta: { page, limit, total } }`).
- **Virtually every field on every DTO is nullable** in the Android models (`String?`, `Int?`, `Double?`, `List<T>?`) — the client treats the backend contract as fully optional everywhere, not just on genuinely-optional fields. Mirror this with `Optional` properties throughout the Swift DTOs rather than assuming required fields, to avoid decode failures on partial/null API responses.
- **`unreadOnly` on `GET /notifications` is sent as the string `"true"`/`"false"`**, not a JSON boolean query value — match this exact query param encoding.

## Authentication Endpoints

### POST `/auth/register`
```json
// Request
{ "name": "string", "email": "string", "phone": "string", "password": "string", "role": "customer|salon_owner" }
// Response
{ "success": true, "message": "OTP sent", "data": { "email": "string", "phone": "string" } }
```

### POST `/auth/verify-otp`
```json
// Request
{ "email": "string", "otp": "string" }
// Response
{ "success": true, "message": "OTP verified" }
```

### POST `/auth/resend-otp`
```json
// Request
{ "email": "string" }
// Response
{ "success": true, "message": "OTP resent" }
```

### POST `/auth/login`
```json
// Request
{ "email": "string", "password": "string" }
// Response — flat, NOT wrapped in ApiResponse<T> (no "data" key)
{
  "success": true, "message": "string|null", "token": "string", "accessToken": "string", "refreshToken": "string",
  "user": { "_id": "string", "name": "string", "email": "string", "role": "customer|salon_owner" }
}
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "string" }
// Response (same flat shape as login)
```

### POST `/auth/logout`
```json
// Request
{ "refreshToken": "string" }
// Response
{ "success": true, "message": "Logged out" }
```

## User Endpoints

### GET `/users/me`
Response: `ApiResponse<UserProfileDto>`

### PATCH `/users/me`
```json
// Request
{ "name": "string", "phone": "string", "city": "string", "country": "string", "bankAccount": "string" }
```

### PATCH `/users/me/password`
```json
// Request
{ "currentPassword": "string", "newPassword": "string" }
```

## Categories & Salons

### GET `/categories`
Response: `{ "success": true, "data": [ { "_id": "string", "name": "string" } ] }`

### GET `/salons?page=1&limit=20&city=string&search=string`
Response: `ListResponse<SalonDto>`

### GET `/salons/{id}`
Response: `ApiResponse<SalonDetailDto>`

## Booking Endpoints

### GET `/bookings/options?salonId=string&serviceId=string`
Response: `ApiResponse<BookingOptionsData>`

### GET `/bookings/availability?salonId=string&serviceId=string&staffId=string&date=yyyy-MM-dd`
Response: `ApiResponse<BookingAvailabilityData>`

### POST `/bookings`
```json
{ "salonId": "string", "serviceId": "string", "staffId": "string", "bookingDate": "yyyy-MM-dd", "bookingTime": "string" }
```

### GET `/bookings?page=1&limit=20&date=string&status=string`
Response: `ListResponse<BookingItemDto>`

## Scan Endpoints

### POST `/scans/analyze` (multipart)
FormData: `image: File (JPEG)`
Response: `ApiResponse<ScanAnalyzeData>`

### GET `/scans/latest`
Response: `ApiResponse<ScanAnalyzeData>`

### GET `/scans/matches`
Response: `ApiResponse<ScanMatchesData>`

### GET `/scans/improvements`
Response: `ApiResponse<ScanImprovementsData>`

## Notifications

### GET `/notifications?page=1&limit=20&unreadOnly=true|false`
⚠️ `unreadOnly` is sent as the literal string `"true"`/`"false"`, not a JSON bool.
Response: `ListResponse<NotificationDto>`

### PATCH `/notifications/{id}/read`
Response: `ApiResponse<NotificationDto>`

## Events

### GET `/events?page=1&limit=10`
⚠️ Response shape differs from other list endpoints — plain `ApiResponse<List<EventDto>>` with **no `meta`/pagination object**, unlike `ListResponse<T>` used elsewhere.
Response: `{ "success": true, "message": "string|null", "data": [EventDto] }`

## Owner Endpoints

### GET `/customers?page=1&limit=20`
Response: `ListResponse<UserProfileDto>`

### GET `/analytics/owner/dashboard`
Response: `ApiResponse<OwnerDashboardDataDto>`

### GET `/services?page=1&limit=20`
Response: `ListResponse<ServiceDto>`

## Network Service Pattern

```swift
protocol AuthApiProtocol {
    func register(_ request: RegisterRequest) async throws -> ApiResponse<RegisterData>
    func login(_ request: LoginRequest) async throws -> LoginResponse
    func refresh(_ request: RefreshRequest) async throws -> LoginResponse
    func logout(_ request: LogoutRequest) async throws -> ApiResponse<Any>
    func getMyProfile() async throws -> ApiResponse<UserProfileDto>
    func getSalons(page: Int, limit: Int, city: String?, search: String?) async throws -> ListResponse<SalonDto>
    func analyzeScan(imageData: Data) async throws -> ApiResponse<ScanAnalyzeData>
    // ... etc
}
```

## Token Management

- Store `accessToken` and `refreshToken` in Keychain
- Attach `Authorization: Bearer <accessToken>` header to all requests
- On 401: call `/auth/refresh` with refreshToken, using a **separate, un-intercepted** client for the refresh call itself (to avoid an infinite retry loop), and **retry the original request only once** — Android's authenticator gives up after 2 total attempts.
- If refresh fails → clear session locally, but ⚠️ **do not assume a forced navigation happens automatically** — in Android, a failed silent refresh from the request-retry path just clears the session and lets the current screen's own `error` state surface it; the *only* place a 401 forces an immediate redirect to Auth (full stack pop) is the unread-notification-count check that runs on every navigation change (see SCREENS.md app-shell notes). Decide deliberately whether iOS should centralize this (recommended improvement) or match Android's inconsistent behavior.
- Multipart scan upload field name is literally `"image"` (see `/scans/analyze` above) — matters for exact backend compatibility.

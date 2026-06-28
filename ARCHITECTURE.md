# Hermoso - Architecture Documentation

## 1. Project Overview

**Hermoso** is a multi-tenant salon management and booking platform serving three distinct user roles: platform administrators (Super Admins), salon owners, and customers. It enables salon owners to register and manage their businesses, customers to discover and book appointments, and administrators to oversee the entire platform.

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Server Runtime** | Node.js 20.x |
| **Server Framework** | Express.js 4.x |
| **Database** | MongoDB via Mongoose 8.x |
| **Authentication** | JWT (jsonwebtoken) |
| **Client Framework** | React 19.x with Vite 5.x |
| **Client Routing** | React Router v6 |
| **State Management** | Zustand 4.x |
| **HTTP Client** | Axios |
| **Styling** | Tailwind CSS 3.x |
| **Email** | Nodemailer |
| **Scheduler** | node-cron |

---

## 2. Project Structure

```
Hermoso/
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AdminPageSkeleton.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── ErrorBlock.jsx
│   │   │   ├── LoadingBlock.jsx
│   │   │   ├── MiniBarChart.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Topbar.jsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useApi.js
│   │   ├── layouts/        # Page layout wrappers
│   │   │   ├── AdminLayout.jsx     # Admin dashboard layout
│   │   │   └── DashboardLayout.jsx # Owner dashboard layout
│   │   ├── pages/          # Route-level page components
│   │   │   ├── admin/      # Super admin pages (10 pages)
│   │   │   ├── owner/      # Salon owner pages (7 pages)
│   │   │   └── shared/     # Customer & auth pages (7 pages)
│   │   ├── services/       # API service modules (10 files)
│   │   ├── store/          # Zustand state stores
│   │   │   ├── authStore.js
│   │   │   └── uiStore.js
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Router configuration
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── .env                # VITE_API_URL config
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express API
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── controllers/        # Route handlers (11 files)
│   ├── middleware/         # Auth, RBAC, Tenant middleware
│   ├── models/             # Mongoose schemas (8 models)
│   ├── routes/             # Express routers (11 files)
│   ├── services/           # Business logic (4 services)
│   ├── utils/              # Helpers and constants
│   ├── scripts/
│   │   └── seed.js         # Database seeder
│   ├── .env.example
│   ├── server.js           # Entry point
│   └── app.js              # Express app setup
│
├── docs/                   # Postman collection
├── mobile/                 # (placeholder/mobile app)
└── ARCHITECTURE.md
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                     React 19 + Vite SPA                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BrowserRouter → ProtectedRoute → Layout → Outlet       │  │
│  │                                                        │  │
│  │  Components ← Zustand Stores (authStore, uiStore)       │  │
│  │       ↓                                                │  │
│  │  Services (api.js with Axios interceptors)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP + JWT Bearer
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware: CORS → JSON → Morgan → Auth → RBAC         │  │
│  │                                                        │  │
│  │  Routes: auth, salons, services, staff, bookings,       │  │
│  │          reviews, customers, payouts, notifications,   │  │
│  │          analytics                                      │  │
│  │                                                        │  │
│  │  Controllers → Services → Mongoose Models              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               MongoDB (Mongoose ODM)                     │  │
│  │  Users, Salons, Services, Staff, Bookings, Payments,    │  │
│  │  Payouts, Reviews, Notifications                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Request/Response Flow

1. **Authentication Flow**:
   - User submits credentials → `/api/auth/login` or `/api/auth/register`
   - Server validates, returns `JWT + user object`
   - Client stores in `localStorage` via `authStore.setAuth()`
   - `api.js` interceptor attaches `Authorization: Bearer <token>` to all requests

2. **Protected Route Flow**:
   - `ProtectedRoute` checks Zustand store for `token` and `user.role`
   - Role mismatch → redirect to `/login`
   - Role match → render nested `<Outlet />`

3. **API Data Flow**:
   - Pages call service functions (e.g., `bookingService.list()`)
   - Services call `api.get('/bookings')`
   - Axios interceptor adds JWT header
   - Server `authenticate` middleware validates token
   - Server `authorize` middleware checks role permissions
   - Controller processes, returns JSON response
   - Page receives data via `useApi` hook

---

## 4. Server Architecture

### Framework and Runtime
- **Node.js** (ES Modules, `"type": "module"`)
- **Express.js 4.x** for HTTP routing and middleware
- **Mongoose 8.x** for MongoDB object modeling

### API Design
RESTful API at `/api/*` prefix. All routes except auth require JWT authentication.

### Route Breakdown

| Method | Path | Purpose | Roles Allowed |
|--------|------|---------|---------------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Authenticate user | Public |
| GET | /api/salons | List all salons | admin, owner, customer |
| POST | /api/salons | Create salon | owner |
| GET | /api/salons/:id | Get salon details | admin, owner, customer |
| PUT | /api/salons/:id | Update salon | admin, owner |
| PATCH | /api/salons/:id/status | Approve/suspend salon | admin |
| GET | /api/salons/analytics/revenue | Platform revenue | admin |
| GET | /api/services | List services | all roles |
| POST | /api/services | Create service | admin, owner |
| PUT | /api/services/:id | Update service | admin, owner |
| DELETE | /api/services/:id | Delete service | admin, owner |
| GET | /api/staff | List staff members | all roles |
| POST | /api/staff | Create staff | admin, owner |
| PUT | /api/staff/:id | Update staff | admin, owner |
| DELETE | /api/staff/:id | Delete staff | admin, owner |
| GET | /api/bookings | List bookings | all roles |
| POST | /api/bookings | Create booking | customer |
| PATCH | /api/bookings/:id/status | Update booking status | all roles |
| GET | /api/reviews | List reviews | all roles |
| POST | /api/reviews | Create review | customer |
| PATCH | /api/reviews/:id/moderate | Moderate review | admin |
| PATCH | /api/reviews/:id/reply | Reply to review | admin, owner, staff |
| GET | /api/customers | List customers | admin, owner, staff |
| GET | /api/customers/:id/activity | Customer activity | admin, owner, staff |
| GET | /api/payouts | List payouts | admin, owner |
| POST | /api/payouts/request | Request payout | owner |
| PATCH | /api/payouts/:id | Update payout status | admin |
| GET | /api/notifications | List notifications | all roles |
| POST | /api/notifications/announcement | Create announcement | admin |
| PATCH | /api/notifications/:id/read | Mark as read | all roles |
| GET | /api/analytics/admin/dashboard | Admin dashboard data | admin |
| GET | /api/analytics/owner/dashboard | Owner dashboard data | owner |

### Middleware Chain

1. **CORS** — whitelist-based origin checking, credentials enabled
2. **Express JSON** — body parser for JSON payloads
3. **Morgan** — request logging (dev mode)
4. **Route-specific**:
   - `authenticate` — validates JWT, attaches `req.user`
   - `authorize(...roles)` — checks `req.user.role` against allowed list
5. **Error Handler** — catches `ApiError` instances, returns structured JSON

### Database Design

**Models and Schema**:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Authentication & roles | name, email, password, role, status, salonId |
| `Salon` | Business entity | name, ownerId, address, workingHours, commissionRate, status, verified |
| `Service` | Salon offerings | salonId, name, price, duration, category, active |
| `Staff` | Salon employees | salonId, userId, name, role, services[], schedule[] |
| `Booking` | Appointment records | customerId, salonId, serviceId, staffId, bookingDate, bookingTime, status, price |
| `Payment` | Financial records | bookingId, salonId, amount, platformCommission, salonAmount, status |
| `Payout` | Salon payouts | salonId, amount, status, payoutDate |
| `Review` | Customer feedback | salonId, customerId, rating, comment, reply, status |
| `Notification` | System messages | title, message, type, targetRole, salonId, userId, isRead |

**Key Relationships**:
- `User` ↔ `Salon` (owner relationship via `salonId` on User)
- `Salon` ↔ `Service` (1:N via `salonId`)
- `Salon` ↔ `Staff` (1:N via `salonId`)
- `Salon` ↔ `Booking` (1:N via `salonId`)
- `Booking` references `Service` and `Staff`

### Authentication Flow

```
1. Register: email + password + role → User.create() → signToken() → return JWT
2. Login: email + password → findByEmail.select('+password') → comparePassword() → signToken() → return JWT
3. All requests: Authorization: Bearer <token> → jwt.verify() → findById() → attach req.user
4. Password hashing: bcrypt (salt rounds = 10), pre-save hook on User model
5. JWT expiry: configurable via JWT_EXPIRES_IN (default 7d)
```

---

## 5. Client Architecture

### Framework and Build Tool
- **React 18.3** (JSX, functional components)
- **Vite 5.x** (fast dev server and bundler)
- **Tailwind CSS 3.x** (utility-first styling)
- **PostCSS + Autoprefixer** (CSS processing)

### Routing Structure

Three main route groups with role-based protection:

```
/login                    → LoginPage (public)
/register                 → RegisterPage (public)

/admin/* (10 routes)      → AdminLayout + ProtectedRoute[super_admin]
  /admin                  → AdminDashboardPage
  /admin/analytics        → AdminAnalyticsPage
  /admin/salons           → AdminSalonsPage
  /admin/bookings         → AdminBookingsPage
  /admin/customers        → AdminCustomersPage
  /admin/reviews          → AdminReviewsPage
  /admin/revenue          → AdminRevenuePage
  /admin/payouts          → AdminPayoutsPage
  /admin/notifications     → AdminNotificationsPage
  /admin/settings          → AdminSettingsPage
  /admin/profile           → AdminProfilePage

/owner/* (7 routes)      → DashboardLayout + ProtectedRoute[salon_owner]
  /owner                  → OwnerDashboardPage
  /owner/services         → OwnerServicesPage
  /owner/staff            → OwnerStaffPage
  /owner/bookings         → OwnerBookingsPage
  /owner/customers        → OwnerCustomersPage
  /owner/reviews          → OwnerReviewsPage
  /owner/revenue          → OwnerRevenuePage

/customer/* (5 routes)    → ProtectedRoute[customer]
  /customer/salons        → SalonListPage
  /customer/salons/:id    → SalonDetailPage
  /customer/booking      → BookingPage
  /customer/profile       → ProfilePage
  /customer/bookings     → BookingHistoryPage

/ (root)                 → Navigate to /login
```

### Component Hierarchy

```
App.jsx (BrowserRouter)
├── ProtectedRoute (wraps all protected routes)
│   └── Layout (AdminLayout | DashboardLayout)
│       ├── Sidebar
│       ├── Topbar
│       └── Outlet → Page Component
│           ├── AdminPageSkeleton (loading state)
│           ├── DataTable
│           ├── ErrorBlock
│           ├── StatCard
│           ├── MiniBarChart
│           └── ...
```

### State Management

**Zustand stores**:

| Store | State | Actions |
|-------|-------|---------|
| `authStore` | `token`, `user` | `setAuth({token, user})`, `logout()` |
| `uiStore` | `theme` ('light'/'dark') | `setTheme()`, `toggleTheme()` |

Auth state is persisted to `localStorage` under keys `hermoso_token` and `hermoso_user`.

### How API Calls Are Made

1. **Central Axios instance** (`services/api.js`):
   - Base URL from `VITE_API_URL` env (default: `http://localhost:5000/api`)
   - Request interceptor adds `Authorization: Bearer <token>` from localStorage

2. **Service modules** (e.g., `bookingService.js`):
   - Thin wrappers around `api` calls
   - Return raw `data` from Axios response

3. **Custom hook `useApi`**:
   - Accepts a `fetcher` function and dependency array
   - Manages `data`, `loading`, `error` state
   - Handles cleanup on unmount (prevents state updates after unmount)
   - Re-fetches when dependencies change

---

## 6. Data Flow

### Login Flow

```
┌─────────┐     POST /api/auth/login      ┌────────────┐
│  Login  │ ──────────────────────────────▶│   Server   │
│  Page   │  {email, password}              │  Auth Ctrl │
└─────────┘                               └─────┬──────┘
    │                                           │
    │                                           ▼
    │                                    ┌────────────┐
    │   setAuth({token, user})            │   MongoDB  │
    │ ◀───────────────────────────────── │   (User)   │
    │                                    └────────────┘
    │
    │  navigate('/admin'|'/owner'|'/customer/salons')
    ▼
┌─────────┐
│ Dashboard│
│ Layout   │
└─────────┘
```

### Booking Creation Flow

```
┌─────────────┐  POST /api/bookings      ┌──────────────┐
│ Customer    │ ───────────────────────▶ │   Server     │
│ BookingPage │  {salonId, serviceId,    │  Booking     │
└─────────────┘   staffId, date, time}   │  Controller  │
    │                                   └───────┬──────┘
    │                                           │
    │                                           ▼
    │                                    ┌──────────────┐
    │                                    │   MongoDB    │
    │                                    │  (Booking)   │
    │                                    └──────────────┘
    │
    │  navigate('/customer/bookings')
    ▼
┌─────────────────┐
│BookingHistoryPage│
└─────────────────┘
```

### Admin Dashboard Analytics Flow

```
┌─────────────────┐  GET /api/analytics/admin/dashboard
│ AdminDashboard   │ ──────────────────────────────────▶ ┌──────────────┐
│ Page            │                                    │   Server     │
└─────────────────┘                                    │  Analytics   │
     │                                                  │  Controller  │
     │  useApi(() => dashboardService.getAdmin())      └──────┬───────┘
     │  ├─ loading: true (initial)                             │
     │  ├─ loading: false (after fetch)                 ┌──────▼───────┐
     │  └─ data: { totals, charts, activity, recentSalons }│   MongoDB    │
     │       ▲                                           │  Aggregation │
     │       └────────────────────────────────────────── │              │
     │                                                  └──────────────┘
     ▼
Render charts with data.totals, data.charts.*, etc.
```

---

## 7. Key Dependencies

### Server Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT generation/verification |
| `bcryptjs` | Password hashing |
| `cors` | Cross-origin resource sharing |
| `morgan` | HTTP request logging |
| `dotenv` | Environment variable loading |
| `nodemailer` | Email sending (SMTP) |
| `node-cron` | Scheduled job execution |

### Client Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `zustand` | Lightweight state management |
| `@vitejs/plugin-react` | Vite React support |
| `vite` | Build tool and dev server |
| `tailwindcss` | CSS utility framework |
| `autoprefixer` | CSS vendor prefixing |
| `postcss` | CSS transformation |

---

## 8. Environment & Configuration

### Server Variables (.env.example)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | mongodb://127.0.0.1:27017/hermoso |
| `JWT_SECRET` | Secret key for JWT signing | change_me |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CLIENT_URL` | Primary client URL | http://localhost:5173 |
| `CLIENT_URLS` | Comma-separated list of allowed origins | localhost:5173,127.0.0.1:5173 |
| `SMTP_HOST` | SMTP server host | smtp.gmail.com |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_SECURE` | Use TLS | false |
| `SMTP_USER` | SMTP username | (empty) |
| `SMTP_PASS` | SMTP password | (empty) |
| `SMTP_FROM` | Sender email address | Hermoso <no-reply@hermoso.app> |
| `BOOKING_REMINDER_HOURS` | Hours before appointment to send reminder | 24 |

### Client Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | http://localhost:5000/api |

### Configuration Management

- **Server**: dotenv loaded at startup, variables accessed via `process.env`
- **Client**: Vite replaces `import.meta.env.VITE_*` at build time
- **CORS**: Dynamically combines hardcoded defaults with `CLIENT_URLS` env variable

---

## 9. Consortium Recommendations

### Identified Patterns and Architectural Decisions

1. **Role-Based Access Control (RBAC)**:
   - Four distinct roles: `super_admin`, `salon_owner`, `staff`, `customer`
   - Middleware-based authorization on all protected routes
   - Role-specific routing on the client side

2. **Multi-Tenant Architecture**:
   - Salon-scoped data isolation via `salonId` fields
   - `tenant.middleware.js` provides scoping helpers
   - Super admin can access all data; other roles scoped to their salon

3. **State Management**:
   - Minimal state management with Zustand (only auth and theme)
   - Server-driven data fetching via `useApi` hook
   - LocalStorage persistence for auth token across sessions

4. **CSS Architecture**:
   - Dual styling approach: Tailwind CSS utilities for owner/customer pages, custom CSS variables for admin dashboard
   - Admin uses custom CSS (`--var-*` syntax) separate from Tailwind

### Potential Improvements

1. **Security**:
   - JWT secret should be required, not optional (enforce strong secrets)
   - Consider adding rate limiting for auth endpoints
   - Add input validation middleware (e.g., express-validator)

2. **Error Handling**:
   - No centralized error logging (console.error only)
   - Consider adding a logging service (winston/pino)
   - No retry logic for API calls on the client

3. **Scalability**:
   - No caching layer (Redis) — queries hit MongoDB directly
   - Booking availability checks have no optimistic locking
   - No connection pooling tuning for MongoDB

4. **Database**:
   - No indexes on some frequently queried fields (e.g., `bookings.bookingTime`)
   - Payment model references Booking but doesn't cascade-delete
   - No soft-delete patterns for any model

5. **Client Architecture**:
   - Admin pages use custom CSS while owner/customer use Tailwind — inconsistent styling system
   - No global error boundary for React
   - `useApi` hook has no refresh/retry mechanism

6. **Email Service**:
   - Email is optional (gracefully skipped when SMTP not configured)
   - Consider adding a verification email flow

7. **Testing**:
   - No test suite visible in the codebase
   - No e2e tests, no unit tests

8. **Deployment**:
   - No Docker configuration
   - No CI/CD pipeline
   - Static files in `client/dist` suggest manual build step

---

*Document generated: 2026-05-12*
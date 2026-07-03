# Hermoso - Trello Board (Project Progress)

> **Project:** Hermoso - Multi-Tenant Salon Management & Booking Platform
> **Tech Stack:** React 19 + Vite (Web) | Kotlin/Jetpack Compose (Mobile) | Node.js/Express (API) | MongoDB
> **Roles:** Super Admin | Salon Owner | Staff | Customer

---

## 📋 List 1: Authentication & User Management

### Card 1.1 — Login/Register (Web)
- [x] Login page with email/password
- [x] Register page with role selection
- [x] JWT token storage via Zustand + localStorage
- [x] Auto-redirect based on role
- **Screenshot:** `[Screenshot_LoginPage.png]`

### Card 1.2 — OTP Verification
- [x] OTP input screen
- [x] Email-based OTP sending (Nodemailer)
- [x] Verify OTP and complete registration
- **Screenshot:** `[Screenshot_OTPPage.png]`

### Card 1.3 — Profile Management
- [x] View/edit profile (name, email, phone)
- [x] Role-based profile view
- [x] Profile page for all roles
- **Screenshot:** `[Screenshot_ProfilePage.png]`

### Card 1.4 — Role-Based Access Control (RBAC)
- [x] JWT authentication middleware
- [x] Role-based authorization (super_admin, salon_owner, staff, customer)
- [x] ProtectedRoute component on client
- [x] Role-specific sidebar and navigation
- **Screenshot:** `[Screenshot_RBAC_Flow.png]`

---

## 📋 List 2: Super Admin Dashboard (Web)

### Card 2.1 — Admin Dashboard
- [x] Stats cards (total salons, users, bookings, revenue)
- [x] Mini bar charts for trends
- [x] Recent activity feed
- [x] Recent salons list
- **Screenshot:** `[Screenshot_AdminDashboard.png]`

### Card 2.2 — Salon Management (Admin)
- [x] DataTable with all salons
- [x] Approve/suspend salon status
- [x] Salon detail view
- [x] Create/edit salon modal
- **Screenshot:** `[Screenshot_AdminSalons.png]`

### Card 2.3 — Booking Management (Admin)
- [x] All platform bookings in DataTable
- [x] Filter by status, date, salon
- [x] Booking status updates
- **Screenshot:** `[Screenshot_AdminBookings.png]`

### Card 2.4 — Customer Management (Admin)
- [x] All platform customers list
- [x] Customer detail modal with activity
- [x] Search and pagination
- **Screenshot:** `[Screenshot_AdminCustomers.png]`

### Card 2.5 — Reviews Moderation (Admin)
- [x] All reviews across platform
- [x] Moderate (approve/reject) reviews
- [x] Reply to reviews
- **Screenshot:** `[Screenshot_AdminReviews.png]`

### Card 2.6 — Revenue & Analytics (Admin)
- [x] Platform revenue overview
- [x] Commission tracking
- [x] Analytics dashboard with charts
- **Screenshot:** `[Screenshot_AdminRevenue.png]`
- **Screenshot:** `[Screenshot_AdminAnalytics.png]`

### Card 2.7 — Payout Management (Admin)
- [x] Payout requests from owners
- [x] Approve/reject payouts
- [x] Payout detail modal
- **Screenshot:** `[Screenshot_AdminPayouts.png]`

### Card 2.8 — Notifications (Admin)
- [x] Create platform-wide announcements
- [x] View all notifications
- [x] Mark as read
- **Screenshot:** `[Screenshot_AdminNotifications.png]`

### Card 2.9 — Settings & Profile (Admin)
- [x] Platform settings page
- [x] Admin profile management
- **Screenshot:** `[Screenshot_AdminSettings.png]`

---

## 📋 List 3: Salon Owner Dashboard (Web)

### Card 3.1 — Owner Dashboard
- [x] Stats cards (bookings, revenue, customers, services)
- [x] Charts for revenue trends
- [x] Recent bookings list
- **Screenshot:** `[Screenshot_OwnerDashboard.png]`

### Card 3.2 — Services Management (Owner)
- [x] CRUD for salon services
- [x] Service modal (name, price, duration, category)
- [x] Active/inactive toggle
- **Screenshot:** `[Screenshot_OwnerServices.png]`

### Card 3.3 — Staff Management (Owner)
- [x] CRUD for staff members
- [x] Assign services to staff
- [x] Staff schedule management
- **Screenshot:** `[Screenshot_OwnerStaff.png]`

### Card 3.4 — Booking Management (Owner)
- [x] View salon bookings
- [x] Update booking status
- [x] Filter by date/status
- **Screenshot:** `[Screenshot_OwnerBookings.png]`

### Card 3.5 — Customer Management (Owner)
- [x] View salon customers
- [x] Customer activity history
- **Screenshot:** `[Screenshot_OwnerCustomers.png]`

### Card 3.6 — Reviews (Owner)
- [x] View salon reviews
- [x] Reply to customer reviews
- **Screenshot:** `[Screenshot_OwnerReviews.png]`

### Card 3.7 — Revenue (Owner)
- [x] Salon revenue breakdown
- [x] Commission deductions view
- **Screenshot:** `[Screenshot_OwnerRevenue.png]`

### Card 3.8 — POS System (Owner)
- [x] Point-of-sale interface
- [x] Walk-in booking creation
- [x] Payment processing
- **Screenshot:** `[Screenshot_OwnerPOS.png]`

### Card 3.9 — Events (Owner)
- [x] Create/manage salon events
- [x] Event modal
- **Screenshot:** `[Screenshot_OwnerEvents.png]`

### Card 3.10 — Notifications (Owner)
- [x] View notifications
- [x] Mark as read
- **Screenshot:** `[Screenshot_OwnerNotifications.png]`

---

## 📋 List 4: Customer Web App (Web)

### Card 4.1 — Salon Listing & Search
- [x] Browse all salons
- [x] Search bar with filters
- [x] Salon cards with details
- **Screenshot:** `[Screenshot_SalonList.png]`

### Card 4.2 — Salon Detail Page
- [x] Salon info (address, hours, rating)
- [x] Services list with prices
- [x] Staff profiles
- [x] Reviews section
- **Screenshot:** `[Screenshot_SalonDetail.png]`

### Card 4.3 — Booking Flow
- [x] Select service
- [x] Select staff
- [x] Select date/time
- [x] Confirm booking
- **Screenshot:** `[Screenshot_BookingFlow.png]`

### Card 4.4 — Booking History
- [x] List of past/upcoming bookings
- [x] Booking status tracking
- [x] Cancel booking option
- **Screenshot:** `[Screenshot_BookingHistory.png]`

### Card 4.5 — 404 Not Found Page
- [x] Custom 404 error page
- **Screenshot:** `[Screenshot_NotFoundPage.png]`

---

## 📋 List 5: Mobile App — Customer (Android/Kotlin)

### Card 5.1 — App Foundation
- [x] Android project setup (Gradle/Kotlin)
- [x] Jetpack Compose UI framework
- [x] Navigation setup
- [x] Theme & color system
- **Screenshot:** `[Screenshot_Mobile_Customer_App.png]`

### Card 5.2 — Auth Screens (Mobile)
- [x] Login screen
- [x] Registration screen
- [x] OTP verification
- **Screenshot:** `[Screenshot_Mobile_Auth.png]`

### Card 5.3 — Home & Salon Discovery
- [x] Home screen with salon listing
- [x] Salon search
- [x] Salon detail with services
- **Screenshot:** `[Screenshot_Mobile_Home.png]`

### Card 5.4 — Booking (Mobile)
- [x] Service selection
- [x] Staff selection
- [x] Date/time picker (CalendarComponent)
- [x] Booking confirmation
- **Screenshot:** `[Screenshot_Mobile_Booking.png]`

### Card 5.5 — Booking List (Mobile)
- [x] View upcoming/past bookings
- [x] Booking status
- **Screenshot:** `[Screenshot_Mobile_BookingList.png]`

### Card 5.6 — AI Skin Scan
- [x] Camera-based skin scanning
- [x] AI analysis integration (OpenRouter API)
- [x] Scan results display
- [x] Recommendations screen
- **Screenshot:** `[Screenshot_Mobile_SkinScan.png]`
- **Screenshot:** `[Screenshot_Mobile_Recommendations.png]`

### Card 5.7 — Profile & Notifications (Mobile)
- [x] User profile screen
- [x] Notification center
- [x] App settings
- **Screenshot:** `[Screenshot_Mobile_Profile.png]`
- **Screenshot:** `[Screenshot_Mobile_Notifications.png]`

### Card 5.8 — Appointment Tracker
- [x] Real-time appointment tracking
- [x] Status updates
- **Screenshot:** `[Screenshot_Mobile_Tracker.png]`

---

## 📋 List 6: Mobile App — Business/Owner (Android/Kotlin)

### Card 6.1 — Business App Foundation
- [x] Android project setup
- [x] Jetpack Compose + navigation
- [x] Theme/colors
- **Screenshot:** `[Screenshot_Mobile_Business_App.png]`

### Card 6.2 — Auth (Business)
- [x] Login for salon owners
- [x] Auth API integration
- **Screenshot:** `[Screenshot_Mobile_Business_Auth.png]`

### Card 6.3 — Owner Dashboard (Mobile)
- [x] Business overview stats
- [x] Quick actions
- **Screenshot:** `[Screenshot_Mobile_Business_Dashboard.png]`

### Card 6.4 — Calendar & Bookings (Mobile)
- [x] Calendar view (OwnerCalendarScreen)
- [x] Booking management
- **Screenshot:** `[Screenshot_Mobile_Business_Calendar.png]`

### Card 6.5 — Clients & Services (Mobile)
- [x] Client list (OwnerClientsScreen)
- [x] Service management (OwnerServicesScreen)
- **Screenshot:** `[Screenshot_Mobile_Business_Clients.png]`
- **Screenshot:** `[Screenshot_Mobile_Business_Services.png]`

### Card 6.6 — Insights & Notifications (Mobile)
- [x] Business insights/analytics (OwnerInsightsScreen)
- [x] Notification center
- **Screenshot:** `[Screenshot_Mobile_Business_Insights.png]`
- **Screenshot:** `[Screenshot_Mobile_Business_Notifications.png]`

---

## 📋 List 7: Server API (Backend)

### Card 7.1 — Authentication API
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] JWT token generation & verification
- [x] Refresh token mechanism
- **Screenshot:** `[Screenshot_API_Auth.png]`

### Card 7.2 — Salon Management API
- [x] CRUD /api/salons
- [x] Salon status approval (admin)
- [x] Multi-tenant data isolation
- **Screenshot:** `[Screenshot_API_Salons.png]`

### Card 7.3 — Services & Staff API
- [x] CRUD /api/services
- [x] CRUD /api/staff
- [x] Staff-service assignment
- **Screenshot:** `[Screenshot_API_Services.png]`

### Card 7.4 — Booking API
- [x] POST /api/bookings (create)
- [x] GET /api/bookings (list with filters)
- [x] PATCH booking status
- **Screenshot:** `[Screenshot_API_Bookings.png]`

### Card 7.5 — Reviews API
- [x] POST /api/reviews (create)
- [x] Moderate reviews (admin)
- [x] Reply to reviews
- **Screenshot:** `[Screenshot_API_Reviews.png]`

### Card 7.6 — Customers & Payouts API
- [x] GET /api/customers
- [x] Customer activity tracking
- [x] POST /api/payouts/request
- [x] Payout approval flow
- **Screenshot:** `[Screenshot_API_Payouts.png]`

### Card 7.7 — Notifications & Events API
- [x] CRUD /api/notifications
- [x] Admin announcements
- [x] Events management
- **Screenshot:** `[Screenshot_API_Notifications.png]`

### Card 7.8 — Analytics API
- [x] Admin dashboard analytics (aggregations)
- [x] Owner dashboard analytics
- [x] Revenue & booking metrics
- **Screenshot:** `[Screenshot_API_Analytics.png]`

### Card 7.9 — POS & Scan API
- [x] POS transaction handling
- [x] Skin scan image upload (Cloudinary)
- [x] AI analysis via OpenRouter API
- **Screenshot:** `[Screenshot_API_POS.png]`

### Card 7.10 — Database Models
- [x] User, Salon, Service, Staff
- [x] Booking, Payment, Payout
- [x] Review, Notification, Category
- [x] Event, POS, SkinScan, RefreshToken
- **Screenshot:** `[Screenshot_DB_Models.png]`

### Card 7.11 — Middleware & Infrastructure
- [x] Auth middleware (JWT validation)
- [x] RBAC middleware (role checking)
- [x] Tenant middleware (data scoping)
- [x] File upload middleware (Multer + Cloudinary)
- [x] Swagger API documentation
- [x] Error handling middleware
- [x] CORS configuration
- **Screenshot:** `[Screenshot_Middleware.png]`

---

## 📋 List 8: Shared UI Components (Web)

### Card 8.1 — Layout Components
- [x] AdminLayout (sidebar + topbar + content)
- [x] PublicLayout
- [x] Sidebar with role-based menu
- [x] TopBar with theme toggle & notifications
- **Screenshot:** `[Screenshot_Layouts.png]`

### Card 8.2 — DataTable Component
- [x] Sortable columns
- [x] Pagination
- [x] Search/filter
- [x] Action buttons per row
- **Screenshot:** `[Screenshot_DataTable.png]`

### Card 8.3 — Form Components
- [x] Reusable FormInput
- [x] MultiSelectInput
- [x] Form wrapper with validation
- **Screenshot:** `[Screenshot_FormComponents.png]`

### Card 8.4 — Modal Components
- [x] GenericModal
- [x] ServiceModal, StaffModal, SalonModal
- [x] EventModal, PayoutDetailModal
- [x] CustomerDetailModal, NotificationModal
- **Screenshot:** `[Screenshot_Modals.png]`

### Card 8.5 — Utility Components
- [x] StatCard (metrics display)
- [x] MiniBarChart (trend visualization)
- [x] LoadingBlock, ErrorBlock
- [x] NoDataFound, ProtectedRoute
- [x] Skeleton loaders (TableSkeleton, AdminPageSkeleton)
- **Screenshot:** `[Screenshot_UtilityComponents.png]`

---

## 📋 List 9: Infrastructure & DevOps

### Card 9.1 — Backend Configuration
- [x] Environment variables (.env)
- [x] MongoDB connection setup
- [x] Server entry point (server.ts)
- [x] Express app configuration (app.ts)
- [x] CORS whitelist
- **Screenshot:** `[Screenshot_ServerConfig.png]`

### Card 9.2 — Email Service
- [x] Nodemailer SMTP integration
- [x] Booking confirmation emails
- [x] OTP email delivery
- [x] Graceful fallback when SMTP not configured
- **Screenshot:** `[Screenshot_EmailService.png]`

### Card 9.3 — Scheduler Service
- [x] node-cron integration
- [x] Booking reminder emails
- [x] Configurable reminder timing
- **Screenshot:** `[Screenshot_Scheduler.png]`

### Card 9.4 — Linting & Code Quality
- [x] ESLint configuration
- [x] Husky pre-commit hooks
- [x] lint-staged for auto-fixing
- [x] TypeScript throughout
- **Screenshot:** `[Screenshot_LintSetup.png]`

### Card 9.5 — Database Seeding
- [x] Seed script for development data
- [x] Sample salons, services, staff, bookings
- **Screenshot:** `[Screenshot_SeedScript.png]`

### Card 9.6 — Deployment
- [x] Vercel configuration (server/vercel.json)
- [ ] Docker setup
- [ ] CI/CD pipeline
- **Screenshot:** `[Screenshot_Deployment.png]`

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Completed | Feature is built and working |
| 🔄 In Progress | Currently being worked on |
| ⬜ Pending | Not yet started |
| ❌ Blocked | Blocked by dependencies |

---

## Progress Summary

| Module | Status | Completion |
|--------|--------|------------|
| Auth & User Management | ✅ Complete | 100% |
| Super Admin Dashboard (Web) | ✅ Complete | 100% |
| Salon Owner Dashboard (Web) | ✅ Complete | 100% |
| Customer Web App | ✅ Complete | 100% |
| Mobile App — Customer | ✅ Complete | 100% |
| Mobile App — Business | ✅ Complete | 100% |
| Server API | ✅ Complete | 100% |
| Shared UI Components | ✅ Complete | 100% |
| Infrastructure & DevOps | 🔄 Mostly Done | ~85% |

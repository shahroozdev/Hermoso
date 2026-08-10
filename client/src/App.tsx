import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/shared/LoginPage';
import RegisterPage from './pages/shared/RegisterPage';
import VerifyOtpPage from './pages/shared/VerifyOtpPage';
import NotFoundPage from './pages/shared/NotFoundPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSalonsPage from './pages/admin/AdminSalonsPage';
import AdminOwnersPage from './pages/admin/AdminOwnersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminRevenuePage from './pages/admin/AdminRevenuePage';
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerServicesPage from './pages/owner/OwnerServicesPage';
import OwnerEventsPage from './pages/owner/OwnerEventsPage';
import OwnerPOSPage from './pages/owner/OwnerPOSPage';
import OwnerStaffPage from './pages/owner/OwnerStaffPage';
import OwnerBookingsPage from './pages/owner/OwnerBookingsPage';
import OwnerCustomersPage from './pages/owner/OwnerCustomersPage';
import OwnerReviewsPage from './pages/owner/OwnerReviewsPage';
import OwnerRevenuePage from './pages/owner/OwnerRevenuePage';
import OwnerNotificationsPage from './pages/owner/OwnerNotificationsPage';
import SalonListPage from './pages/shared/SalonListPage';
import SalonDetailPage from './pages/shared/SalonDetailPage';
import BookingPage from './pages/shared/BookingPage';
import ProfilePage from './pages/shared/ProfilePage';
import BookingHistoryPage from './pages/shared/BookingHistoryPage';
import ScanPage from './pages/shared/ScanPage';
import ScanResultsPage from './pages/shared/ScanResultsPage';
import ProgressReportPage from './pages/shared/ProgressReportPage';
import SalonMatchPage from './pages/shared/SalonMatchPage';
import PublicLayout from './layouts/PublicLayout';
import { customerNavGroups, navGroups, ownerNavGroups } from './components/constant';
import ProtectedLayout from './layouts/AdminLayout';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
        <Route path="/admin" element={<ProtectedLayout item={navGroups} isAdmin/>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="salons" element={<AdminSalonsPage />} />
          <Route path="owners" element={<AdminOwnersPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="revenue" element={<AdminRevenuePage />} />
          <Route path="payouts" element={<AdminPayoutsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['salon_owner']} />}>
        <Route path="/owner" element={<ProtectedLayout item={ownerNavGroups} />}>
          <Route index element={<OwnerDashboardPage />} />
          <Route path="services" element={<OwnerServicesPage />} />
          <Route path="events" element={<OwnerEventsPage />} />
          <Route path="pos" element={<OwnerPOSPage />} />
          <Route path="staff" element={<OwnerStaffPage />} />
          <Route path="bookings" element={<OwnerBookingsPage />} />
          <Route path="customers" element={<OwnerCustomersPage />} />
          <Route path="reviews" element={<OwnerReviewsPage />} />
          <Route path="revenue" element={<OwnerRevenuePage />} />
          <Route path="notifications" element={<OwnerNotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/customer" element={<ProtectedLayout item={customerNavGroups} />}>
          <Route index element={<Navigate to="salons" replace />} />
          <Route path="salons" element={<SalonListPage />} />
          <Route path="salons/:id" element={<SalonDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="bookings" element={<BookingHistoryPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="scan-results" element={<ScanResultsPage />} />
          <Route path="progress" element={<ProgressReportPage />} />
          <Route path="matched-salons" element={<SalonMatchPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;

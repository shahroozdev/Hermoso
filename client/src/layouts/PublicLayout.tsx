import { Link, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { tokenCookies } from '../utils/tokenCookies';
import { useUIStore } from '../store/uiStore';
const iconClass = 'h-5 w-5';
const normalizeRole = (role?: string) => {
  if (role === 'admin') return 'super_admin';
  return role;
};

const getRoleHome = (role?: string) => {
  const normalized = normalizeRole(role);
  if (normalized === 'super_admin') return '/admin';
  if (normalized === 'salon_owner') return '/owner';
  return '/customer/salons';
};

const PublicLayout = () => {
  const { user } = useAuthStore();
  const token = tokenCookies.getAccessToken();
  const { theme, toggleTheme } = useUIStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (token && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="fixed right-4 top-4 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] shadow"
      >
         {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
              </svg>
            )}
      </button>
      <Outlet />
      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 pb-6 text-xs text-[var(--muted)]">
        <Link to="/privacy-policy" className="hover:text-[var(--accent)]">Privacy Policy</Link>
        <Link to="/terms-and-conditions" className="hover:text-[var(--accent)]">Terms and Conditions</Link>
        <Link to="/refund-policy" className="hover:text-[var(--accent)]">Cancellation & Refund Policy</Link>
        <Link to="/ownership-statement" className="hover:text-[var(--accent)]">Ownership Statement</Link>
      </footer>
    </>
  );
};

export default PublicLayout;

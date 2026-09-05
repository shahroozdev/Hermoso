import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { tokenCookies } from "../utils/tokenCookies";
import { useUIStore } from "../store/uiStore";
import { legalLinks } from "./LegalLayout";
const iconClass = "h-5 w-5";
const normalizeRole = (role?: string) => {
  if (role === "admin") return "super_admin";
  return role;
};

const getRoleHome = (role?: string) => {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return "/admin";
  if (normalized === "salon_owner") return "/owner";
  return "/customer/salons";
};

const PublicLayout = () => {
  const { user } = useAuthStore();
  const token = tokenCookies.getAccessToken();
  const { theme, toggleTheme } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // /create-salon is reachable by an already-authenticated owner too (e.g. an
  // admin created their account without a salon yet) — don't bounce them home.
  const allowAuthenticated = location.pathname === "/create-salon";

  if (token && user && !allowAuthenticated) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="fixed right-4 top-4 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] shadow"
      >
        {theme === "dark" ? (
          <svg
            viewBox="0 0 24 24"
            className={iconClass}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className={iconClass}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
          </svg>
        )}
      </button>
      <header className="flex items-center justify-center gap-2 px-6 py-8">
        <Link to="/login" className="flex items-center gap-2">
          <img src="/assets/icons/HermosoLogo.svg" alt="Hermoso" className="h-9 w-9" />
          <span className="text-lg font-semibold text-[var(--text)]">Hermoso</span>
        </Link>
      </header>
      <Outlet />
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 text-sm">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[var(--muted)] hover:text-[var(--accent)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-[var(--muted)]">
            &copy; {new Date().getFullYear()} Hermoso. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default PublicLayout;

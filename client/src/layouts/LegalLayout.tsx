import { Link, Outlet } from 'react-router-dom';

export const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-and-conditions', label: 'Terms and Conditions' },
  { to: '/refund-policy', label: 'Cancellation & Refund Policy' },
  { to: '/ownership-statement', label: 'Ownership Statement' }
];

const LegalLayout = () => (
  <div className="flex min-h-screen flex-col bg-[var(--bg)]">
    <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <Link to="/login" className="text-lg font-semibold text-[var(--text)]">
        Hermoso App
      </Link>
    </header>

    <main className="flex-1"> 
      <Outlet />
    </main>

    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 text-sm">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-[var(--muted)] hover:text-[var(--accent)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-[var(--muted)]">&copy; {new Date().getFullYear()} Hermoso. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default LegalLayout;

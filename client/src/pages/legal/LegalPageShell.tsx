import { ReactNode } from 'react';

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalPageShell = ({ title, lastUpdated, children }: LegalPageShellProps) => (
  <div className="mx-auto w-full max-w-3xl px-6 py-10">
    <div className="shell-panel rounded-2xl p-6 sm:p-10">
      <h1 className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Last updated: {lastUpdated}</p>
      <div className="legal-content mt-6 space-y-5 text-sm leading-relaxed text-[var(--text)] sm:text-base">
        {children}
      </div>
    </div>
  </div>
);

export default LegalPageShell;

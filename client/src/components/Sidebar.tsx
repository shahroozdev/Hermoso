import { NavLink, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
}

interface SidebarProps {
  items: NavItem[];
  mobileOpen: boolean;
  onClose: () => void;
  roleLabel?: string;
}

const Sidebar = ({
  items,
  mobileOpen,
  onClose,
  roleLabel = "Dashboard",
}: SidebarProps) => {
   const location = useLocation();
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 transition-opacity md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur transition-transform md:sticky md:top-0 md:z-20 md:h-screen md:w-64 md:self-start md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-[var(--border)] px-5 py-5">
          <p className="text-lg font-semibold tracking-[0.2em] text-[var(--accent-2)]">
            HERMOSO
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            {roleLabel}
          </p>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={() => {
                return `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  item?.to === location?.pathname
                    ? "bg-[var(--surface-soft)] text-[var(--accent-2)] ring-1 ring-[var(--ring)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                }`;
              }}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

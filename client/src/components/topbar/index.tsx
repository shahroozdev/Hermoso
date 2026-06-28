import { useAuthStore } from "../../store/authStore";
import NotificationWidget from "./notificationWidget";
import Searchbar from "@/pages/shared/Searchbar";
import ThemeToggleBtn from "./ThemeToggleBtn";
import TopBarBtn, { resolvePageKey } from "./TopBarBtn";
import { pageMeta } from "../constant";


interface TopbarProps {
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const Topbar = ({ onMenuClick, isAdmin }: TopbarProps) => {
  const { logout } = useAuthStore();
  const key = resolvePageKey(location.pathname);
  const meta = pageMeta[key] || pageMeta.overview;
  return (
    <header className="ha-topbar sticky top-0 z-30">
      <button
        className="ha-menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="ha-title-wrap">
        <div className="ha-topbar-title">{meta.title}</div>
        <div className="ha-topbar-sub">{meta.sub}</div>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Searchbar />
        {isAdmin && <TopBarBtn />}
        <ThemeToggleBtn />

        <NotificationWidget />

        {!isAdmin && (
          <button
            onClick={logout}
            className="rounded-xl bg-[var(--accent-2)] px-3 py-2 text-xs font-semibold text-slate-900 md:px-4"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;

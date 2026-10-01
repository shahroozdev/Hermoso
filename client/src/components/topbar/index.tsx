import NotificationWidget from "./notificationWidget";
import Searchbar from "@/pages/shared/Searchbar";
import ThemeToggleBtn from "./ThemeToggleBtn";
import TopBarBtn, { resolvePageKey } from "./TopBarBtn";
import { pageMeta } from "../constant";
import { useAuthStore } from "@/store/authStore";


interface TopbarProps {
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const Topbar = ({ onMenuClick, isAdmin }: TopbarProps) => {
  const user = useAuthStore((state) => state.user);
  const key = resolvePageKey(location.pathname);
  const isOwnerDashboard = !isAdmin && (location.pathname === "/owner" || location.pathname === "/owner/");
  const meta = isOwnerDashboard
    ? { title: "Dashboard", sub: "Salon performance overview", action: "" }
    : pageMeta[key] || pageMeta.overview;
  const salonName = !isAdmin && user?.salonId && typeof user.salonId === 'object' ? user.salonId.name : undefined;
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
        {salonName && <div className="text-xs font-semibold text-[var(--accent-2)]">{salonName}</div>}
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Searchbar />
        {isAdmin && <TopBarBtn />}
        <ThemeToggleBtn />

        <NotificationWidget />
      </div>
    </header>
  );
};

export default Topbar;

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import { NavGroup } from "@/components/constant";
import Topbar from "@/components/topbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { salonService } from "@/services/salonService";
import { bookingService } from "@/services/bookingService";
import { reviewService } from "@/services/reviewService";
import { payoutService } from "@/services/payoutService";

const PENDING_BADGE_KEYS: Record<string, () => Promise<{ meta?: { total?: number } }>> = {
  salons: () => salonService.list({ status: "pending", limit: 1 }),
  bookings: () => bookingService.list({ status: "pending", limit: 1 }),
  reviews: () => reviewService.list({ status: "pending", limit: 1 }),
  payouts: () => payoutService.list({ status: "pending", limit: 1 }),
};

const ProtectedLayout = ({ item , isAdmin}: { item: NavGroup[] , isAdmin?: boolean }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPathname, setOpenPathname] = useState("");
  const mobileOpenDerived = mobileOpen && openPathname === location.pathname;
  const { theme } = useUIStore();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all(
      Object.entries(PENDING_BADGE_KEYS).map(([key, fetcher]) =>
        fetcher()
          .then((res) => [key, res?.meta?.total ?? 0] as const)
          .catch(() => [key, 0] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      setBadgeCounts(Object.fromEntries(results));
    });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const resolvedItem = isAdmin
    ? item.map((group) => ({
        ...group,
        items: group.items.map((navItem) =>
          navItem.key in badgeCounts
            ? { ...navItem, badge: String(badgeCounts[navItem.key]) }
            : navItem
        ),
      }))
    : item;

  return (
    <div
      className={`ha-admin ${theme === "light" ? "light" : ""}`}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div
        className={`ha-overlay ${mobileOpenDerived ? "active" : ""}`}
        onClick={() => { setMobileOpen(false); setOpenPathname(location.pathname); }}
      />

      <Sidebar item={resolvedItem} mobileOpen={mobileOpenDerived} />

      <div className="ha-main min-h-0">
        <Topbar onMenuClick={() => {
          setOpenPathname(location.pathname);
          setMobileOpen((v) => !v);
        }} isAdmin={isAdmin} />
        <main className="ha-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;

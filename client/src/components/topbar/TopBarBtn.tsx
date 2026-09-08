import { ADMIN_TOPBAR_ACTION_EVENT, pageMeta } from "../constant";
import { useUIStore } from "@/store/uiStore";
import { exportPageTables } from "@/utils";
import { useLocation } from "react-router-dom";

export const resolvePageKey = (path: string): string => {
  if (path === "/admin" || path === "/admin/") return "overview";
  if (path.includes("/admin/analytics")) return "analytics";
  if (path.includes("/admin/salons")) return "salons";
  if (path.includes("/admin/owners")) return "owners";
  if (path.includes("/admin/customers")) return "customers";
  if (path.includes("/admin/bookings")) return "bookings";
  if (path.includes("/admin/reviews")) return "reviews";
  if (path.includes("/admin/revenue")) return "revenue";
  if (path.includes("/admin/payouts")) return "payouts";
  if (path.includes("/admin/notifications")) return "notifications";
  if (path.includes("/admin/profile")) return "profile";
  return "settings";
};


const clickFirstButtonMatchingText = (texts: string[]) => {
  const buttons = Array.from(
    document.querySelectorAll(".ha-content button"),
  ) as HTMLButtonElement[];
  const target = buttons.find((button) =>
    texts.some((text) =>
      button.textContent?.toLowerCase().includes(text.toLowerCase()),
    ),
  );

  if (!target) return false;
  target.click();
  return true;
};
// These pages already render their own primary action button in-page
// (Save Profile / Moderate All) — showing it again in the topbar would be
// a confusing duplicate control doing the same thing.
const PAGES_WITHOUT_TOPBAR_ACTION = ["profile", "reviews"];

const TopBarBtn = () => {
  const location = useLocation();
  const key = resolvePageKey(location.pathname);
  const { openSalonModal, openOwnerModal } = useUIStore();
    const meta = pageMeta[key] || pageMeta.overview
  const handleTopbarAction = () => {
    if (key === "overview" || key === "salons") {
      openSalonModal();
      return;
    }

    if (key === "owners") {
      openOwnerModal();
      return;
    }

    if (["analytics", "customers", "bookings", "revenue"].includes(key)) {
      if (exportPageTables(key)) return;
    }

    if (key === "payouts") {
      if (clickFirstButtonMatchingText(["release all"])) return;
    }

    if (key === "settings") {
      if (clickFirstButtonMatchingText(["invite admin", "save"])) return;
    }

    if (key === "notifications") {
      const field = document.querySelector(
        ".ha-content input, .ha-content textarea",
      ) as HTMLInputElement | HTMLTextAreaElement | null;
      if (field) {
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus();
        return;
      }
    }

    window.dispatchEvent(
      new CustomEvent(ADMIN_TOPBAR_ACTION_EVENT, {
        detail: { key },
      }),
    );
  };

  if (PAGES_WITHOUT_TOPBAR_ACTION.includes(key)) return null;

  return (
    <button
      className="ha-topbar-btn primary"
      onClick={handleTopbarAction}
      title={key === "salons" ? "+ Add Salon" : meta.action}
    >
      {meta.action}
    </button>
  );
};

export default TopBarBtn;

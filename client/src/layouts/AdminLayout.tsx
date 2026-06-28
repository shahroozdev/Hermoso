import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import Sidebar2 from "@/components/Sidebar2";
import { NavGroup, navGroups } from "@/components/constant";
import Topbar from "@/components/topbar";

const ProtectedLayout = ({ item , isAdmin}: { item: NavGroup[] , isAdmin?: boolean }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useUIStore();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`ha-admin ${theme === "light" ? "light" : ""}`}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div
        className={`ha-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <Sidebar2 item={item} mobileOpen={mobileOpen} />

      <div className="ha-main min-h-0">
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} isAdmin={isAdmin} />
        <main className="ha-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import Sidebar2 from "@/components/Sidebar2";
import { NavGroup } from "@/components/constant";
import Topbar from "@/components/topbar";

const ProtectedLayout = ({ item , isAdmin}: { item: NavGroup[] , isAdmin?: boolean }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPathname, setOpenPathname] = useState("");
  const mobileOpenDerived = mobileOpen && openPathname === location.pathname;
  const { theme } = useUIStore();

  return (
    <div
      className={`ha-admin ${theme === "light" ? "light" : ""}`}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <div
        className={`ha-overlay ${mobileOpenDerived ? "active" : ""}`}
        onClick={() => { setMobileOpen(false); setOpenPathname(location.pathname); }}
      />

      <Sidebar2 item={item} mobileOpen={mobileOpenDerived} />

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

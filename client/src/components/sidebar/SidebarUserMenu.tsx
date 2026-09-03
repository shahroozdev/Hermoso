import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SidebarUserMenu = () => {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuthStore();

  const profilePath = () => {
    const role = user?.role === "admin" ? "super_admin" : user?.role;
    if (role === "salon_owner") return "/owner/profile";
    if (role === "super_admin") return "/admin/profile";
    return "/customer/profile";
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="ha-sidebar-footer" ref={menuRef}>
      <button
        className="ha-user-trigger"
        onClick={() => setUserMenuOpen((v) => !v)}
        aria-label="Open user menu"
      >
        <div className="ha-admin-av">
          {(user?.name || "W").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="ha-admin-name">{user?.name || "Admin User"}</div>
          <div className="ha-admin-role capitalize">
            {(user?.role || "super_admin").replace(/_/g, " ")}
          </div>
        </div>
        <span className="ha-user-chevron">▾</span>
      </button>

      {userMenuOpen ? (
        <div className="ha-user-menu">
          <button onClick={() => navigate(profilePath())}>Profile</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : null}
    </div>
  );
};

export default SidebarUserMenu;

import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon";
import { NavGroup } from "./constant";
import SidebarUserMenu from "./SidebarUserMenu";

const Sidebar2 = ({
  item,
  mobileOpen,
}: {
  item: NavGroup[];
  mobileOpen: boolean;
}) => {
  const location = useLocation();

  return (
    <aside className={`ha-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="ha-sidebar-brand">
        <svg
          width="28"
          height="28"
          viewBox="0 0 68 68"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="hsg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f0c96a" />
              <stop offset="100%" stopColor="#a07820" />
            </radialGradient>
          </defs>
          <ellipse
            cx="34"
            cy="18"
            rx="9"
            ry="15"
            fill="url(#hsg)"
            opacity="0.9"
            transform="rotate(0 34 34)"
          />
          <ellipse
            cx="34"
            cy="18"
            rx="9"
            ry="15"
            fill="url(#hsg)"
            opacity="0.8"
            transform="rotate(72 34 34)"
          />
          <ellipse
            cx="34"
            cy="18"
            rx="9"
            ry="15"
            fill="url(#hsg)"
            opacity="0.75"
            transform="rotate(144 34 34)"
          />
          <ellipse
            cx="34"
            cy="18"
            rx="9"
            ry="15"
            fill="url(#hsg)"
            opacity="0.8"
            transform="rotate(216 34 34)"
          />
          <ellipse
            cx="34"
            cy="18"
            rx="9"
            ry="15"
            fill="url(#hsg)"
            opacity="0.85"
            transform="rotate(288 34 34)"
          />
          <circle cx="34" cy="34" r="7" fill="#fdf3dc" />
          <circle cx="34" cy="34" r="4" fill="#f0c96a" />
        </svg>
        <div className="ha-brand-text">
          <div className="ha-brand-name">Hermoso</div>
          <div className="ha-brand-tag">Super Admin</div>
        </div>
      </div>
      <div className="ha-sidebar-menu" >
        {item?.map((group) => (
          <div key={group.label + group.items[0].key}>
            <div className="ha-sidebar-section-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={() =>
                  `ha-nav-item ${item?.to === location?.pathname ? "active" : ""}`
                }
              >
                <Icon
                  className="ha-nav-icon"
                  name={item.icon}
                  size={"20"}
                  stroke="currentColor"
                />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className={`ha-nav-badge ${item.badgeType || ""}`}>
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <SidebarUserMenu />
    </aside>
  );
};

export default Sidebar2;

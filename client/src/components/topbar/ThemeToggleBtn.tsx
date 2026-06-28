import { useUIStore } from "@/store/uiStore";
import { useEffect } from "react";

const ThemeToggleBtn = () => {
  const { theme, toggleTheme } = useUIStore();
  useEffect(() => {
        localStorage.setItem("ha_theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);
    return (
        <button
      className="ha-theme-btn"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
};

export default ThemeToggleBtn;

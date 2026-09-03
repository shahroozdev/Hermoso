import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const MENU_HEIGHT_ESTIMATE = 44;
const MENU_WIDTH = 176;
const VIEWPORT_MARGIN = 8;

const ActionsMenu = ({ items }: { items: ActionMenuItem[] }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const estimatedMenuHeight = items.length * MENU_HEIGHT_ESTIMATE;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;
      const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN;
      const left = Math.min(Math.max(rect.right - MENU_WIDTH, VIEWPORT_MARGIN), Math.max(maxLeft, VIEWPORT_MARGIN));

      setPosition({
        top: openUpward ? rect.top : rect.bottom,
        left,
        openUpward,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, items.length]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="ha-act-btn"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
            style={{
              top: position.openUpward ? undefined : position.top + 4,
              bottom: position.openUpward ? window.innerHeight - position.top + 4 : undefined,
              left: position.left,
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-soft)] ${item.danger ? "text-rose-500" : "text-[var(--text)]"}`}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default ActionsMenu;

import { useEffect, useRef, useState } from "react";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const ActionsMenu = ({ items }: { items: ActionMenuItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="ha-act-btn"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
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
        </div>
      )}
    </div>
  );
};

export default ActionsMenu;

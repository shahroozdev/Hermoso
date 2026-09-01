import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  loading,
  disabled,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        top: openUpward ? undefined : rect.bottom + 4,
        bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
      setSearch("");
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        className={`ha-input min-h-[46px] cursor-pointer flex items-center gap-2 px-3 py-2 ${disabled ? "opacity-60" : ""} ${className || ""}`}
        onClick={handleToggle}
      >
        <span className={`flex-1 truncate text-sm ${selectedOption ? "" : "text-gray-400"}`}>
          {loading ? "Loading..." : selectedOption?.label || placeholder || "Select"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {open &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] shadow-lg"
          >
            <input
              ref={searchInputRef}
              type="text"
              className="ha-input w-full !rounded-none !border-0 !border-b !border-[var(--border)]"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div
              className="max-h-60 overflow-auto
                       [&::-webkit-scrollbar]:w-1.5
                       [&::-webkit-scrollbar-track]:bg-transparent
                       [&::-webkit-scrollbar-thumb]:bg-gray-400
                       [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[var(--accent-2)] ${
                      option.value === value ? "bg-[var(--accent-2)]" : ""
                    }`}
                  >
                    <span>{option.label}</span>
                    {option.value === value && <span className="text-xs font-semibold">✓</span>}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SearchableSelect;

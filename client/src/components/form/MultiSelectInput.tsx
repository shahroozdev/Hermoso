// MultiSelectInput.tsx
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options?: Option[];
  placeholder?: string;
  className?: string;
}

export const MultiSelectInput = ({
  value,
  onChange,
  options,
  placeholder,
  className,
}: MultiSelectInputProps) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedValues = value || [];

//   // Position calculation
//   useEffect(() => {
//     if (open && triggerRef.current) {
//       const rect = triggerRef.current.getBoundingClientRect();
//       const dropdownHeight = 240;
//       const spaceBelow = window.innerHeight - rect.bottom;
//       const spaceAbove = rect.top;
//       const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

//       setDropdownStyle({
//         position: "fixed",
//         top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
//         left: rect.left,
//         width: rect.width,
//         zIndex: 9999,
//       });
//     }
//   }, [open]);

  // Outside click
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

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string) => {
    onChange(selectedValues.filter((v) => v !== val));
  };
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen((prev) => !prev);
  };
  return (
    <div className="relative">
      {/* TRIGGER */}
      <div
        ref={triggerRef}
        className={`ha-input min-h-[46px] cursor-pointer flex items-start gap-2 px-3 py-2 ${className}`}
        onClick={handleToggle}
      >
        {selectedValues.length > 0 ? (
          // Chip list is capped and scrolls internally so a large selection can never
          // grow the trigger (and therefore the surrounding modal layout) unbounded — BUG-142.
          <div className="flex max-h-24 flex-1 flex-wrap gap-2 overflow-y-auto
                         [&::-webkit-scrollbar]:w-1.5
                         [&::-webkit-scrollbar-track]:bg-transparent
                         [&::-webkit-scrollbar-thumb]:bg-gray-400
                         [&::-webkit-scrollbar-thumb]:rounded-full">
            {selectedValues.length > 4 ? (
              <div className="flex items-center gap-1 rounded-lg bg-[var(--accent-2)] px-2 py-1 text-sm">
                <span>{selectedValues.length} selected</span>
              </div>
            ) : (
              selectedValues.map((val) => {
                const option = options?.find((o) => o.value === val);
                return (
                  <div
                    key={val}
                    className="flex items-center gap-1 rounded-lg bg-[var(--accent-2)] px-2 py-1 text-sm"
                  >
                    <span>{option?.label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeValue(val);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <span className="flex-1 self-center text-sm text-gray-400">
            {placeholder || "Select options"}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto mt-1 shrink-0"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {/* PORTAL DROPDOWN */}
      {open &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="max-h-60 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] shadow-lg
                     [&::-webkit-scrollbar]:w-1.5
                     [&::-webkit-scrollbar-track]:bg-transparent
                     [&::-webkit-scrollbar-thumb]:bg-gray-400
                     [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {options?.map((option) => {
              const selected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--accent-2)] ${
                    selected ? "bg-[var(--accent-2)]" : ""
                  }`}
                >
                  {/* BUG-143: explicit checkbox so selection state is visible while the dropdown is open */}
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    className="pointer-events-none h-4 w-4 shrink-0 accent-[var(--accent-2)]"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <span className="flex-1">{option.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

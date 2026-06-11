"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

/**
 * Accessible dropdown menu.
 * items: [{ label, onClick, icon, danger, disabled }]
 */
export default function Dropdown({ trigger, items = [], align = "right", buttonClassName }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) itemsRef.current[active]?.focus();
  }, [active, open]);

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      setActive(0);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-2 text-sm text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
          buttonClassName
        )}
      >
        {trigger}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-44 overflow-hidden rounded-card border border-line bg-white py-1 shadow-lg animate-[fadeIn_0.15s_ease]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              ref={(el) => (itemsRef.current[i] = el)}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
                setActive(-1);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors focus:outline-none disabled:opacity-50",
                item.danger
                  ? "text-crimson hover:bg-danger-bg focus:bg-danger-bg"
                  : "text-gray-700 hover:bg-sand focus:bg-sand"
              )}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

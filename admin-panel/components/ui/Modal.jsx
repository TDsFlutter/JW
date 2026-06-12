"use client";
import { useEffect, useRef } from "react";
import { cn } from "./cn";

/**
 * Accessible modal / drawer.
 * - side="right" (default): slide-in drawer; side="center": centered modal.
 * - Closes on ESC + backdrop click, locks body scroll, moves focus in, restores on close.
 */
export default function Modal({
  open,
  onClose,
  title,
  side = "right",
  size = "md",
  footer,
  children,
}) {
  const panelRef = useRef(null);
  const lastFocused = useRef(null);
  const titleId = useRef(`modal-${Math.random().toString(36).slice(2)}`).current;

  // Keep latest onClose without making it an effect dependency — callers pass an
  // inline arrow, so a new identity each render would otherwise re-run the focus
  // effect on every keystroke and steal focus back to the panel.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // focus the panel
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open]);

  if (!open) return null;

  const sideClasses =
    side === "center"
      ? "items-center justify-center p-4"
      : "items-stretch justify-end";

  const sizeClasses =
    side === "center"
      ? { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }
      : { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  const panelShape =
    side === "center"
      ? "rounded-card animate-[fadeIn_0.2s_ease]"
      : "h-full animate-[slideIn_0.3s_ease-out]";

  return (
    <div
      className={cn("fixed inset-0 z-[1000] flex bg-black/40", sideClasses)}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "flex w-full flex-col bg-white shadow-2xl outline-none",
          sizeClasses[size] || sizeClasses.md,
          panelShape
        )}
      >
        {title && (
          <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
            <h3 id={titleId} className="font-serif text-xl text-ink">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="grid size-8 place-items-center rounded-full text-gray-400 transition-colors hover:bg-sand hover:text-ink focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-line px-6 py-4">{footer}</footer>
        )}
      </div>
    </div>
  );
}

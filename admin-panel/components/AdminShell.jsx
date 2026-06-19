"use client";
import { useEffect, useState } from "react";
import { cn } from "./ui/cn";

function SidebarNav({ navItems, activeTab, onTabChange, exitHref, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 border-b border-ink-soft pb-5 text-center">
        <h1 className="text-lg font-medium tracking-[2px] text-white" style={{ fontFamily: "var(--font-cinzel), serif" }}>ORNIVAJEWELS</h1>
        <div className="mt-1 text-[0.7rem] uppercase tracking-[1.5px] text-gold">
          Admin Panel
        </div>
      </div>

      <nav className="flex-1" aria-label="Admin sections">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    onTabChange(item.key);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded px-4 py-3 text-left text-[0.8rem] font-medium uppercase tracking-wide transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                    isActive
                      ? "bg-gold text-white"
                      : "text-gray-300 hover:bg-ink-soft hover:text-gold"
                  )}
                >
                  <span aria-hidden="true" className="text-gold/90">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.count != null && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[0.65rem]",
                      isActive ? "bg-white/20 text-white" : "bg-ink-soft text-gray-300"
                    )}>
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {exitHref && (
        <a
          href={exitHref}
          className="mt-4 flex items-center justify-center gap-2 rounded border border-ink-soft px-4 py-3 text-[0.8rem] font-medium uppercase tracking-wide text-gray-300 transition-colors hover:bg-ink-soft hover:text-gold"
        >
          ← Exit Admin
        </a>
      )}
    </div>
  );
}

export default function AdminShell({
  navItems = [],
  activeTab,
  onTabChange,
  title,
  description,
  actions,
  exitHref,
  children,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-64 shrink-0 bg-ink p-6 lg:block">
        <SidebarNav
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          exitHref={exitHref}
        />
      </aside>

      {/* ── Mobile drawer + backdrop ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] bg-ink p-6 transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
        aria-hidden={!open}
      >
        <SidebarNav
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          exitHref={exitHref}
          onNavigate={() => setOpen(false)}
        />
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-10 place-items-center rounded text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-medium tracking-[1px] text-ink" style={{ fontFamily: "var(--font-cinzel), serif" }}>ORNIVAJEWELS</span>
          <span className="text-[0.7rem] uppercase tracking-wide text-gold">Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Panel header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <div className="min-w-0">
              <h2 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

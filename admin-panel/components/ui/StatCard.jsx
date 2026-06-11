import { cn } from "./cn";

export default function StatCard({ label, value, icon, trend, accent = "gold", className }) {
  const accentClasses = {
    gold: "text-gold bg-[#fbf7ea]",
    crimson: "text-crimson bg-danger-bg",
    ink: "text-ink bg-sand",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-card border border-line bg-white p-5 shadow-sm",
        "transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="min-w-0">
        <div className="font-serif text-3xl font-semibold leading-none text-ink">{value}</div>
        <div className="mt-2 text-xs uppercase tracking-wider text-gray-500">{label}</div>
        {trend && (
          <div className="mt-1 text-xs font-medium text-gray-400">{trend}</div>
        )}
      </div>
      {icon && (
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            accentClasses[accent] || accentClasses.gold
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
    </div>
  );
}

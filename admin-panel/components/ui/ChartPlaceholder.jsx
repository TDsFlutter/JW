import { cn } from "./cn";

// Lightweight visual placeholder for a future charting library (no data deps).
export default function ChartPlaceholder({ type = "bar", title, className, height = 200 }) {
  const bars = [55, 80, 42, 95, 68, 73, 50, 88];
  return (
    <div className={cn("w-full", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">{title}</span>
          <span className="rounded-full bg-sand px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-gray-400">
            Preview
          </span>
        </div>
      )}
      <div
        className="relative flex items-end gap-2 rounded-card border border-dashed border-line bg-sand/60 p-4"
        style={{ height }}
        role="img"
        aria-label={title ? `${title} chart placeholder` : "Chart placeholder"}
      >
        {type === "line" ? (
          <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points="0,32 14,24 28,28 42,12 56,18 70,8 84,16 100,6"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points="0,40 0,32 14,24 28,28 42,12 56,18 70,8 84,16 100,6 100,40"
              fill="var(--color-gold)"
              opacity="0.08"
            />
          </svg>
        ) : (
          bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-gold/30 to-gold/70"
              style={{ height: `${h}%` }}
              aria-hidden="true"
            />
          ))
        )}
      </div>
    </div>
  );
}

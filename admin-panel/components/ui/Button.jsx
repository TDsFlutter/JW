import { cn } from "./cn";

const VARIANTS = {
  primary:
    "bg-ink text-white hover:bg-gold focus-visible:ring-gold/50",
  gold:
    "bg-gold text-white hover:bg-crimson focus-visible:ring-gold/50",
  outline:
    "bg-transparent text-ink border border-line hover:border-gold hover:text-gold focus-visible:ring-gold/40",
  ghost:
    "bg-transparent text-gray-600 hover:bg-sand hover:text-ink focus-visible:ring-gold/30",
  danger:
    "bg-transparent text-crimson border border-line hover:bg-danger-bg hover:border-danger focus-visible:ring-danger/40",
  solidDanger:
    "bg-crimson text-white hover:bg-crimson-dark focus-visible:ring-crimson/40",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-semibold uppercase tracking-wide",
        "transition-colors duration-200 outline-none focus-visible:ring-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

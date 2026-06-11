import { cn } from "./cn";

const TONES = {
  success: "bg-ok-bg text-[#3a9410] border-[#b7eb8f]",
  warning: "bg-warn-bg text-[#a87a00] border-[#ffe58f]",
  danger: "bg-danger-bg text-crimson border-[#ffa39e]",
  neutral: "bg-sand text-gray-600 border-line",
  gold: "bg-[#fbf7ea] text-gold border-[#e7d7a3]",
};

export default function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide",
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";

/** Gradient progress bar (0-100). */
export function ProgressBar({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", pct === 100 ? "bg-emerald-500" : "bg-brand-gradient")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

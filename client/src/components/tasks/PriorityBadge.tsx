import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Priority, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<Priority, { label: string; className: string; icon: typeof ArrowUp }> = {
  low: {
    label: "Low",
    icon: ArrowDown,
    className: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  },
  medium: {
    label: "Medium",
    icon: Minus,
    className: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  },
  high: {
    label: "High",
    icon: ArrowUp,
    className: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  },
};

/** Stripe color used on the left edge of task cards. */
export const PRIORITY_STRIPE: Record<Priority, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { label, icon: Icon, className: tone } = PRIORITY_STYLES[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tone,
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.75} />
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-500/12 text-slate-700 dark:text-slate-300" },
  in_progress: { label: "In Progress", className: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  done: { label: "Done", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_STYLES[status];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}>{label}</span>;
}

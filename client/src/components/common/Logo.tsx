import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-primary/30">
        <LayoutGrid className="size-5" strokeWidth={2.4} />
      </div>
      <span className={cn("text-lg font-bold tracking-tight", light ? "text-white" : "text-foreground")}>
        Task<span className={light ? "text-white/80" : "text-primary"}>Flow</span>
      </span>
    </div>
  );
}

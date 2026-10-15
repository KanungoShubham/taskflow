import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + error message, used by every form. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  action,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  /** Optional element shown on the right of the label (e.g. a "Forgot password?" link). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-[13px] font-medium">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

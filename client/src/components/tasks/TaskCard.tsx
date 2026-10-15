import { CalendarDays, Users } from "lucide-react";
import { PriorityBadge, PRIORITY_STRIPE } from "@/components/tasks/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { dueLabel, isOverdue } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Visual card for a task. Used on the board (draggable wrapper adds the drag behavior). */
export function TaskCard({
  task,
  onClick,
  showTeam,
  dragging,
  className,
}: {
  task: Task;
  onClick?: () => void;
  showTeam?: boolean;
  dragging?: boolean;
  className?: string;
}) {
  const overdue = isOverdue(task);
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-3.5 pl-4 text-left shadow-xs transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        dragging && "rotate-2 scale-[1.02] border-primary/40 shadow-xl ring-2 ring-primary/20",
        task.status === "done" && "opacity-75",
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", PRIORITY_STRIPE[task.priority])} />
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm leading-snug font-semibold", task.status === "done" && "line-through decoration-muted-foreground/60")}>
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} className="shrink-0" />
      </div>
      {task.description && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                overdue ? "bg-rose-500/12 text-rose-600 dark:text-rose-300" : "bg-muted"
              )}
            >
              <CalendarDays className="size-3" />
              {overdue ? `Overdue · ${dueLabel(task.dueDate)}` : dueLabel(task.dueDate)}
            </span>
          )}
          {showTeam && task.team && (
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <Users className="size-3 shrink-0" />
              <span className="truncate">{task.team.name}</span>
            </span>
          )}
        </div>
        {task.assignee ? (
          <span title={`Assigned to ${task.assignee.name}`}>
            <UserAvatar name={task.assignee.name} size="sm" />
          </span>
        ) : task.team ? (
          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
        ) : null}
      </div>
    </div>
  );
}

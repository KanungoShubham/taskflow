"use client";

import { CalendarDays, Check, Users } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/tasks/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { dueLabel, isOverdue } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One line in a task list, with a round "complete" toggle on the left. */
export function TaskRow({
  task,
  onOpen,
  onToggleDone,
  toggling,
}: {
  task: Task;
  onOpen: () => void;
  onToggleDone: () => void;
  toggling?: boolean;
}) {
  const done = task.status === "done";
  const overdue = isOverdue(task);

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <button
        onClick={onToggleDone}
        disabled={toggling}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all",
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-emerald-500 hover:bg-emerald-500/10",
          toggling && "animate-pulse"
        )}
      >
        <Check className={cn("size-3", done ? "opacity-100" : "opacity-0 group-hover:opacity-40")} strokeWidth={3.5} />
      </button>

      <button onClick={onOpen} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
        <span className={cn("max-w-full truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.team ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> {task.team.name}
            </span>
          ) : (
            <span>Personal</span>
          )}
          {task.dueDate && (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-600 dark:text-rose-400")}>
              <CalendarDays className="size-3" />
              {overdue ? `Overdue · ${dueLabel(task.dueDate)}` : dueLabel(task.dueDate)}
            </span>
          )}
        </span>
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
      {task.assignee && <UserAvatar name={task.assignee.name} size="sm" className="hidden md:flex" />}
    </div>
  );
}

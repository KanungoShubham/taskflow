"use client";

import { useState } from "react";
import { ClipboardCheck, Plus, SearchX, User as UserIcon, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { TaskRowSkeleton } from "@/components/common/Skeletons";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFilters, type FilterValues } from "@/components/tasks/TaskFilters";
import { TaskRow } from "@/components/tasks/TaskRow";
import { useDebounce } from "@/hooks/useDebounce";
import { useMoveTask, useTasks } from "@/hooks/useTasks";
import type { Task, TaskFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "personal" | "assigned";

const TABS: { value: Tab; label: string; icon: typeof UserIcon }[] = [
  { value: "personal", label: "Personal", icon: UserIcon },
  { value: "assigned", label: "Assigned to me", icon: UserCheck },
];

export default function TasksPage() {
  const [tab, setTab] = useState<Tab>("personal");
  const [filters, setFilters] = useState<FilterValues>({ search: "" });
  const [dialog, setDialog] = useState<{ open: boolean; task?: Task | null }>({ open: false });
  const search = useDebounce(filters.search.trim());

  const query: Filters = {
    ...(tab === "personal" ? { team: "personal" } : { assignee: "me" }),
    status: filters.status,
    priority: filters.priority,
    search: search || undefined,
  };
  const { data: tasks, isPending, isError, error, refetch, isFetching } = useTasks(query);
  const move = useMoveTask();
  const hasFilters = !!(search || filters.status || filters.priority);

  const toggleDone = (task: Task) =>
    move.mutate({ task, status: task.status === "done" ? "todo" : "done", order: 0 });

  const done = tasks?.filter((t) => t.status === "done").length ?? 0;

  return (
    <>
      <PageHeader title="My Tasks" description="Your personal to-dos and everything assigned to you across teams.">
        <Button onClick={() => setDialog({ open: true, task: null })} className="bg-brand-gradient shadow-md shadow-primary/25">
          <Plus /> New task
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit rounded-xl border bg-card p-1 shadow-xs">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                tab === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <TaskFilters value={filters} onChange={setFilters} />
      </div>

      {isPending ? (
        <TaskRowSkeleton />
      ) : isError ? (
        <EmptyState
          icon={SearchX}
          title="Couldn't load tasks"
          description={error.message}
          action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
        />
      ) : tasks.length === 0 ? (
        hasFilters ? (
          <EmptyState icon={SearchX} title="No matching tasks" description="Try a different search or clear the filters." />
        ) : tab === "personal" ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No personal tasks yet"
            description="Capture your first to-do and stay on top of your day."
            action={
              <Button onClick={() => setDialog({ open: true, task: null })}>
                <Plus /> Create a task
              </Button>
            }
          />
        ) : (
          <EmptyState icon={UserCheck} title="Nothing assigned to you" description="When a teammate assigns you a task, it shows up here." />
        )
      ) : (
        <div className={cn("overflow-hidden rounded-2xl border bg-card shadow-xs transition-opacity", isFetching && "opacity-70")}>
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
            <span>
              {tasks.length} task{tasks.length === 1 ? "" : "s"}
            </span>
            <span>
              {done} of {tasks.length} done
            </span>
          </div>
          <div className="divide-y">
            {tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                onOpen={() => setDialog({ open: true, task })}
                onToggleDone={() => toggleDone(task)}
                toggling={move.isPending && move.variables?.task._id === task._id}
              />
            ))}
          </div>
        </div>
      )}

      <TaskDialog open={dialog.open} task={dialog.task} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </>
  );
}

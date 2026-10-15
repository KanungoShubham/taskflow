"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Clock, Plus, Sparkles, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCardsSkeleton, TaskRowSkeleton } from "@/components/common/Skeletons";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskRow } from "@/components/tasks/TaskRow";
import { ProgressBar } from "@/components/teams/ProgressBar";
import { useMe } from "@/hooks/useAuth";
import { useMoveTask, useStats, useTasks } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Not-done tasks first by due date (no due date last), then newest. */
function focusList(tasks: Task[], meId: string) {
  return tasks
    .filter((t) => t.status !== "done" && (t.assignee?._id === meId || !t.team))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return +new Date(a.dueDate) - +new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    })
    .slice(0, 6);
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const stats = useStats();
  const tasks = useTasks({});
  const teams = useTeams();
  const move = useMoveTask();
  const [dialog, setDialog] = useState<{ open: boolean; task?: Task | null }>({ open: false });

  const s = stats.data;
  const completion = s && s.total ? Math.round((s.done / s.total) * 100) : 0;
  const cards = [
    { label: "To Do", value: s?.todo, icon: Circle, tone: "from-slate-500/15 text-slate-600 dark:text-slate-300" },
    { label: "In Progress", value: s?.in_progress, icon: Clock, tone: "from-sky-500/15 text-sky-600 dark:text-sky-300" },
    { label: "Completed", value: s?.done, icon: CheckCircle2, tone: "from-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
    { label: "Overdue", value: s?.overdue, icon: AlertTriangle, tone: "from-rose-500/15 text-rose-600 dark:text-rose-300" },
  ];
  const focus = tasks.data && me ? focusList(tasks.data, me._id) : [];

  return (
    <>
      {/* Hero */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-white/75">{format(new Date(), "EEEE, MMMM d")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {me?.name.split(" ")[0]} <span className="inline-block">👋</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/80">
              {s ? (
                s.overdue > 0 ? (
                  <>You have {s.overdue} overdue task{s.overdue === 1 ? "" : "s"}. Let&apos;s clear them first.</>
                ) : s.total - s.done > 0 ? (
                  <>You have {s.total - s.done} open task{s.total - s.done === 1 ? "" : "s"}. Keep the momentum going!</>
                ) : (
                  <>All clear! Create a task or check in with your teams.</>
                )
              ) : (
                "Loading your day..."
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-3xl font-bold">{completion}%</p>
              <p className="text-xs text-white/75">of your work done</p>
            </div>
            <Button onClick={() => setDialog({ open: true, task: null })} className="bg-white text-primary shadow-lg hover:bg-white/90">
              <Plus /> New task
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.isPending ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent to-60% bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
                tone
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className="size-5 transition-transform group-hover:scale-110" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Focus list */}
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-4.5 text-primary" /> Your focus
            </h2>
            <Link href="/tasks" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all <ArrowRight />
            </Link>
          </div>
          {tasks.isPending ? (
            <TaskRowSkeleton rows={4} />
          ) : focus.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing on your plate"
              description="Open tasks assigned to you and your personal to-dos appear here, soonest due first."
              action={
                <Button onClick={() => setDialog({ open: true, task: null })}>
                  <Plus /> Add a task
                </Button>
              }
            />
          ) : (
            <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
              {focus.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onOpen={() => setDialog({ open: true, task })}
                  onToggleDone={() => move.mutate({ task, status: "done", order: 0 })}
                  toggling={move.isPending && move.variables?.task._id === task._id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Teams overview */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="size-4.5 text-primary" /> Team progress
            </h2>
            <Link href="/teams" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              All teams <ArrowRight />
            </Link>
          </div>
          <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
            {teams.isPending ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : !teams.data?.length ? (
              <div className="py-6 text-center">
                <p className="text-sm font-medium">No teams yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a team to collaborate on a shared board.</p>
                <Link href="/teams" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
                  <Plus /> Create a team
                </Link>
              </div>
            ) : (
              teams.data.map((team) => {
                const { total, done } = team.taskCounts ?? { total: 0, done: 0 };
                const pct = total ? (done / total) * 100 : 0;
                return (
                  <Link key={team._id} href={`/teams/${team._id}`} className="block rounded-xl p-2.5 transition-colors hover:bg-muted/60">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{team.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {done}/{total} · {Math.round(pct)}%
                      </span>
                    </div>
                    <ProgressBar value={pct} size="sm" />
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <TaskDialog open={dialog.open} task={dialog.task} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </>
  );
}

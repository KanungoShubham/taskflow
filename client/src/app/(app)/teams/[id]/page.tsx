"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Crown, MoreHorizontal, Pencil, Plus, SearchX, Trash2, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Board } from "@/components/board/Board";
import { COLUMN_META } from "@/components/board/BoardColumn";
import { BoardSkeleton } from "@/components/common/Skeletons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { UserAvatar } from "@/components/common/UserAvatar";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFilters, type FilterValues } from "@/components/tasks/TaskFilters";
import { MembersPanel } from "@/components/teams/MembersPanel";
import { ProgressBar } from "@/components/teams/ProgressBar";
import { TeamDialog } from "@/components/teams/TeamDialog";
import { useMe } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { taskKeys, useTasks } from "@/hooks/useTasks";
import { useDeleteTeam, useTeam, useTeamProgress } from "@/hooks/useTeams";
import { ApiClientError } from "@/lib/api";
import { STATUSES, type Status, type Task, type TaskFilters as Filters } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TeamBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const team = useTeam(id);
  const progress = useTeamProgress(id);
  const deleteTeam = useDeleteTeam();

  const [filters, setFilters] = useState<FilterValues>({ search: "" });
  const search = useDebounce(filters.search.trim());
  const query: Filters = { team: id, priority: filters.priority, assignee: filters.assignee, search: search || undefined };
  const tasks = useTasks(query, { enabled: team.isSuccess });

  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: Task | null; status?: Status }>({ open: false });
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (team.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 rounded-2xl" />
        <BoardSkeleton />
      </div>
    );
  }

  if (team.isError) {
    const notFound = team.error instanceof ApiClientError && team.error.status === 404;
    return (
      <EmptyState
        icon={SearchX}
        title={notFound ? "Team not found" : "Couldn't load this team"}
        description={notFound ? "It may have been deleted, or you are no longer a member." : team.error.message}
        action={
          <Link href="/teams" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft /> Back to teams
          </Link>
        }
      />
    );
  }

  const t = team.data;
  const isOwner = t.owner._id === me?._id;
  const p = progress.data;
  const hasFilters = !!(search || filters.priority || filters.assignee);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/teams" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> All teams
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-md shadow-primary/25">
              {t.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{t.name}</h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Crown className="size-3.5 text-amber-500" /> Owned by {isOwner ? "you" : t.owner.name}
              </p>
            </div>
          </div>
          {t.description && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setMembersOpen(true)}
            className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            <div className="flex -space-x-2">
              {t.members.slice(0, 4).map((m) => (
                <UserAvatar key={m._id} name={m.name} size="sm" />
              ))}
            </div>
            <Users className="size-4 text-muted-foreground" />
            {t.members.length}
          </button>
          <Button onClick={() => setTaskDialog({ open: true, task: null, status: "todo" })} className="bg-brand-gradient shadow-md shadow-primary/25">
            <Plus /> Add task
          </Button>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="grid size-8 place-items-center rounded-lg border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
                aria-label="Team settings"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil /> Edit team
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 /> Delete team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Progress */}
      <section className="mb-6 grid gap-4 rounded-2xl border bg-card p-5 shadow-xs md:grid-cols-[1fr_auto] md:items-center">
        {progress.isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : p ? (
          <>
            <div>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team progress</p>
                  <p className="text-2xl font-bold">
                    {p.percent}% <span className="text-sm font-medium text-muted-foreground">complete</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.byStatus.done} of {p.total} tasks done
                </p>
              </div>
              <ProgressBar value={p.percent} size="lg" />
            </div>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <div key={s.value} className="min-w-24 rounded-xl bg-muted/50 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className={cn("size-2 rounded-full", COLUMN_META[s.value].dot)} />
                    {s.label}
                  </p>
                  <p className="text-lg font-bold">{p.byStatus[s.value]}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* Filters + board */}
      <div className="mb-4">
        <TaskFilters value={filters} onChange={setFilters} members={t.members} hideStatus />
      </div>

      {tasks.isPending ? (
        <BoardSkeleton />
      ) : tasks.isError ? (
        <EmptyState icon={SearchX} title="Couldn't load tasks" description={tasks.error.message} />
      ) : (
        <>
          {hasFilters && tasks.data.length === 0 && (
            <p className="mb-3 text-sm text-muted-foreground">No tasks match these filters.</p>
          )}
          <Board
            tasks={tasks.data}
            listKey={taskKeys.list(query)}
            onOpen={(task) => setTaskDialog({ open: true, task })}
            onAdd={(status) => setTaskDialog({ open: true, task: null, status })}
          />
        </>
      )}

      {/* Dialogs */}
      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((d) => ({ ...d, open }))}
        task={taskDialog.task}
        teamId={t._id}
        members={t.members}
        teamOwnerId={t.owner._id}
        defaultStatus={taskDialog.status}
      />

      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Members</SheetTitle>
            <SheetDescription>
              {t.members.length} member{t.members.length === 1 ? "" : "s"} · progress on assigned tasks
            </SheetDescription>
          </SheetHeader>
          <MembersPanel team={t} progress={p} meId={me?._id} />
        </SheetContent>
      </Sheet>

      <TeamDialog open={editOpen} onOpenChange={setEditOpen} team={t} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${t.name}"?`}
        description="The team and all of its tasks will be permanently deleted. This cannot be undone."
        confirmLabel="Delete team"
        pending={deleteTeam.isPending}
        onConfirm={() => deleteTeam.mutate(t._id, { onSuccess: () => setConfirmDelete(false) })}
      />
    </>
  );
}

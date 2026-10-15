"use client";

import { useState } from "react";
import { Plus, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { TeamCard } from "@/components/teams/TeamCard";
import { TeamDialog } from "@/components/teams/TeamDialog";
import { useMe } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";

export default function TeamsPage() {
  const { data: me } = useMe();
  const { data: teams, isPending, isError, error, refetch } = useTeams();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title="Teams" description="Collaborate on shared boards, assign work and track progress together.">
        <Button onClick={() => setOpen(true)} className="bg-brand-gradient shadow-md shadow-primary/25">
          <Plus /> New team
        </Button>
      </PageHeader>

      {isPending ? (
        <CardGridSkeleton />
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load teams"
          description={error.message}
          action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
        />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first team, invite teammates by email, and plan work together on a Kanban board."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus /> Create a team
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} meId={me?._id} />
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary"
          >
            <span className="grid size-10 place-items-center rounded-full bg-muted">
              <Plus className="size-5" />
            </span>
            Create another team
          </button>
        </div>
      )}

      <TeamDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

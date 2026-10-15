"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/Field";
import { useCreateTeam, useUpdateTeam } from "@/hooks/useTeams";
import { handleFormError } from "@/lib/form";
import { teamSchema, type TeamValues } from "@/lib/schemas";
import type { Team } from "@/lib/types";

/** Create a team (no `team` prop) or edit an existing one. */
export function TeamDialog({ open, onOpenChange, team }: { open: boolean; onOpenChange: (open: boolean) => void; team?: Team }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <TeamForm team={team} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TeamForm({ team, onDone }: { team?: Team; onDone: () => void }) {
  const router = useRouter();
  const create = useCreateTeam();
  const update = useUpdateTeam(team?._id ?? "");
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: team?.name ?? "", description: team?.description ?? "" },
  });

  const onError = (err: unknown) => handleFormError(err, setError, ["name", "description"]);
  const onSubmit = (values: TeamValues) => {
    if (team) return update.mutate(values, { onSuccess: onDone, onError });
    create.mutate(values, {
      onSuccess: (created) => {
        onDone();
        router.push(`/teams/${created._id}`);
      },
      onError,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">{team ? "Edit team" : "Create a team"}</DialogTitle>
        <DialogDescription>
          {team ? "Update your team's name and description." : "You'll be the owner and can invite members by email."}
        </DialogDescription>
      </DialogHeader>
      <form id="team-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label="Team name" htmlFor="team-name" error={errors.name?.message}>
          <Input id="team-name" autoFocus placeholder="e.g. Product Squad" className="h-9" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Description" htmlFor="team-description" error={errors.description?.message}>
          <Textarea
            id="team-description"
            rows={3}
            placeholder="What is this team working on? (optional)"
            className="resize-none"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
        </Field>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" form="team-form" disabled={pending} className="min-w-28">
          {pending && <Loader2 className="animate-spin" />}
          {team ? "Save" : "Create team"}
        </Button>
      </DialogFooter>
    </>
  );
}

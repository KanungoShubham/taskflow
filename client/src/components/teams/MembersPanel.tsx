"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crown, Loader2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ProgressBar } from "@/components/teams/ProgressBar";
import { useAddMember, useRemoveMember } from "@/hooks/useTeams";
import { handleFormError } from "@/lib/form";
import { memberSchema, type MemberValues } from "@/lib/schemas";
import type { Team, TeamProgress, User } from "@/lib/types";

/** Member list with per-member progress. The owner can add (by email) and remove members. */
export function MembersPanel({ team, progress, meId }: { team: Team; progress?: TeamProgress; meId?: string }) {
  const isOwner = team.owner._id === meId;
  const add = useAddMember(team._id);
  const remove = useRemoveMember(team._id);
  const [toRemove, setToRemove] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MemberValues>({ resolver: zodResolver(memberSchema), defaultValues: { email: "" } });

  const onAdd = ({ email }: MemberValues) =>
    add.mutate(email, { onSuccess: () => reset(), onError: (err) => handleFormError(err, setError, ["email"]) });

  const statsFor = (id: string) => progress?.members.find((m) => m.user._id === id);

  return (
    <div className="flex h-full flex-col">
      {isOwner && (
        <form onSubmit={handleSubmit(onAdd)} noValidate className="border-b p-4">
          <label htmlFor="member-email" className="mb-1.5 block text-[13px] font-medium">
            Invite by email
          </label>
          <div className="flex gap-2">
            <Input
              id="member-email"
              type="email"
              placeholder="teammate@example.com"
              className="h-9"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <Button type="submit" disabled={add.isPending} className="h-9">
              {add.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Add
            </Button>
          </div>
          {errors.email ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
              {errors.email.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">They need a TaskFlow account first.</p>
          )}
        </form>
      )}

      <ul className="flex-1 divide-y overflow-y-auto scrollbar-thin">
        {team.members.map((m) => {
          const stats = statsFor(m._id);
          const memberIsOwner = m._id === team.owner._id;
          const pct = stats && stats.assigned ? (stats.done / stats.assigned) * 100 : 0;
          return (
            <li key={m._id} className="group flex items-center gap-3 px-4 py-3">
              <UserAvatar name={m.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {m._id === meId && <span className="font-normal text-muted-foreground"> (you)</span>}
                  </p>
                  {memberIsOwner && <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Owner" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={pct} size="sm" className="max-w-32" />
                  <span className="text-[11px] text-muted-foreground">
                    {stats?.done ?? 0}/{stats?.assigned ?? 0} done
                  </span>
                </div>
              </div>
              {isOwner && !memberIsOwner && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setToRemove(m)}
                  aria-label={`Remove ${m.name}`}
                  className="text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-destructive"
                >
                  <UserMinus />
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={`Remove ${toRemove?.name}?`}
        description="They will lose access to this team's board. Tasks assigned to them become unassigned."
        confirmLabel="Remove"
        pending={remove.isPending}
        onConfirm={() => toRemove && remove.mutate(toRemove._id, { onSuccess: () => setToRemove(null) })}
      />
    </div>
  );
}

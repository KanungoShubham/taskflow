"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Team, TeamProgress } from "@/lib/types";
import type { TeamValues } from "@/lib/schemas";

export const teamKeys = {
  all: ["teams"] as const,
  detail: (id: string) => ["teams", id] as const,
  progress: (id: string) => ["teams", id, "progress"] as const,
};

export function useTeams() {
  return useQuery({ queryKey: teamKeys.all, queryFn: () => api<Team[]>("/teams") });
}

export function useTeam(id: string) {
  return useQuery({ queryKey: teamKeys.detail(id), queryFn: () => api<Team>(`/teams/${id}`) });
}

export function useTeamProgress(id: string) {
  return useQuery({ queryKey: teamKeys.progress(id), queryFn: () => api<TeamProgress>(`/teams/${id}/progress`) });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: TeamValues) => api<Team>("/teams", { method: "POST", body: values }),
    onSuccess: (team) => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
      toast.success(`Team "${team.name}" created`);
    },
  });
}

export function useUpdateTeam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<TeamValues>) => api<Team>(`/teams/${id}`, { method: "PATCH", body: values }),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(id), team);
      qc.invalidateQueries({ queryKey: teamKeys.all });
      toast.success("Team updated");
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => api(`/teams/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: teamKeys.detail(id) });
      qc.invalidateQueries({ queryKey: teamKeys.all });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Team deleted");
      router.replace("/teams");
    },
  });
}

/** Refreshes everything that depends on team membership. */
function invalidateTeam(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: teamKeys.all });
  qc.invalidateQueries({ queryKey: ["tasks"] });
}

export function useAddMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api<Team>(`/teams/${id}/members`, { method: "POST", body: { email } }),
    onSuccess: (team, email) => {
      qc.setQueryData(teamKeys.detail(id), team);
      invalidateTeam(qc);
      toast.success(`${email} added to the team`);
    },
  });
}

export function useRemoveMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api<Team>(`/teams/${id}/members/${userId}`, { method: "DELETE" }),
    onSuccess: (team) => {
      qc.setQueryData(teamKeys.detail(id), team);
      invalidateTeam(qc);
      toast.success("Member removed");
    },
  });
}

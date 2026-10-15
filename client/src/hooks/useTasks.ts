"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage, toQuery } from "@/lib/api";
import type { Stats, Status, Task, TaskFilters } from "@/lib/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => ["tasks", filters] as const,
};

/** Body accepted by POST /api/tasks and PATCH /api/tasks/:id. */
export interface TaskInput {
  title?: string;
  description?: string;
  priority?: Task["priority"];
  status?: Status;
  dueDate?: string | null;
  team?: string | null;
  assignee?: string | null;
}

/** Everything that shows task numbers: lists, dashboard stats, team cards and progress. */
function refreshTaskViews(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: taskKeys.all });
  qc.invalidateQueries({ queryKey: ["stats"] });
  qc.invalidateQueries({ queryKey: ["teams"] });
}

export function useTasks(filters: TaskFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => api<Task[]>(`/tasks${toQuery({ ...filters })}`),
    enabled: options.enabled ?? true,
    // While a new search/filter loads, keep showing the old results, but only for the same
    // list (same team / personal view), never another team's cards.
    placeholderData: (prev, prevQuery) =>
      (prevQuery?.queryKey[1] as TaskFilters | undefined)?.team === filters.team &&
      (prevQuery?.queryKey[1] as TaskFilters | undefined)?.assignee === filters.assignee
        ? prev
        : undefined,
  });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/users/me/stats") });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => api<Task>("/tasks", { method: "POST", body: input }),
    onSuccess: (task) => {
      refreshTaskViews(qc);
      toast.success(`Task "${task.title}" created`);
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) =>
      api<Task>(`/tasks/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      refreshTaskViews(qc);
      toast.success("Task updated");
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refreshTaskViews(qc);
      toast.success("Task deleted");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

interface MoveVars {
  task: Task;
  status: Status;
  order: number;
  /**
   * Set by the board, which has already written its new card order into the list cache.
   * On failure we restore `prev` so the card snaps back.
   */
  rollback?: { listKey: readonly unknown[]; prev: Task[] | undefined };
}

const STATUS_TEXT: Record<Status, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };

/**
 * Moves a task to another column/position (board drag & drop, quick complete).
 * Updates the UI immediately, rolls back with an error toast if the API call fails.
 */
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ task, status, order }: MoveVars) =>
      api<Task>(`/tasks/${task._id}/move`, { method: "PATCH", body: { status, order } }),
    // Stop in-flight refetches from overwriting the optimistic board order.
    onMutate: async ({ rollback }) => {
      if (rollback) await qc.cancelQueries({ queryKey: rollback.listKey });
    },
    onError: (err, { rollback }) => {
      if (rollback) qc.setQueryData(rollback.listKey, rollback.prev);
      toast.error(`Couldn't move the task: ${errorMessage(err)}`);
    },
    onSuccess: (task, { task: before }) => {
      if (task.status !== before.status) {
        toast.success(task.status === "done" ? `"${task.title}" completed 🎉` : `Moved to ${STATUS_TEXT[task.status]}`);
      }
    },
    onSettled: () => refreshTaskViews(qc),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

const key = ["notifications"] as const;
type NotificationsData = { items: AppNotification[]; unreadCount: number };

/**
 * Polls every 15s (also while the tab is in the background, and on window focus) so new
 * notifications and their sound/system alerts show up without a reload.
 */
export function useNotifications() {
  return useQuery({
    queryKey: key,
    queryFn: () => api<NotificationsData>("/notifications"),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

/** Optimistically marks one notification as read. */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationsData>(key);
      if (prev) {
        const target = prev.items.find((n) => n._id === id);
        qc.setQueryData<NotificationsData>(key, {
          items: prev.items.map((n) => (n._id === id ? { ...n, read: true } : n)),
          unreadCount: target && !target.read ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        });
      }
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ updated: number }>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

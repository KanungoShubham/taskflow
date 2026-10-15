"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useStats } from "@/hooks/useTasks";
import { playChime, registerServiceWorker, showSystemNotification, unlockAudio } from "@/lib/alerts";

const PENDING_ALERT_KEY = "taskflow.pendingAlertShown";

/** True when the user is looking at this tab right now. */
const userIsLooking = () => document.visibilityState === "visible" && document.hasFocus();

/**
 * Turns new notifications into alerts while the app is open:
 * ding sound + toast when you're looking at the tab, ding + system notification when you're not.
 * Also shows one "you have N pending tasks" alert per browser session, and the unread
 * count in the tab title.
 */
export function useNotificationAlerts() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useNotifications();
  const { data: stats } = useStats();
  const seen = useRef<Set<string> | null>(null);
  const pendingChecked = useRef(false);

  // Service worker for mobile notifications + unlock sound on the first tap/click/key.
  useEffect(() => {
    registerServiceWorker();
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // New notifications -> alert. The first load only records what already exists.
  useEffect(() => {
    if (!data) return;
    if (!seen.current) {
      seen.current = new Set(data.items.map((n) => n._id));
      return;
    }
    const known = seen.current;
    const fresh = data.items.filter((n) => !n.read && !known.has(n._id));
    data.items.forEach((n) => known.add(n._id));
    if (fresh.length === 0) return;

    playChime();
    for (const n of fresh.slice(0, 3)) {
      const url = n.team ? `/teams/${n.team}` : "/tasks";
      if (userIsLooking()) {
        toast(n.message, { action: { label: "Open", onClick: () => router.push(url) } });
      } else {
        showSystemNotification({ title: "TaskFlow", body: n.message, tag: n._id, url });
      }
    }
  }, [data, router]);

  // "You have pending tasks" once per browser session.
  useEffect(() => {
    if (!stats || pendingChecked.current) return;
    pendingChecked.current = true;
    try {
      if (sessionStorage.getItem(PENDING_ALERT_KEY)) return;
      sessionStorage.setItem(PENDING_ALERT_KEY, "1");
    } catch {
      // storage blocked: show it anyway
    }
    const pending = stats.todo + stats.in_progress;
    if (pending === 0) return;

    const message =
      `You have ${pending} pending task${pending === 1 ? "" : "s"}` + (stats.overdue ? ` · ${stats.overdue} overdue` : "");
    playChime();
    toast.warning(message, { action: { label: "View", onClick: () => router.push("/tasks") }, duration: 8000 });
    if (!userIsLooking()) showSystemNotification({ title: "TaskFlow reminder", body: message, tag: "pending", url: "/tasks" });
  }, [stats, router]);

  // Unread count in the tab title, e.g. "(2) TaskFlow · Team Task Manager".
  useEffect(() => {
    const unread = data?.unreadCount ?? 0;
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${base}` : base;
  }, [data?.unreadCount, pathname]);
}

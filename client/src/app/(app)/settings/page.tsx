"use client";

import { useState } from "react";
import { BellRing, BellOff, CheckCircle2, Smartphone, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useMe } from "@/hooks/useAuth";
import {
  getPermission,
  playChime,
  requestPermission,
  setSoundEnabled,
  showSystemNotification,
  soundEnabled,
  unlockAudio,
  type AlertPermission,
} from "@/lib/alerts";
import { cn } from "@/lib/utils";

const STATUS: Record<AlertPermission, { label: string; tone: string }> = {
  granted: { label: "On", tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  default: { label: "Not enabled", tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  denied: { label: "Blocked", tone: "bg-rose-500/12 text-rose-700 dark:text-rose-300" },
  unsupported: { label: "Not available", tone: "bg-muted text-muted-foreground" },
};

export default function SettingsPage() {
  const { data: me } = useMe();

  return (
    <>
      <PageHeader title="Settings" description="Your profile and how TaskFlow alerts you." />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="h-fit rounded-2xl border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-muted-foreground">Profile</h2>
          {me && (
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar name={me.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{me.name}</p>
                <p className="truncate text-sm text-muted-foreground">{me.email}</p>
              </div>
            </div>
          )}
        </section>
        <AlertsCard />
      </div>
    </>
  );
}

function AlertsCard() {
  const [permission, setPermission] = useState<AlertPermission>(getPermission);
  const [sound, setSound] = useState(soundEnabled);
  const status = STATUS[permission];

  const enable = async () => {
    unlockAudio();
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") {
      playChime(true);
      showSystemNotification({ title: "TaskFlow", body: "Alerts are on. You'll hear a ding when something needs you.", tag: "enabled" });
      toast.success("Browser alerts enabled");
    } else if (result === "denied") {
      toast.error("Notifications are blocked. Allow them in your browser's site settings.");
    }
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playChime(true);
  };

  const test = async () => {
    unlockAudio();
    playChime(true);
    const shown = await showSystemNotification({
      title: "TaskFlow test alert",
      body: "This is how new assignments and reminders will appear.",
      tag: "test",
      url: "/dashboard",
    });
    toast.success(shown ? "Test alert sent" : "Played the sound (system notifications are off)");
  };

  return (
    <section className="rounded-2xl border bg-card shadow-xs xl:col-span-2">
      <header className="flex items-start justify-between gap-4 border-b p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/25">
            <BellRing className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Browser alerts</h2>
            <p className="text-sm text-muted-foreground">A sound and a pop-up when you&apos;re assigned a task, added to a team, or a task you created is done.</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", status.tone)}>{status.label}</span>
      </header>

      <div className="space-y-4 p-6">
        {/* System notifications */}
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Pop-up notifications</p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted"
                ? "Shown on your screen even when TaskFlow is in another tab."
                : permission === "denied"
                  ? "Blocked. Click the lock icon next to the address bar → Notifications → Allow, then reload."
                  : permission === "unsupported"
                    ? "This browser or connection doesn't support them (they need https:// or localhost)."
                    : "Your browser will ask for permission."}
            </p>
          </div>
          {permission === "granted" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> Enabled
            </span>
          ) : (
            <Button onClick={enable} disabled={permission === "denied" || permission === "unsupported"}>
              {permission === "denied" ? <BellOff /> : <BellRing />} Enable alerts
            </Button>
          )}
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            {sound ? <Volume2 className="size-5 text-primary" /> : <VolumeX className="size-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">Alert sound</p>
              <p className="text-xs text-muted-foreground">A short &ldquo;ding&rdquo; for new notifications and pending-task reminders.</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={sound}
            aria-label="Alert sound"
            onClick={toggleSound}
            className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", sound ? "bg-primary" : "bg-muted-foreground/30")}
          >
            <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", sound && "translate-x-5")} />
          </button>
        </div>

        <Button variant="outline" onClick={test}>
          <BellRing /> Send a test alert
        </Button>

        {/* Mobile help */}
        <div className="flex gap-3 rounded-xl bg-primary/[0.05] p-4 text-sm">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">On your phone</p>
            <p>
              <span className="font-medium text-foreground">Android (Chrome):</span> open TaskFlow, tap <em>Enable alerts</em> and allow.
            </p>
            <p>
              <span className="font-medium text-foreground">iPhone (Safari, iOS 16.4+):</span> tap Share → <em>Add to Home Screen</em>, open
              TaskFlow from the home screen, then tap <em>Enable alerts</em>.
            </p>
            <p>Alerts arrive while TaskFlow is open (or recently in the background). The site must be served over https.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Logo } from "@/components/common/Logo";
import { useMe } from "@/hooks/useAuth";
import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";
import { ApiClientError } from "@/lib/api";

/**
 * Auth guard + layout for every logged-in page.
 * Shows a loader while checking the session and redirects to /login when logged out.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, error, isPending, refetch } = useMe();
  const loggedOut = error instanceof ApiClientError && error.status === 401;

  useEffect(() => {
    if (loggedOut) router.replace("/login");
  }, [loggedOut, router]);

  if (isPending || loggedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <Logo className="animate-pulse" />
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Can&apos;t reach the server</p>
        <p className="max-w-sm text-sm text-muted-foreground">{error?.message}</p>
        <button onClick={() => refetch()} className="text-sm font-medium text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AlertsWatcher />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar user={user} />
        <main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/** Mounted only when logged in, so alerts never poll for logged-out visitors. */
function AlertsWatcher() {
  useNotificationAlerts();
  return null;
}

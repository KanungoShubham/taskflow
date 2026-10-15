"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useLogout } from "@/hooks/useAuth";
import type { User } from "@/lib/types";

export function UserMenu({ user }: { user: User }) {
  const logout = useLogout();
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <UserAvatar name={user.name} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings />
          Settings & alerts
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut />
          {logout.isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

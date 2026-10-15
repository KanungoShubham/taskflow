"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import type { User } from "@/lib/types";

export function Topbar({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

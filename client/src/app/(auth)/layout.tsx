import { CheckCircle2, Bell, KanbanSquare, Users } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const FEATURES = [
  { icon: KanbanSquare, text: "Kanban boards with drag & drop" },
  { icon: Users, text: "Teams, members and task assignment" },
  { icon: Bell, text: "Notifications when work changes hands" },
  { icon: CheckCircle2, text: "Live progress for every team" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <Logo light />
        <div className="relative space-y-8">
          <h1 className="max-w-md text-4xl leading-tight font-bold tracking-tight">
            Organize your team&apos;s work and ship faster.
          </h1>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="grid size-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="size-4.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">Built with Next.js, Express and MongoDB.</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}

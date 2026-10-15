import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

/** "Asha Verma" -> "AV" */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Same name always gets the same color. */
function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function UserAvatar({
  name,
  size = "default",
  className,
}: {
  name: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={cn("ring-2 ring-background", className)}>
      <AvatarFallback className={cn("font-semibold text-white", colorFor(name))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITIES, STATUSES, type Priority, type Status, type User } from "@/lib/types";

const ALL = "all";

export interface FilterValues {
  search: string;
  status?: Status;
  priority?: Priority;
  assignee?: string;
}

/** Search + dropdown filters. Status filter is hidden on the board (columns already split by status). */
export function TaskFilters({
  value,
  onChange,
  members,
  hideStatus,
}: {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  members?: User[];
  hideStatus?: boolean;
}) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...value, ...patch });
  const active = !!(value.search || value.status || value.priority || value.assignee);

  const statusItems = [{ value: ALL, label: "All statuses" }, ...STATUSES];
  const priorityItems = [{ value: ALL, label: "All priorities" }, ...PRIORITIES];
  const memberItems = [{ value: ALL, label: "Everyone" }, ...(members ?? []).map((m) => ({ value: m._id, label: m.name }))];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search tasks..."
          className="h-9 bg-card pl-9"
          aria-label="Search tasks"
        />
      </div>

      {!hideStatus && (
        <Select
          items={statusItems}
          value={value.status ?? ALL}
          onValueChange={(v) => set({ status: v === ALL || !v ? undefined : (v as Status) })}
        >
          <SelectTrigger className="h-9 bg-card sm:w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        items={priorityItems}
        value={value.priority ?? ALL}
        onValueChange={(v) => set({ priority: v === ALL || !v ? undefined : (v as Priority) })}
      >
        <SelectTrigger className="h-9 bg-card sm:w-40" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {priorityItems.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {members && (
        <Select
          items={memberItems}
          value={value.assignee ?? ALL}
          onValueChange={(v) => set({ assignee: v === ALL || !v ? undefined : v })}
        >
          <SelectTrigger className="h-9 bg-card sm:w-44" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {memberItems.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ search: "" })} className="text-muted-foreground">
          <X /> Clear
        </Button>
      )}
    </div>
  );
}

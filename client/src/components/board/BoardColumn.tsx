"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { SortableTaskCard } from "@/components/board/SortableTaskCard";
import type { Status, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export const COLUMN_META: Record<Status, { label: string; dot: string; tint: string }> = {
  todo: { label: "To Do", dot: "bg-slate-400", tint: "from-slate-500/[0.06]" },
  in_progress: { label: "In Progress", dot: "bg-sky-500", tint: "from-sky-500/[0.07]" },
  done: { label: "Done", dot: "bg-emerald-500", tint: "from-emerald-500/[0.07]" },
};

export function BoardColumn({
  status,
  tasks,
  onOpen,
  onAdd,
}: {
  status: Status;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onAdd: (status: Status) => void;
}) {
  // The column itself is a drop target so cards can be dropped into an empty column.
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const meta = COLUMN_META[status];

  return (
    <section
      className={cn(
        "flex min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b to-transparent bg-muted/30 p-3 transition-colors",
        meta.tint,
        isOver && "border-primary/40 bg-primary/[0.04]"
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", meta.dot)} />
          <h3 className="text-sm font-semibold">{meta.label}</h3>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-xs">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(status)}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="size-4" />
        </button>
      </header>

      <SortableContext id={status} items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2.5">
          {tasks.map((task) => (
            <SortableTaskCard key={task._id} task={task} onOpen={onOpen} />
          ))}
          {tasks.length === 0 && (
            <button
              onClick={() => onAdd(status)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
                isOver && "border-primary/50 bg-primary/5"
              )}
            >
              <Plus className="size-4" />
              Drop a task here or add one
            </button>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

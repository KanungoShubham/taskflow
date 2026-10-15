"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A board card that can be dragged within and between columns. */
export function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={() => onOpen(task)} />
    </div>
  );
}

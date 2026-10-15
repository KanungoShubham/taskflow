"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BoardColumn } from "@/components/board/BoardColumn";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useMoveTask } from "@/hooks/useTasks";
import { STATUSES, type Status, type Task } from "@/lib/types";

type Columns = Record<Status, Task[]>;

const STATUS_IDS = STATUSES.map((s) => s.value);

function groupByStatus(tasks: Task[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], done: [] };
  for (const t of tasks) cols[t.status].push(t);
  return cols;
}

/** Which column holds this id (a column id or a task id)? */
function findColumn(cols: Columns, id: string): Status | undefined {
  if ((STATUS_IDS as string[]).includes(id)) return id as Status;
  return STATUS_IDS.find((s) => cols[s].some((t) => t._id === id));
}

/**
 * Server `order` for a card dropped at `index`: take the position of the card that is now
 * below it (the server shifts that card and the rest down). Works with filtered views too,
 * because it uses real `order` values instead of the visible index.
 */
function targetOrder(column: Task[], index: number) {
  const next = column[index + 1];
  if (next) return next.order;
  const prev = column[index - 1];
  return prev ? prev.order + 1 : 0;
}

/**
 * Kanban board with drag & drop.
 * While dragging, the board keeps its own copy of the columns; on drop it writes the new
 * order into the query cache (instant UI) and calls the API. On failure the hook restores
 * the previous data, so the card snaps back and an error toast appears.
 */
export function Board({
  tasks,
  listKey,
  onOpen,
  onAdd,
}: {
  tasks: Task[];
  listKey: readonly unknown[];
  onOpen: (task: Task) => void;
  onAdd: (status: Status) => void;
}) {
  const qc = useQueryClient();
  const move = useMoveTask();
  const [dragCols, setDragCols] = useState<Columns | null>(null);
  const [active, setActive] = useState<Task | null>(null);
  const columns = dragCols ?? groupByStatus(tasks);

  const sensors = useSensors(
    // Small distance so a simple click still opens the task.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragCols(groupByStatus(tasks));
    setActive(tasks.find((t) => t._id === active.id) ?? null);
  };

  // Moving over another column: move the card into it so the preview shows the new spot.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !dragCols) return;
    const from = findColumn(dragCols, String(active.id));
    const to = findColumn(dragCols, String(over.id));
    if (!from || !to || from === to) return;

    setDragCols((cols) => {
      if (!cols) return cols;
      const card = cols[from].find((t) => t._id === active.id);
      if (!card) return cols;
      const overIndex = cols[to].findIndex((t) => t._id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : cols[to].length;
      const target = [...cols[to]];
      target.splice(insertAt, 0, { ...card, status: to });
      return { ...cols, [from]: cols[from].filter((t) => t._id !== active.id), [to]: target };
    });
  };

  const reset = () => {
    setDragCols(null);
    setActive(null);
  };

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    const original = tasks.find((t) => t._id === a.id);
    if (!over || !dragCols || !original) return reset();

    const col = findColumn(dragCols, String(a.id));
    if (!col) return reset();

    // Reorder inside the final column.
    let finalCol = dragCols[col];
    const fromIndex = finalCol.findIndex((t) => t._id === a.id);
    const overIndex = finalCol.findIndex((t) => t._id === over.id);
    if (overIndex >= 0 && overIndex !== fromIndex) finalCol = arrayMove(finalCol, fromIndex, overIndex);
    const newIndex = finalCol.findIndex((t) => t._id === a.id);

    const originalIndex = groupByStatus(tasks)[original.status].findIndex((t) => t._id === a.id);
    if (col === original.status && newIndex === originalIndex) return reset();

    const order = targetOrder(finalCol, newIndex);
    const nextCols: Columns = { ...dragCols, [col]: finalCol };
    const optimistic = STATUS_IDS.flatMap((s) => nextCols[s].map((t, i) => ({ ...t, status: s, order: i })));

    const prev = qc.getQueryData<Task[]>(listKey);
    qc.setQueryData(listKey, optimistic);
    reset();
    move.mutate({ task: original, status: col, order, rollback: { listKey, prev } });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {STATUS_IDS.map((status) => (
          <BoardColumn key={status} status={status} tasks={columns[status]} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? <TaskCard task={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Lock, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useMe } from "@/hooks/useAuth";
import { useCreateTask, useDeleteTask, useMoveTask, useUpdateTask, type TaskInput } from "@/hooks/useTasks";
import { handleFormError } from "@/lib/form";
import { endOfDayISO, toDateInput, todayInput } from "@/lib/dates";
import { taskFormSchema, type TaskValues } from "@/lib/schemas";
import { PRIORITIES, STATUSES, type Status, type Task, type User } from "@/lib/types";

const UNASSIGNED = "none";

export interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Task to edit. Omit to create a new one. */
  task?: Task | null;
  /** Team the new task belongs to (omit for a personal task). */
  teamId?: string;
  /** Team members, enables the assignee picker. */
  members?: User[];
  /** Team owner id: the owner may edit any team task. */
  teamOwnerId?: string;
  defaultStatus?: Status;
}

export function TaskDialog(props: TaskDialogProps) {
  const { open, onOpenChange, task } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* key resets the form whenever a different task (or "new") is opened */}
        {open && <TaskForm key={task?._id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ onOpenChange, task, teamId, members, teamOwnerId, defaultStatus = "todo" }: TaskDialogProps) {
  const { data: me } = useMe();
  const create = useCreateTask();
  const update = useUpdateTask();
  const move = useMoveTask();
  const remove = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!task;
  const isTeamTask = isEdit ? !!task.team : !!teamId;
  // The assignee picker needs the member list; without it we leave the assignee untouched.
  const showAssignee = isTeamTask && !!members;
  // Creator or team owner can edit everything; other members can only change the status.
  const canManage = !isEdit || task.createdBy._id === me?._id || (!!teamOwnerId && teamOwnerId === me?._id);

  const today = todayInput();
  const originalDue = toDateInput(task?.dueDate ?? null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskFormSchema(today, originalDue)),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "medium",
      status: task?.status ?? defaultStatus,
      dueDate: toDateInput(task?.dueDate ?? null),
      assignee: task?.assignee?._id ?? "",
    },
  });

  const pending = create.isPending || update.isPending || move.isPending;
  const close = () => onOpenChange(false);
  const onError = (err: unknown) => handleFormError(err, setError, ["title", "description", "priority", "status", "dueDate", "assignee"]);

  const onSubmit = (v: TaskValues) => {
    if (isEdit && !canManage) {
      if (v.status === task.status) return close();
      return move.mutate({ task, status: v.status, order: 0 }, { onSuccess: close });
    }

    const input: TaskInput = {
      title: v.title,
      description: v.description,
      priority: v.priority,
      status: v.status,
    };
    // Send the due date only when it changed (an overdue date can be kept as it is).
    if (!isEdit || v.dueDate !== originalDue) input.dueDate = v.dueDate ? endOfDayISO(v.dueDate) : null;
    if (showAssignee) input.assignee = v.assignee || null;

    if (isEdit) {
      update.mutate({ id: task._id, input }, { onSuccess: close, onError });
    } else {
      create.mutate({ ...input, team: teamId ?? null }, { onSuccess: close, onError });
    }
  };

  const assigneeItems = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...(members ?? []).map((m) => ({ value: m._id, label: m._id === me?._id ? `${m.name} (you)` : m.name })),
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">{isEdit ? "Task details" : "New task"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Created by ${task.createdBy.name} on ${format(new Date(task.createdAt), "MMM d, yyyy")}`
            : isTeamTask
              ? "Add a task to the team board."
              : "Add a task to your personal list."}
        </DialogDescription>
      </DialogHeader>

      {!canManage && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          Only the creator or the team owner can edit details. You can still change the status.
        </div>
      )}

      <form id="task-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label="Title" htmlFor="title" error={errors.title?.message}>
          <Input
            id="title"
            placeholder="e.g. Design the login screen"
            autoFocus={!isEdit}
            disabled={!canManage}
            aria-invalid={!!errors.title}
            className="h-9"
            {...register("title")}
          />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea
            id="description"
            rows={3}
            placeholder="Add more details (optional)"
            disabled={!canManage}
            aria-invalid={!!errors.description}
            className="resize-none"
            {...register("description")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select items={PRIORITIES} value={field.value} onValueChange={(v) => v && field.onChange(v)} disabled={!canManage}>
                  <SelectTrigger id="priority" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Status" htmlFor="status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select items={STATUSES} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger id="status" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Due date" htmlFor="dueDate" error={errors.dueDate?.message} className={showAssignee ? "" : "col-span-2"}>
            <Input
              id="dueDate"
              type="date"
              min={today}
              disabled={!canManage}
              aria-invalid={!!errors.dueDate}
              className="h-9"
              {...register("dueDate")}
            />
          </Field>

          {showAssignee && (
            <Field label="Assignee" htmlFor="assignee" error={errors.assignee?.message}>
              <Controller
                control={control}
                name="assignee"
                render={({ field }) => (
                  <Select
                    items={assigneeItems}
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) => field.onChange(v === UNASSIGNED || !v ? "" : v)}
                    disabled={!canManage}
                  >
                    <SelectTrigger id="assignee" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assigneeItems.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
        </div>
        {isTeamTask && !showAssignee && (
          <p className="text-xs text-muted-foreground">
            Assigned to <span className="font-medium text-foreground">{task?.assignee?.name ?? "nobody"}</span>
            {task?.team && <> in {task.team.name}</>}. Open the team board to reassign.
          </p>
        )}
      </form>

      <DialogFooter className="sm:justify-between">
        {isEdit && canManage ? (
          <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={pending || (isEdit && !isDirty)} className="min-w-28">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </DialogFooter>

      {isEdit && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete this task?"
          description={`"${task.title}" will be permanently deleted. This cannot be undone.`}
          pending={remove.isPending}
          onConfirm={() =>
            remove.mutate(task._id, {
              onSuccess: () => {
                setConfirmDelete(false);
                close();
              },
            })
          }
        />
      )}
    </>
  );
}

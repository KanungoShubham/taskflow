import { differenceInCalendarDays, endOfDay, format, isPast, isToday, isTomorrow, parse } from "date-fns";
import type { Task } from "@/lib/types";

/** A task is overdue when it is not done and its due date has passed (end of that day). */
export function isOverdue(task: Pick<Task, "dueDate" | "status">) {
  if (!task.dueDate || task.status === "done") return false;
  const due = new Date(task.dueDate);
  return isPast(due) && !isToday(due);
}

/** "Today", "Tomorrow", "in 3 days", "2 days ago", or "Mar 4". */
export function dueLabel(dueDate: string) {
  const due = new Date(dueDate);
  if (isToday(due)) return "Today";
  if (isTomorrow(due)) return "Tomorrow";
  const diff = differenceInCalendarDays(due, new Date());
  if (diff < 0 && diff >= -6) return `${-diff} day${diff === -1 ? "" : "s"} ago`;
  if (diff > 0 && diff <= 6) return `in ${diff} days`;
  return format(due, "MMM d");
}

/** ISO date -> "yyyy-mm-dd" for <input type="date">. */
export function toDateInput(iso: string | null) {
  return iso ? format(new Date(iso), "yyyy-MM-dd") : "";
}

/** Today as "yyyy-mm-dd" in the user's timezone (min value for due date inputs). */
export function todayInput() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * "yyyy-mm-dd" -> ISO time of the END of that day in the user's timezone.
 * The server rejects due dates that are already over, so this keeps "today" valid everywhere.
 */
export function endOfDayISO(dateInput: string) {
  return endOfDay(parse(dateInput, "yyyy-MM-dd", new Date())).toISOString();
}

export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress" | "done";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  taskCounts?: { total: number; done: number };
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  team: { _id: string; name: string } | null;
  assignee: User | null;
  createdBy: User;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = "task_assigned" | "team_added" | "task_completed";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  message: string;
  task: string | null;
  team: string | null;
  read: boolean;
  createdAt: string;
}

export interface TeamProgress {
  total: number;
  byStatus: Record<Status, number>;
  percent: number;
  members: { user: User; assigned: number; done: number }[];
}

export interface Stats {
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  total: number;
}

export interface TaskFilters {
  team?: string; // team id or "personal"
  status?: Status;
  priority?: Priority;
  assignee?: string; // user id or "me"
  search?: string;
}

export const STATUSES: { value: Status; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

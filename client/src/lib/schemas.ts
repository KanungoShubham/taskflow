import { z } from "zod";

// Form schemas. Limits mirror the server validators so users see errors before submitting.

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email,
    password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be at most 120 characters"),
  description: z.string().trim().max(2000, "Description must be at most 2000 characters"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
  dueDate: z.string(), // "" or yyyy-mm-dd
  assignee: z.string(), // "" = unassigned
});

/**
 * Task form schema with the "no past due date" rule.
 * `keepDate` is the task's current due date (yyyy-mm-dd): an already-overdue task
 * can still be edited as long as its date is left unchanged.
 */
export function taskFormSchema(today: string, keepDate = "") {
  return taskSchema.refine((v) => !v.dueDate || v.dueDate >= today || v.dueDate === keepDate, {
    message: "Due date cannot be in the past",
    path: ["dueDate"],
  });
}

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters").max(60, "Team name must be at most 60 characters"),
  description: z.string().trim().max(300, "Description must be at most 300 characters"),
});

export const memberSchema = z.object({ email });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type TaskValues = z.infer<typeof taskSchema>;
export type TeamValues = z.infer<typeof teamSchema>;
export type MemberValues = z.infer<typeof memberSchema>;

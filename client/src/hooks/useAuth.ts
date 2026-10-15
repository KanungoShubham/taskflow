"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import type { LoginValues, RegisterValues } from "@/lib/schemas";

export const meKey = ["me"] as const;

/** Current user. Errors with status 401 when logged out. */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api<User>("/auth/me"), staleTime: 5 * 60_000 });
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (values: LoginValues) => api<User>("/auth/login", { method: "POST", body: values }),
    onSuccess: (user) => {
      qc.clear();
      qc.setQueryData(meKey, user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      router.replace("/dashboard");
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ name, email, password }: RegisterValues) =>
      api<User>("/auth/register", { method: "POST", body: { name, email, password } }),
    onSuccess: (user) => {
      qc.clear();
      qc.setQueryData(meKey, user);
      toast.success("Account created. Let's get organized!");
      router.replace("/dashboard");
    },
  });
}

/** Step 1: check the email and get a one-time reset token (valid 15 minutes). */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api<{ resetToken: string; expiresAt: string }>("/auth/forgot-password", { method: "POST", body: { email } }),
  });
}

/** Step 2: set the new password with the token; the user is logged in afterwards. */
export function useResetPassword() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      api<User>("/auth/reset-password", { method: "POST", body: { token, password } }),
    onSuccess: (user) => {
      qc.clear();
      qc.setQueryData(meKey, user);
      toast.success("Password updated. You're logged in!");
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      // Next login (maybe another user) should get its own "pending tasks" alert.
      try {
        sessionStorage.removeItem("taskflow.pendingAlertShown");
      } catch {
        // storage blocked: nothing to clear
      }
      toast.success("You have been logged out");
      router.replace("/login");
    },
  });
}

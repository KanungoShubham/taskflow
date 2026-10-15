"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, MailSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { PasswordInput } from "@/components/common/PasswordInput";
import { useForgotPassword, useResetPassword } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api";
import { handleFormError } from "@/lib/form";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * Forgot password in two steps:
 * 1. Enter your email: we check an account exists and get a one-time reset token.
 * 2. Choose a new password: the token is used once and you are logged in.
 */
export default function ForgotPasswordPage() {
  const [reset, setReset] = useState<{ email: string; token: string } | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to log in
      </Link>

      <Steps step={reset ? 2 : 1} />

      {reset ? (
        <NewPasswordStep email={reset.email} token={reset.token} onRestart={() => setReset(null)} />
      ) : (
        <EmailStep onFound={(email, token) => setReset({ email, token })} />
      )}
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center gap-2 text-xs font-medium">
      {["Find account", "New password"].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className={cn("h-px w-6", step > i ? "bg-primary" : "bg-border")} />}
          <span
            className={cn(
              "grid size-5 place-items-center rounded-full text-[10px] font-bold",
              step > i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </span>
          <span className={step > i ? "text-foreground" : "text-muted-foreground"}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function EmailStep({ onFound }: { onFound: (email: string, token: string) => void }) {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = ({ email }: ForgotPasswordValues) =>
    forgot.mutate(email, {
      onSuccess: ({ resetToken }) => onFound(email, resetToken),
      onError: (err) => handleFormError(err, setError, ["email"]),
    });

  return (
    <>
      <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <MailSearch className="size-5" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Forgot your password?</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Enter the email you signed up with and we&apos;ll find your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-5">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="h-10"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Button type="submit" size="lg" className="h-10 bg-brand-gradient shadow-md shadow-primary/25" disabled={forgot.isPending}>
          {forgot.isPending && <Loader2 className="animate-spin" />}
          {forgot.isPending ? "Checking..." : "Continue"}
        </Button>
      </form>
    </>
  );
}

function NewPasswordStep({ email, token, onRestart }: { email: string; token: string; onRestart: () => void }) {
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = ({ password }: ResetPasswordValues) =>
    resetPassword.mutate(
      { token, password },
      {
        onError: (err) => {
          handleFormError(err, setError, ["password"]);
          // Token expired or already used: go back to step 1.
          if (err instanceof ApiClientError && err.status === 400 && !err.errors) onRestart();
        },
      }
    );

  return (
    <>
      <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <KeyRound className="size-5" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Set a new password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Account found for <span className="font-medium text-foreground">{email}</span>. This step expires in 15 minutes.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4">
        <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 6 characters">
          <PasswordInput id="password" autoComplete="new-password" autoFocus aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="mt-1 h-10 bg-brand-gradient shadow-md shadow-primary/25"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending && <Loader2 className="animate-spin" />}
          {resetPassword.isPending ? "Updating..." : "Update password & log in"}
        </Button>
        <button type="button" onClick={onRestart} className="text-center text-xs text-muted-foreground hover:text-foreground">
          Use a different email
        </button>
      </form>
    </>
  );
}

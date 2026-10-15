"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { PasswordInput } from "@/components/common/PasswordInput";
import { useLogin } from "@/hooks/useAuth";
import { handleFormError } from "@/lib/form";
import { loginSchema, type LoginValues } from "@/lib/schemas";

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = (values: LoginValues) =>
    login.mutate(values, { onError: (err) => handleFormError(err, setError, ["email", "password"]) });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Log in to continue to your workspace.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-5">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-10"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          action={
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Button type="submit" size="lg" className="h-10 bg-brand-gradient shadow-md shadow-primary/25" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" />}
          {login.isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to TaskFlow?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

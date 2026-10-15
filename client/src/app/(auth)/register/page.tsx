"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { PasswordInput } from "@/components/common/PasswordInput";
import { useRegister } from "@/hooks/useAuth";
import { handleFormError } from "@/lib/form";
import { registerSchema, type RegisterValues } from "@/lib/schemas";

export default function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (values: RegisterValues) =>
    registerUser.mutate(values, { onError: (err) => handleFormError(err, setError, ["name", "email", "password"]) });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Start managing tasks with your team in seconds.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Asha Verma" className="h-10" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
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
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 6 characters">
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
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
          disabled={registerUser.isPending}
        >
          {registerUser.isPending && <Loader2 className="animate-spin" />}
          {registerUser.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

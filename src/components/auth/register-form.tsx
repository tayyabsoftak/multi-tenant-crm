"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function passwordStrengthScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
}

const registerFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(120),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    organizationName: z.string().min(2, "Organization name is required").max(120),
    password: z.string().min(8, "At least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"] as const;

export function RegisterForm(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");
  const strength = useMemo(() => passwordStrengthScore(password ?? ""), [password]);
  const strengthLabel = strengthLabels[strength] ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        organizationName: values.organizationName.trim(),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      toast.error(data.error ?? "Registration failed", {
        description: res.status === 409 ? "Try signing in instead." : "Please check the form and try again.",
      });
      return;
    }

    toast.success("Account created", { description: "Signing you in…" });

    const signInResult = await signIn("credentials", {
      email: values.email.trim(),
      password: values.password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (signInResult?.error) {
      toast.message("Account ready", { description: "Please sign in with your new credentials." });
      return;
    }

    if (signInResult?.url) {
      window.location.href = signInResult.url;
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-[420px] border-border/80 bg-card p-6 text-card-foreground shadow-lg sm:p-8">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground">New organization — you will be the admin.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="register-name">Full name</Label>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder="Enter full name"
            className={cn(form.formState.errors.name && "border-destructive")}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="Enter email address"
            className={cn(form.formState.errors.email && "border-destructive")}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-org">Organization name</Label>
          <Input
            id="register-org"
            autoComplete="organization"
            placeholder="Enter organization name"
            className={cn(form.formState.errors.organizationName && "border-destructive")}
            {...form.register("organizationName")}
          />
          {form.formState.errors.organizationName ? (
            <p className="text-xs text-destructive">{form.formState.errors.organizationName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="register-password">Password</Label>
            <span className="text-xs text-muted-foreground">{strengthLabel}</span>
          </div>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter strong password"
              className={cn("pr-10", form.formState.errors.password && "border-destructive")}
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full rounded-l-none text-muted-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          <div className="flex gap-1 pt-0.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => {
              const filled = password.length > 0 && strength > i;
              return (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full bg-muted transition-colors",
                    filled &&
                      (strength <= 2
                        ? "bg-destructive/80"
                        : strength === 3
                          ? "bg-primary/80"
                          : "bg-primary"),
                  )}
                />
              );
            })}
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Use 8+ characters with mixed case, numbers, and symbols.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <div className="relative">
            <Input
              id="register-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm password"
              className={cn("pr-10", form.formState.errors.confirmPassword && "border-destructive")}
              {...form.register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full rounded-l-none text-muted-foreground"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="register-terms"
            checked={!!form.watch("acceptTerms")}
            onCheckedChange={(checked) => form.setValue("acceptTerms", checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="register-terms" className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground">
            I agree to the terms of service (optional).
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

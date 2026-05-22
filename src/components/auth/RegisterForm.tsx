"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const REMEMBER_EMAIL_KEY = "crm_auth_remember_email";

const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "At least 8 characters"),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function RegisterForm(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMEMBER_EMAIL_KEY);

      if (stored) {
        setValue("email", stored);
        setValue("remember", true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [setValue]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (values.remember) {
        localStorage.setItem(
          REMEMBER_EMAIL_KEY,
          values.email.trim()
        );
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }

    const result = await signIn("credentials", {
      email: values.email.trim(),
      password: values.password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password", {
        description: "Check your credentials and try again.",
      });

      return;
    }

    if (result?.url) {
      router.push(result.url);
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-[420px] border-border/80 bg-card p-6 text-card-foreground shadow-lg sm:p-8">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in
          </h1>

          <p className="text-sm text-muted-foreground">
            Use your work email and password.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={onSubmit}
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="login-email">
              Email
            </Label>

            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Enter email address"
              className={cn(
                form.formState.errors.email &&
                "border-destructive focus-visible:ring-destructive"
              )}
              {...form.register("email")}
            />

            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="login-password">
              Password
            </Label>

            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                className={cn(
                  "pr-10",
                  form.formState.errors.password &&
                  "border-destructive focus-visible:ring-destructive"
                )}
                {...form.register("password")}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full rounded-l-none text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>

            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="login-remember"
              checked={form.watch("remember")}
              onCheckedChange={(checked) =>
                form.setValue(
                  "remember",
                  checked === true
                )
              }
            />

            <Label
              htmlFor="login-remember"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Remember me
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
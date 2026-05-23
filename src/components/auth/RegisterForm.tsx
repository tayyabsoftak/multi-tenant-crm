"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { registerBodySchema, type RegisterBody } from "@/lib/validations/AuthSchema";

export function RegisterForm(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterBody>({
    resolver: zodResolver(registerBodySchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organizationName: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to register account.");
      }

      toast.success("Account created successfully!", {
        description: "Please sign in to continue.",
      });

      router.push("/login");
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-[420px] border-border/80 bg-card p-6 text-card-foreground shadow-lg sm:p-8">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>

          <p className="text-sm text-muted-foreground">
            Get started by entering your details.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={onSubmit}
          noValidate
        >
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="register-name">
              Full Name
            </Label>

            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              className={cn(
                form.formState.errors.name &&
                "border-destructive focus-visible:ring-destructive"
              )}
              {...form.register("name")}
            />

            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="register-email">
              Email
            </Label>

            <Input
              id="register-email"
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

          {/* Organization Name Field */}
          <div className="space-y-2">
            <Label htmlFor="register-org">
              Organization Name
            </Label>

            <Input
              id="register-org"
              type="text"
              placeholder="Enter organization name"
              className={cn(
                form.formState.errors.organizationName &&
                "border-destructive focus-visible:ring-destructive"
              )}
              {...form.register("organizationName")}
            />

            {form.formState.errors.organizationName ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.organizationName.message}
              </p>
            ) : null}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="register-password">
              Password
            </Label>

            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
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

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
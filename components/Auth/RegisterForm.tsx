"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Every emphasised element here was `danger` — the red this system
          reserves for destructive actions: the focus ring, the submit button
          and the link to sign in. Creating an account destroys nothing. */}
      <div>
        <Label htmlFor="email" className="mb-1.5">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="password" className="mb-1.5">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-hint"
          required
        />
        <p id="password-hint" className="mt-1.5 text-xs text-fg-subtle">
          At least 6 characters.
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "register-error" : undefined}
          required
        />
      </div>

      {error && (
        <p id="register-error" role="alert" className="text-sm text-danger-bright">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} loading={isSubmitting} variant="primary" size="lg" full>
        {isSubmitting ? "Creating account" : "Create account"}
      </Button>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="inline-flex min-h-[44px] items-center text-fg underline transition-colors hover:text-accent-bright"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-fg-subtle">
        You must be 21 or older to reserve a table.
      </p>
    </form>
  );
}

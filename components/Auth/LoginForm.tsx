"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the actual login function from AuthProvider
      await login(email, password);
      
      // Call onSuccess callback if provided to close modal
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigation will be handled in the AuthProvider login function
    } catch (error: any) {
      // Error is already handled in the login function
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Set guest mode in localStorage
    localStorage.setItem('guestMode', 'true');
    
    // Show success message
    toast.success('Logged in as guest');
    
    // Call onSuccess to close modal
    if (onSuccess) {
      onSuccess();
    }
    
    // Reload page to apply guest mode
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-1.5">
          Email address
        </Label>
        {/* The two fields re-declared the input recipe with a focus ring in
            `--fg`, where every other input on the site rings in `--accent`. */}
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          {/* Was a plain white sentence sitting under the field, reading as
              helper text rather than as the link out of a locked account. */}
          {/* `-my-2 py-2` keeps the label baseline where it is while giving the
              link a 36px box; the pointer-coarse bump takes it past 44px on a
              touch screen without loosening the desktop row. */}
          <Link
            href="/auth/forgot-password"
            className="-my-2 py-2 text-sm text-fg-muted underline transition-colors hover:text-fg [@media(pointer:coarse)]:py-3"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={isLoading} loading={isLoading} variant="primary" size="lg" full>
        {isLoading ? 'Signing in' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-fg-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/register"
          className="inline-flex min-h-[44px] items-center text-fg underline transition-colors hover:text-accent-bright"
        >
          Create one
        </Link>
      </p>

      {/* "Or continue with" is the label for third-party sign-in providers; the
          only thing under it was a button for browsing without an account. */}
      <div className="relative pt-2">
        <div aria-hidden="true" className="absolute inset-0 flex items-center pt-2">
          <div className="w-full border-t border-line-subtle" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-2 text-xs uppercase tracking-wider text-fg-subtle">or</span>
        </div>
      </div>

      <div>
        <Button type="button" onClick={handleGuestMode} variant="outline" size="md" full>
          Browse as a guest
        </Button>
        <p className="mt-2 text-center text-xs text-fg-subtle">
          You&apos;ll need an account to reserve a table.
        </p>
      </div>
    </form>
  );
}

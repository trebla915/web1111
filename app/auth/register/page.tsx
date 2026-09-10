"use client";

import RegisterForm from "@/components/Auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-24 text-fg">
      <div className="w-full max-w-md rounded-lg border border-line-accent/30 bg-surface p-6 sm:p-8">
        <h1 className="mb-1 text-center font-heading text-2xl tracking-wide">Create account</h1>
        <p className="mb-6 text-center text-sm text-fg-muted">
          Book VIP tables and keep your reservations in one place.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
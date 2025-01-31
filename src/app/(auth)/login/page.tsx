"use client";

import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Member Login</h2>
        <LoginForm />
      </div>
    </div>
  );
}
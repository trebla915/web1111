"use client";

import RegisterForm from "@/components/Auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <RegisterForm />
      </div>
    </div>
  );
}
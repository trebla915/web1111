"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors ${
          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>

      <div className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-red-500 hover:text-red-400 transition-colors">
          Sign In
        </Link>
      </div>
    </form>
  );
} 
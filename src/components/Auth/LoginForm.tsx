"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect param or default to home
  const redirect = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      router.push(redirect);
    } catch (err) {
      setError("Invalid email or password");
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <div>
        <label className="block mb-2 text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? "Logging in..." : "Sign In"}
      </button>

      <div className="text-center mt-4 text-sm">
        Don't have an account?{" "}
        <Link href="/register" className="text-purple-400 hover:underline">
          Sign Up
        </Link>
      </div>
    </form>
  );
}
"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created! Redirecting...");
      router.push("/login");
    } catch (err) {
      setError("Registration failed.");
      toast.error("Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
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
        {loading ? "Creating..." : "Sign Up"}
      </button>

      <div className="text-center mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-400 hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
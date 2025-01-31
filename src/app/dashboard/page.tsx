"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader"; // ✅ Ensure you have a loading state

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      router.replace("/login"); // ✅ Use replace() to prevent back navigation loop
    }
  }, [user, loading, router]);

  if (loading || redirecting) return <Loader />; // ✅ Prevents flashing content before redirecting

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">Welcome to Your Dashboard</h1>
      <p className="text-gray-300">Your exclusive content goes here.</p>
    </div>
  );
}
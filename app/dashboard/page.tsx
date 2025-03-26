"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen py-24 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Member Dashboard</h1>
          
          {/* Show Admin Dashboard link for admin/promoter users */}
          {(user.role === 'admin' || user.role === 'promoter') && (
            <Link 
              href="/admin/dashboard" 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.displayName || user.email}</h2>
          {user.role && (
            <div className="mb-4">
              <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                {user.role.toUpperCase()}
              </span>
            </div>
          )}
          <p className="text-gray-300 mb-4">
            Here you can manage your reservations and view upcoming events.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Link 
              href="/dashboard/reservations" 
              className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center text-center"
            >
              <h3 className="text-lg font-semibold mb-2">My Reservations</h3>
              <p className="text-gray-400">View and manage your table reservations</p>
            </Link>
            
            <Link 
              href="/dashboard/events" 
              className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center text-center"
            >
              <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
              <p className="text-gray-400">Check out events you've registered for</p>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/profile" 
            className="p-6 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center"
          >
            <h3 className="text-lg font-semibold mb-2">My Profile</h3>
            <p className="text-gray-400">View and edit your profile information</p>
          </Link>
          
          <Link 
            href="/events" 
            className="p-6 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center"
          >
            <h3 className="text-lg font-semibold mb-2">Browse Events</h3>
            <p className="text-gray-400">Explore upcoming events and reserve your spot</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 
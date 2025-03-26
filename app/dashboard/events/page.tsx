"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EventsPage() {
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

  // Mock events data
  const events = [
    {
      id: 1,
      name: "Weekend Party",
      date: "Saturday, April 15, 2023",
      time: "10:00 PM - 2:00 AM",
      status: "Attending"
    }
  ];

  return (
    <div className="min-h-screen py-24 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          {events.length > 0 ? (
            <div className="space-y-6">
              {events.map(event => (
                <div key={event.id} className="p-4 border border-gray-800 rounded-lg">
                  <h3 className="text-xl font-semibold">{event.name}</h3>
                  <p className="text-gray-300">{event.date}</p>
                  <p className="text-gray-300">{event.time}</p>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 text-sm bg-green-800 rounded-full">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 mb-8">
              You're not registered for any upcoming events.
            </p>
          )}
          
          <div className="mt-8">
            <Link 
              href="/events" 
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
            >
              Browse All Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

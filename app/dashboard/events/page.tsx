"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/spinner";

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
      <LoadingScreen />
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
    <div className="min-h-screen py-24 px-6 bg-canvas text-fg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <Button asChild variant="subtle" size="md">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="bg-surface rounded-lg p-6 mb-8">
          {events.length > 0 ? (
            <div className="space-y-6">
              {events.map(event => (
                <div key={event.id} className="p-4 border border-line-subtle rounded-lg">
                  <h3 className="text-xl font-semibold">{event.name}</h3>
                  <p className="text-fg-dim">{event.date}</p>
                  <p className="text-fg-dim">{event.time}</p>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 text-sm bg-success-800 rounded-full">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-fg-dim mb-8">
              You're not registered for any upcoming events.
            </p>
          )}
          
          <div className="mt-8">
            <Button asChild variant="primary" size="lg">
              <Link href="/events">
                Browse All Events
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

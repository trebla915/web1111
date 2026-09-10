"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiBookmark, FiCalendar, FiCompass, FiUser, FiArrowRight, FiSliders } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/spinner";

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
      <LoadingScreen />
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  /**
   * Four destinations that do the same kind of thing were split across two
   * grids — two of them nested *inside* a welcome card, two loose beneath it —
   * on no principle, which made the panel boundary read as a grouping that
   * meant something. One grid, one card style, and each tile now shows where
   * it goes rather than being a centred paragraph.
   */
  const destinations = [
    {
      href: '/dashboard/reservations',
      icon: <FiBookmark size={20} aria-hidden="true" />,
      title: 'My reservations',
      description: 'View, change or cancel your table bookings.',
    },
    {
      href: '/dashboard/events',
      icon: <FiCalendar size={20} aria-hidden="true" />,
      title: 'My events',
      description: "Nights you've booked a table for.",
    },
    {
      href: '/events',
      icon: <FiCompass size={20} aria-hidden="true" />,
      title: 'Browse events',
      description: "What's coming up at 11:11.",
    },
    {
      href: '/profile',
      icon: <FiUser size={20} aria-hidden="true" />,
      title: 'My profile',
      description: 'Your contact details and password.',
    },
  ];

  return (
    <div className="min-h-dvh bg-canvas px-4 py-24 text-fg sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl tracking-wide">
              {user.displayName || user.email?.split('@')[0]}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              {user.role && (
                <span className="rounded-full border border-line bg-surface-raised px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-fg-dim">
                  {user.role}
                </span>
              )}
              <span className="text-sm text-fg-muted">{user.email}</span>
            </div>
          </div>

          {/* Was `bg-danger-600` — the red this system uses for destructive
              actions — on a link that just navigates. */}
          {(user.role === 'admin' || user.role === 'promoter') && (
            <Button asChild variant="outline" size="md">
              <Link href="/admin/dashboard">
                <FiSliders aria-hidden="true" size={16} />
                Admin dashboard
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 rounded-lg border border-line-accent/30 bg-surface p-5 transition-colors duration-fast hover:border-accent-deep/50 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="mt-0.5 shrink-0 rounded-lg bg-surface-raised p-2 text-fg-muted transition-colors group-hover:text-accent-bright">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-heading text-lg tracking-wide text-fg">{item.title}</span>
                  <FiArrowRight
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-fg-subtle transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-fg"
                  />
                </span>
                <span className="mt-1 block text-sm text-fg-muted">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 
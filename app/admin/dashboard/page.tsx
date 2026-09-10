"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiHome, FiPlus, FiEdit, FiUsers, FiCalendar, FiBookmark, FiDribbble, FiBell, FiLogOut, FiMenu, FiX, FiChevronDown, FiClock } from "react-icons/fi";
import { BiTable } from "react-icons/bi";
import CreateEventTab from "../components/CreateEventTab";
import EditEventsTab from "../components/EditEventsTab";
import ManageReservationsTab from "../components/ManageReservationsTab";
import AddBottleToCatalogTab from "../components/AddBottleToCatalogTab";
import AddBottlesToEventTab from "../components/AddBottlesToEventTab";
import PushNotificationsTab from "../components/PushNotificationsTab";
import StaffScheduleTab from "../components/StaffScheduleTab";
import ManageTablesTab from "../components/ManageTablesTab";
import { getUpcomingEvents } from "@/lib/services/events";
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/page-state";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<{ events: number | null; users: number | null; reservations: number | null }>({
    events: null,
    users: null,
    reservations: null,
  });
  const [nextEvent, setNextEvent] = useState<{ id: string; title: string; date?: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadStats = async () => {
      setStatsLoading(true);
      const [eventsResult, usersResult, reservationsResult] = await Promise.allSettled([
        getUpcomingEvents(),
        fetch('/api/users').then((res) => (res.ok ? res.json() : Promise.reject(res))),
        fetch('/api/reservations').then((res) => (res.ok ? res.json() : Promise.reject(res))),
      ]);

      if (cancelled) return;

      const events = eventsResult.status === 'fulfilled' ? eventsResult.value.length : null;
      const users = usersResult.status === 'fulfilled' ? usersResult.value.count : null;

      /**
       * `/api/reservations` answers `{ reservations: { [eventId]: [...] }, count,
       * limit, truncated, viewerRole }`. This counted `Object.values(response)`,
       * which is `[groupedObject, count, limit, truncated, viewerRole]` — a list
       * with no reservation in it — so the filter never matched and the admin's
       * "Pending reservations" tile read 0 no matter how many were waiting.
       */
      const reservations =
        reservationsResult.status === 'fulfilled'
          ? Object.values(
              (reservationsResult.value as { reservations?: Record<string, { status?: string }[]> })
                .reservations ?? {}
            )
              .flat()
              .filter((r) => r?.status === 'pending').length
          : null;

      if (eventsResult.status === 'fulfilled') {
        const soonest = [...eventsResult.value]
          .filter((e) => e?.date)
          .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
        setNextEvent(soonest ? { id: soonest.id, title: soonest.title, date: soonest.date } : null);
      }

      setStats({ events, users, reservations });
      setStatsLoading(false);
    };

    loadStats();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    // Redirect if not authenticated or not an admin/promoter
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'promoter'))) {
      router.replace("/dashboard");
      return;
    }
  }, [loading, user, router]);

  // Tabs configuration with better mobile labels
  const tabs = [
    { id: "Dashboard", label: "Dashboard", mobileLabel: "Home", icon: <FiHome size={20} /> },
    { id: "CreateEvent", label: "Create Event", mobileLabel: "Create", icon: <FiPlus size={20} /> },
    { id: "EditEvents", label: "Edit Events", mobileLabel: "Edit", icon: <FiEdit size={20} /> },
    { id: "ManageTables", label: "Manage Tables", mobileLabel: "Tables", icon: <BiTable size={20} /> },
    { id: "ManageUsers", label: "Manage Users", mobileLabel: "Users", icon: <FiUsers size={20} /> },
    { id: "ManageReservations", label: "Reservations", mobileLabel: "Bookings", icon: <FiCalendar size={20} /> },
    { id: "StaffSchedule", label: "Staff Schedule", mobileLabel: "Schedule", icon: <FiClock size={20} /> },
    { id: "AddBottleToCatalog", label: "Add to Catalog", mobileLabel: "Catalog", icon: <FiBookmark size={20} /> },
    { id: "AddBottlesToEvent", label: "Event Bottles", mobileLabel: "Bottles", icon: <FiDribbble size={20} /> },
    { id: "PushNotifications", label: "Notifications", mobileLabel: "Notify", icon: <FiBell size={20} /> },
  ];

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab);

  const formatEventDate = (dateStr: string) => {
    try {
      const [datePart] = dateStr.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return 'Date TBA';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Date TBA';
    }
  };

  /** The three figures the dashboard actually reports, described once. */
  const STAT_CARDS = [
    { key: 'events' as const, label: 'Upcoming events', hint: 'Published and still to come', icon: <FiCalendar size={18} /> },
    { key: 'users' as const, label: 'Registered users', hint: 'Accounts created', icon: <FiUsers size={18} /> },
    { key: 'reservations' as const, label: 'Pending reservations', hint: 'Awaiting confirmation', icon: <FiBookmark size={18} /> },
  ];

  // Tab content components
  const TabContent = ({ tab }: { tab: string }) => {
    switch (tab) {
      case "Dashboard":
        return (
          <div className="space-y-8">
            {/* Stats.
                Both "still loading" and "this request failed" used to render the
                same em dash, so a broken stat was indistinguishable from a slow
                one. Loading is a skeleton bar; an unavailable figure says so. */}
            <section aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="sr-only">Tonight at a glance</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STAT_CARDS.map((card) => {
                  const value = stats[card.key];
                  return (
                    <div
                      key={card.key}
                      className="relative overflow-hidden rounded-lg border border-line-accent/30 bg-surface p-5"
                    >
                      <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-fg-muted">{card.label}</p>
                          {statsLoading ? (
                            <div
                              role="status"
                              aria-label={`Loading ${card.label.toLowerCase()}`}
                              className="mt-2 h-8 w-16 animate-pulse rounded bg-surface-raised"
                            />
                          ) : value === null ? (
                            <p className="mt-2 text-sm text-warning-bright">Unavailable</p>
                          ) : (
                            <p className="tabular mt-1 font-heading text-3xl tracking-wide text-fg">
                              {value.toLocaleString('en-US')}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-fg-subtle">{card.hint}</p>
                        </div>
                        <span aria-hidden="true" className="shrink-0 rounded-lg bg-surface-raised p-2 text-fg-muted">
                          {card.icon}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Actions.
                These were `size="md"` buttons — a fixed 44px height — wrapping a
                stacked icon and label that needs about 72px, so the primitive
                clamped them and the icon sat flush against the top border.
                `unstyled` is the primitive's own escape hatch for controls that
                bring their own geometry. */}
            <section aria-labelledby="quick-actions-heading">
              <h2 id="quick-actions-heading" className="mb-3 font-heading text-lg tracking-wide text-fg">
                Quick actions
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tabs.slice(1, 5).map((tab) => (
                  <Button
                    unstyled
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line-accent/30 bg-surface px-3 py-5 hover:border-accent-deep/50 hover:bg-surface-raised"
                  >
                    <span aria-hidden="true" className="text-fg-muted">{tab.icon}</span>
                    <span className="text-center text-sm font-medium text-fg">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </section>

            {/* Next event.
                The dashboard landed on three counters and four shortcuts, then
                600px of empty canvas. The nearest event is already in the data
                fetched above and is the thing a manager opens this screen to
                act on, so it belongs here rather than two clicks away. */}
            <section aria-labelledby="next-event-heading">
              <h2 id="next-event-heading" className="mb-3 font-heading text-lg tracking-wide text-fg">
                Next event
              </h2>
              {statsLoading ? (
                <div className="h-24 animate-pulse rounded-lg border border-line-accent/30 bg-surface" />
              ) : nextEvent ? (
                <div className="flex flex-col gap-4 rounded-lg border border-line-accent/30 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xl tracking-wide text-fg">
                      {nextEvent.title}
                    </p>
                    {nextEvent.date && (
                      <p className="tabular mt-1 text-sm text-fg-muted">
                        {formatEventDate(nextEvent.date)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setSelectedEventId(nextEvent.id);
                        setActiveTab('ManageTables');
                      }}
                    >
                      Tables
                    </Button>
                    <Button variant="primary" size="md" onClick={() => setActiveTab('ManageReservations')}>
                      Reservations
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<FiCalendar size={32} aria-hidden="true" />}
                  title="Nothing scheduled"
                  description="There are no upcoming events. Create one to start taking reservations."
                  action={
                    <Button variant="primary" size="md" onClick={() => setActiveTab('CreateEvent')}>
                      Create an event
                    </Button>
                  }
                />
              )}
            </section>
          </div>
        );
      case "CreateEvent":
        return <CreateEventTab />;
      case "EditEvents":
        return (
          <EditEventsTab
            onManageTables={(eventId) => {
              setSelectedEventId(eventId);
              setActiveTab("ManageTables");
            }}
          />
        );
      case "ManageTables":
        return <ManageTablesTab initialEventId={selectedEventId || undefined} />;
      case "ManageReservations":
        return <ManageReservationsTab />;
      case "StaffSchedule":
        return <StaffScheduleTab />;
      case "ManageUsers":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-fg">Manage Users</h2>
            <div className="bg-surface p-4 lg:p-6 rounded-lg border border-line/30">
              <p className="text-fg-muted">User management interface will be implemented here.</p>
            </div>
          </div>
        );
      case "AddBottleToCatalog":
        return <AddBottleToCatalogTab />;
      case "AddBottlesToEvent":
        return <AddBottlesToEventTab eventId={selectedEventId || undefined} />;
      case "PushNotifications":
        return <PushNotificationsTab />;
      default:
        return null;
    }
  };

  if (loading) return <RouteLoading message="Loading dashboard…" />;

  // Don't render anything if no user or wrong role (will redirect in useEffect)
  if (!user || (user.role !== 'admin' && user.role !== 'promoter')) {
    return <RouteLoading message="Taking you to your dashboard…" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile Header - Always visible on mobile */}
      <div className="sticky top-0 z-50 border-b border-line/30 bg-surface-sunken/95 backdrop-blur-lg lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="outline"
            size="icon"
            aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX aria-hidden="true" size={20} /> : <FiMenu aria-hidden="true" size={20} />}
          </Button>

          {/* The section name is what the admin needs here; it was previously a
              second line below a logo that repeats on every screen. */}
          <div className="min-w-0 text-center">
            <p className="truncate font-heading text-base tracking-wide text-fg">{currentTab?.label}</p>
            <p className="text-[0.6875rem] uppercase tracking-wider text-fg-subtle">{user.role}</p>
          </div>

          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="text-fg-muted hover:text-danger-bright"
          >
            <FiLogOut aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>

      {/* Mobile menu.
          This was a hand-rolled overlay: a backdrop `div` with an onClick, and
          nothing else — no Escape key, no focus trap, no scroll lock, and a
          click target that a keyboard could not reach. The marketing header
          already uses the project's Sheet primitive for the same job, which
          brings all four. */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col p-0">
          <SheetHeader className="border-b border-line/30 p-5">
            <SheetTitle className="sr-only">Admin sections</SheetTitle>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-heading text-lg text-fg">
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-sm font-medium text-fg">{user.email?.split('@')[0]}</div>
                <span className="mt-0.5 inline-block rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-dim">
                  {user.role}
                </span>
              </div>
            </div>
          </SheetHeader>

          <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <Button unstyled
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`
                      flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors duration-fast
                      ${activeTab === tab.id
                        ? 'bg-surface-raised font-medium text-fg'
                        : 'text-fg-muted hover:bg-surface-raised/40 hover:text-fg'}
                    `}
                  >
                    <span aria-hidden="true" className={activeTab === tab.id ? 'text-fg' : 'text-fg-subtle'}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop Sidebar.
            Was `w-80` (320px) carrying ten short labels at `px-6 py-4`, above an
            empty bordered `div` that drew a rule with nothing on either side of
            it. Narrower, denser, and the stray rule is gone. */}
        <div className="hidden min-h-screen w-64 flex-col border-r border-line/30 bg-surface-sunken lg:flex xl:w-72">
          {/* Desktop User Profile */}
          <div className="flex items-center gap-3 border-b border-line/30 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-heading text-lg text-fg">
              {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-fg">{user.email?.split('@')[0]}</div>
              {/* The role is a fact, not a hazard. It was a red gradient — the
                  colour this system reserves for destructive actions. */}
              <span className="mt-0.5 inline-block rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wider text-fg-dim">
                {user.role}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Admin sections" className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <Button unstyled
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={`
                      relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-fast
                      ${activeTab === tab.id
                        ? 'bg-surface-raised font-medium text-fg'
                        : 'text-fg-muted hover:bg-surface-raised/40 hover:text-fg'}
                    `}
                  >
                    {/* Active marker: a rule the eye can find without relying on
                        the fill alone. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full ${
                        activeTab === tab.id ? 'bg-accent-bright' : 'bg-transparent'
                      }`}
                    />
                    <span aria-hidden="true" className={activeTab === tab.id ? 'text-fg' : 'text-fg-subtle'}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Logout */}
          <div className="border-t border-line/30 p-3">
            <Button unstyled
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors duration-fast hover:bg-danger-950/40 hover:text-danger-bright"
            >
              <FiLogOut aria-hidden="true" size={18} />
              <span>Sign out</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-screen min-w-0 flex-1">
          {/* Desktop Header. Sticky, because the admin scrolls long reservation
              lists and otherwise loses track of which section is open. */}
          <div className="sticky top-0 z-30 hidden h-16 border-b border-line/30 bg-canvas/80 backdrop-blur-md lg:block">
            <div className="flex h-full items-center justify-between gap-4 px-6 xl:px-8">
              <h1 className="font-heading text-xl tracking-wide text-fg">
                {currentTab?.label || "Dashboard"}
              </h1>
              <p className="truncate text-sm text-fg-muted">
                Signed in as {user.email}
              </p>
            </div>
          </div>

          {/* Content Area. Capped so a three-card row and a form do not stretch
              across a 1920px display with the eye travelling half a metre
              between a label and its value. */}
          <div className="mx-auto max-w-6xl p-4 pb-safe lg:p-8">
            <TabContent tab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
} 
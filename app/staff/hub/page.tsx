"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Reservation } from "@/types/reservation";
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiXCircle,
  FiChevronDown,
  FiSearch,
  FiRefreshCw,
  FiLogOut,
  FiCamera,
  FiUser,
  FiPhone,
  FiMail,
  FiX,
} from "react-icons/fi";
import { BiTable } from "react-icons/bi";

/* ───── Types ─────────────────────────────────────────── */

interface HubEvent {
  id: string;
  title: string;
  date: string;
}

interface HubTable {
  id: string;
  number: number;
  capacity: number;
  price: number;
  reserved: boolean;
  location: "left" | "right" | "center";
}

interface CheckInEntry {
  id: string;
  userName: string;
  tableNumber: number;
  guestCount: number;
  checkedInAt: string;
}

/* ───── Helpers ───────────────────────────────────────── */

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isTodayOrFuture(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

/* ───── Component ─────────────────────────────────────── */

export default function StaffHubPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Data
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<HubTable[]>([]);
  const [checkInFeed, setCheckInFeed] = useState<CheckInEntry[]>([]);

  // UI
  const [search, setSearch] = useState("");
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "confirmed" | "checked-in" | "pending" | "cancelled"
  >("all");

  // Audio ref for check-in chime
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCheckedInCount = useRef(0);

  /* ── Auth guard ── */
  useEffect(() => {
    if (
      !loading &&
      (!user || (user.role !== "admin" && user.role !== "promoter"))
    ) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  /* ── Load events ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as HubEvent))
        .filter((e) => isTodayOrFuture(e.date))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      setEvents(all);

      // Auto-select today's event or first upcoming
      if (!selectedEventId || !all.find((e) => e.id === selectedEventId)) {
        const todayEvent = all.find((e) => isToday(e.date));
        setSelectedEventId(todayEvent?.id ?? all[0]?.id ?? null);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Real-time reservations for selected event ── */
  useEffect(() => {
    if (!selectedEventId) {
      setReservations([]);
      return;
    }

    const q = query(
      collection(db, "reservations"),
      where("eventId", "==", selectedEventId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const res = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Reservation)
      );
      setReservations(res);

      // Detect new check-ins for the feed & audio
      const checkedIn = res.filter((r) => r.status === "checked-in");
      if (checkedIn.length > prevCheckedInCount.current && prevCheckedInCount.current > 0) {
        // Find the newest check-in
        const newest = checkedIn
          .filter((r) => r.checkedInAt)
          .sort(
            (a, b) =>
              new Date(b.checkedInAt!).getTime() -
              new Date(a.checkedInAt!).getTime()
          )[0];

        if (newest) {
          const entry: CheckInEntry = {
            id: newest.id,
            userName: newest.userName || "Guest",
            tableNumber: newest.tableNumber,
            guestCount: newest.guestCount,
            checkedInAt: newest.checkedInAt!,
          };
          setCheckInFeed((prev) => [entry, ...prev].slice(0, 50));

          // Play chime
          try {
            audioRef.current?.play();
          } catch {}

          toast.success(
            `${entry.userName} checked in — Table #${entry.tableNumber}`,
            { icon: "🎉", duration: 4000 }
          );
        }
      }
      prevCheckedInCount.current = checkedIn.length;
    });

    // Reset feed on event change
    setCheckInFeed([]);
    prevCheckedInCount.current = 0;

    return () => unsub();
  }, [selectedEventId]);

  /* ── Real-time tables for selected event ── */
  useEffect(() => {
    if (!selectedEventId) {
      setTables([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "events", selectedEventId, "tables"),
      (snap) => {
        const t = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as HubTable))
          .sort((a, b) => a.number - b.number);
        setTables(t);
      }
    );

    return () => unsub();
  }, [selectedEventId]);

  /* ── Derived stats ── */
  const activeReservations = reservations.filter(
    (r) => r.status !== "cancelled"
  );
  const confirmedCount = reservations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const checkedInCount = reservations.filter(
    (r) => r.status === "checked-in"
  ).length;
  const pendingCount = reservations.filter(
    (r) => r.status === "pending"
  ).length;
  const cancelledCount = reservations.filter(
    (r) => r.status === "cancelled"
  ).length;
  const totalGuests = activeReservations.reduce(
    (s, r) => s + (r.guestCount || 0),
    0
  );
  const checkedInGuests = reservations
    .filter((r) => r.status === "checked-in")
    .reduce((s, r) => s + (r.guestCount || 0), 0);
  const totalRevenue = activeReservations.reduce(
    (s, r) => s + (r.totalAmount || 0),
    0
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  /* ── Filtered reservations ── */
  const filtered = reservations
    .filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.userName || "").toLowerCase().includes(q) ||
          (r.userEmail || "").toLowerCase().includes(q) ||
          (r.userPhone || "").includes(q) ||
          String(r.tableNumber).includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Checked-in first, then confirmed, then pending, then cancelled
      const order: Record<string, number> = {
        "checked-in": 0,
        confirmed: 1,
        pending: 2,
        completed: 3,
        cancelled: 4,
      };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });

  /* ── Manual check-in ── */
  const handleManualCheckIn = async (reservation: Reservation) => {
    try {
      const res = await fetch(
        `/api/reservations/${reservation.id}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffName: user?.email?.split("@")[0] || "Staff Hub" }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Check-in failed");
        return;
      }
      toast.success(`${reservation.userName || "Guest"} checked in!`);
      setSelectedReservation(null);
    } catch {
      toast.error("Check-in failed");
    }
  };

  /* ── Table occupancy map ── */
  const reservedTableIds = new Set(
    activeReservations.map((r) => r.tableId)
  );
  const checkedInTableIds = new Set(
    reservations
      .filter((r) => r.status === "checked-in")
      .map((r) => r.tableId)
  );

  // Loading / auth states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-t-2 border-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "promoter")) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Hidden audio for check-in chime */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZaQgoJ8eX6EipKVkIiCfXl7goqSmJONh4F8eXuCipKYk42HgXx5e4KKkpiTjYeBfHl7goqSmJONh4F8eXuCipKYk42HgQ=="
        preload="auto"
      />

      {/* ─── Top Bar ─── */}
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Branding + event picker */}
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-bold tracking-wider"
              style={{ fontFamily: "Digital Dismay, sans-serif" }}
            >
              11:11
            </h1>
            <div className="h-6 w-px bg-zinc-700" />

            {/* Event selector */}
            <div className="relative">
              <button
                onClick={() => setShowEventPicker(!showEventPicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                <span className="max-w-[200px] truncate">
                  {selectedEvent?.title || "Select event"}
                </span>
                <FiChevronDown
                  className={`w-4 h-4 transition-transform ${showEventPicker ? "rotate-180" : ""}`}
                />
              </button>

              {showEventPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEventPicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                    {events.length === 0 && (
                      <p className="p-3 text-sm text-gray-500">
                        No upcoming events
                      </p>
                    )}
                    {events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setSelectedEventId(evt.id);
                          setShowEventPicker(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0 ${
                          evt.id === selectedEventId
                            ? "bg-zinc-800 text-cyan-400"
                            : "text-gray-300"
                        }`}
                      >
                        <div className="font-medium">{evt.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(evt.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          {isToday(evt.date) && (
                            <span className="ml-2 text-green-400 font-semibold">
                              TONIGHT
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedEvent && isToday(selectedEvent.date) && (
              <span className="px-2 py-0.5 bg-green-900/40 border border-green-700/50 rounded text-xs text-green-400 font-bold uppercase">
                Live
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/staff/scanner")}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-sm font-medium transition-colors"
            >
              <FiCamera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-red-700 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          <StatPill
            icon={<FiUsers className="w-3.5 h-3.5" />}
            label="Expected"
            value={`${totalGuests}`}
            color="text-blue-400"
          />
          <StatPill
            icon={<FiCheckCircle className="w-3.5 h-3.5" />}
            label="Checked In"
            value={`${checkedInGuests}/${totalGuests}`}
            color="text-green-400"
          />
          <StatPill
            icon={<BiTable className="w-3.5 h-3.5" />}
            label="Tables"
            value={`${activeReservations.length}/${tables.length}`}
            color="text-cyan-400"
          />
          <StatPill
            icon={<FiClock className="w-3.5 h-3.5" />}
            label="Pending"
            value={`${pendingCount}`}
            color="text-yellow-400"
          />
          <StatPill
            icon={<FiDollarSign className="w-3.5 h-3.5" />}
            label="Revenue"
            value={formatCurrency(totalRevenue)}
            color="text-emerald-400"
          />
        </div>
      </div>

      {/* ─── Main Content (3-column on landscape iPad, stacked on portrait) ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left: Reservation List */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-zinc-800">
          {/* Search + filter tabs */}
          <div className="shrink-0 px-4 pt-3 pb-2 space-y-2 bg-zinc-950/50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search name, email, phone, table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-cyan-600 focus:outline-none"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {(
                [
                  ["all", "All", null],
                  ["confirmed", "Confirmed", confirmedCount],
                  ["checked-in", "Checked In", checkedInCount],
                  ["pending", "Pending", pendingCount],
                  ["cancelled", "Cancelled", cancelledCount],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                  {count !== null && (
                    <span className="ml-1 opacity-70">{count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiUsers className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No reservations found</p>
              </div>
            )}
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onSelect={() => setSelectedReservation(r)}
                onQuickCheckIn={() => handleManualCheckIn(r)}
              />
            ))}
          </div>
        </div>

        {/* Center: Table Map */}
        <div className="hidden lg:flex flex-col w-[340px] border-r border-zinc-800">
          <div className="shrink-0 px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Table Map
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tables.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No tables configured
              </div>
            ) : (
              <TableMap
                tables={tables}
                reservedTableIds={reservedTableIds}
                checkedInTableIds={checkedInTableIds}
                reservations={reservations}
                onTableClick={(tableId) => {
                  const res = reservations.find(
                    (r) =>
                      r.tableId === tableId && r.status !== "cancelled"
                  );
                  if (res) setSelectedReservation(res);
                }}
              />
            )}
          </div>
          {/* Map legend */}
          <div className="shrink-0 px-4 py-2 border-t border-zinc-800 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-700 border border-zinc-600" />
              Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-900 border border-cyan-700" />
              Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-900 border border-green-600" />
              Arrived
            </span>
          </div>
        </div>

        {/* Right: Check-In Feed */}
        <div className="hidden lg:flex flex-col w-[280px]">
          <div className="shrink-0 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Live Check-Ins
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {checkInFeed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <FiCheckCircle className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Waiting for check-ins...</p>
                <p className="text-xs mt-1 text-gray-700">
                  Guests will appear here in real-time
                </p>
              </div>
            )}
            {checkInFeed.map((entry, i) => (
              <div
                key={`${entry.id}-${i}`}
                className="bg-green-950/30 border border-green-900/40 rounded-lg p-3 animate-fadeIn"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-300 text-sm">
                    {entry.userName}
                  </span>
                  <span className="text-xs text-green-600">
                    {formatTime(entry.checkedInAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-green-500/70">
                  <span className="flex items-center gap-1">
                    <BiTable className="w-3 h-3" /> #{entry.tableNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-3 h-3" /> {entry.guestCount} guests
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Reservation Detail Drawer ─── */}
      {selectedReservation && (
        <ReservationDrawer
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onCheckIn={() => handleManualCheckIn(selectedReservation)}
        />
      )}
    </div>
  );
}

/* ───── Sub-components ────────────────────────────────── */

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg whitespace-nowrap">
      <span className={color}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 leading-none">{label}</span>
        <span className={`text-sm font-bold ${color} leading-tight`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function ReservationCard({
  reservation,
  onSelect,
  onQuickCheckIn,
}: {
  reservation: Reservation;
  onSelect: () => void;
  onQuickCheckIn: () => void;
}) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    confirmed: {
      bg: "bg-cyan-950/40 border-cyan-800/40",
      text: "text-cyan-400",
      label: "Confirmed",
    },
    "checked-in": {
      bg: "bg-green-950/40 border-green-800/40",
      text: "text-green-400",
      label: "Checked In",
    },
    pending: {
      bg: "bg-yellow-950/40 border-yellow-800/40",
      text: "text-yellow-400",
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-950/30 border-red-900/30",
      text: "text-red-400",
      label: "Cancelled",
    },
    completed: {
      bg: "bg-zinc-900 border-zinc-700",
      text: "text-gray-400",
      label: "Completed",
    },
  };

  const cfg = statusConfig[reservation.status] || statusConfig.completed;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all hover:brightness-110 active:scale-[0.99] ${cfg.bg}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">
            {reservation.userName || "Guest"}
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.text} bg-black/30`}
          >
            {cfg.label}
          </span>
        </div>
        <span className="text-lg font-bold text-gray-300">
          #{reservation.tableNumber}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiUsers className="w-3 h-3" /> {reservation.guestCount} guests
        </span>
        {reservation.totalAmount && (
          <span className="flex items-center gap-1">
            <FiDollarSign className="w-3 h-3" />
            {formatCurrency(reservation.totalAmount)}
          </span>
        )}
        {reservation.bottles && reservation.bottles.length > 0 && (
          <span className="text-gray-600">
            {reservation.bottles.length} bottle
            {reservation.bottles.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {reservation.status === "confirmed" && (
        <div className="mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickCheckIn();
            }}
            className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold rounded transition-colors"
          >
            Check In
          </button>
        </div>
      )}
    </button>
  );
}

function TableMap({
  tables,
  reservedTableIds,
  checkedInTableIds,
  reservations,
  onTableClick,
}: {
  tables: HubTable[];
  reservedTableIds: Set<string>;
  checkedInTableIds: Set<string>;
  reservations: Reservation[];
  onTableClick: (tableId: string) => void;
}) {
  const leftTables = tables.filter((t) => t.location === "left");
  const centerTables = tables.filter((t) => t.location === "center");
  const rightTables = tables.filter((t) => t.location === "right");

  const getTableColor = (table: HubTable) => {
    if (checkedInTableIds.has(table.id))
      return "bg-green-900/60 border-green-600 shadow-green-900/50 shadow-lg";
    if (reservedTableIds.has(table.id))
      return "bg-cyan-900/40 border-cyan-700";
    return "bg-zinc-800/60 border-zinc-600";
  };

  const getGuestName = (table: HubTable) => {
    const res = reservations.find(
      (r) => r.tableId === table.id && r.status !== "cancelled"
    );
    return res?.userName?.split(" ")[0] || null;
  };

  const renderTable = (table: HubTable) => (
    <button
      key={table.id}
      onClick={() => onTableClick(table.id)}
      className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all hover:brightness-125 active:scale-95 ${getTableColor(table)}`}
    >
      <span className="text-sm font-bold text-white">{table.number}</span>
      <span className="text-[9px] text-gray-400">{table.capacity}p</span>
      {getGuestName(table) && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-cyan-300 bg-black/80 px-1 rounded truncate max-w-[60px]">
          {getGuestName(table)}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Stage */}
      <div className="text-center">
        <div className="inline-block px-8 py-1.5 bg-zinc-800 border border-zinc-600 rounded-full text-xs text-gray-400 uppercase tracking-widest">
          Stage / DJ
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        {/* Left section */}
        {leftTables.length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <span className="text-[10px] text-gray-600 uppercase">Left</span>
            <div className="grid grid-cols-2 gap-2">
              {leftTables.map(renderTable)}
            </div>
          </div>
        )}

        {/* Center section */}
        {centerTables.length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <span className="text-[10px] text-gray-600 uppercase">
              Center
            </span>
            <div className="grid grid-cols-2 gap-2">
              {centerTables.map(renderTable)}
            </div>
          </div>
        )}

        {/* Right section */}
        {rightTables.length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <span className="text-[10px] text-gray-600 uppercase">Right</span>
            <div className="grid grid-cols-2 gap-2">
              {rightTables.map(renderTable)}
            </div>
          </div>
        )}
      </div>

      {/* If no location data, just render all */}
      {leftTables.length === 0 &&
        centerTables.length === 0 &&
        rightTables.length === 0 && (
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            {tables.map(renderTable)}
          </div>
        )}

      {/* Dance floor */}
      <div className="text-center">
        <div className="inline-block px-6 py-3 border border-zinc-800 border-dashed rounded-xl text-xs text-gray-600 uppercase tracking-widest">
          Dance Floor
        </div>
      </div>
    </div>
  );
}

function ReservationDrawer({
  reservation,
  onClose,
  onCheckIn,
}: {
  reservation: Reservation;
  onClose: () => void;
  onCheckIn: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col animate-slideInRight overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Reservation Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status banner */}
          <div
            className={`p-3 rounded-lg border ${
              reservation.status === "checked-in"
                ? "bg-green-950/30 border-green-800/40"
                : reservation.status === "confirmed"
                  ? "bg-cyan-950/30 border-cyan-800/40"
                  : reservation.status === "pending"
                    ? "bg-yellow-950/30 border-yellow-800/40"
                    : "bg-red-950/30 border-red-900/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {reservation.status === "checked-in" ? (
                <FiCheckCircle className="w-5 h-5 text-green-400" />
              ) : reservation.status === "cancelled" ? (
                <FiXCircle className="w-5 h-5 text-red-400" />
              ) : (
                <FiClock className="w-5 h-5 text-cyan-400" />
              )}
              <span className="font-semibold text-sm capitalize">
                {reservation.status}
              </span>
              {reservation.checkedInAt && (
                <span className="text-xs text-gray-500 ml-auto">
                  {formatTime(reservation.checkedInAt)}
                </span>
              )}
            </div>
          </div>

          {/* Guest info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Guest
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FiUser className="w-4 h-4 text-gray-500" />
                <span className="text-white">
                  {reservation.userName || "N/A"}
                </span>
              </div>
              {reservation.userEmail && (
                <div className="flex items-center gap-3">
                  <FiMail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300 text-sm">
                    {reservation.userEmail}
                  </span>
                </div>
              )}
              {reservation.userPhone && (
                <div className="flex items-center gap-3">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${reservation.userPhone}`}
                    className="text-cyan-400 text-sm underline"
                  >
                    {reservation.userPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Table info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Table
            </h3>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold text-white">
                  #{reservation.tableNumber}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <FiUsers className="w-4 h-4" />
                  {reservation.guestCount} guests
                </div>
                {reservation.totalAmount && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FiDollarSign className="w-4 h-4" />
                    {formatCurrency(reservation.totalAmount)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottles */}
          {reservation.bottles && reservation.bottles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bottles
              </h3>
              <div className="space-y-1">
                {reservation.bottles.map((b, i) => (
                  <div
                    key={i}
                    className="text-sm text-gray-300 py-1 border-b border-zinc-800 last:border-0"
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reservation meta */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Details
            </h3>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                ID:{" "}
                <span className="font-mono text-gray-400">
                  {reservation.id}
                </span>
              </div>
              <div>
                Created:{" "}
                <span className="text-gray-400">
                  {new Date(reservation.createdAt).toLocaleString()}
                </span>
              </div>
              {reservation.checkedInBy && (
                <div>
                  Checked in by:{" "}
                  <span className="text-gray-400">
                    {reservation.checkedInBy}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 p-5 border-t border-zinc-800 space-y-2">
          {reservation.status === "confirmed" && (
            <button
              onClick={onCheckIn}
              className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <FiCheckCircle className="w-5 h-5" />
              Check In Guest
            </button>
          )}
          {reservation.userPhone && (
            <a
              href={`tel:${reservation.userPhone}`}
              className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-sm transition-colors text-center"
            >
              Call Guest
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-gray-400 font-medium rounded-lg text-sm transition-colors border border-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

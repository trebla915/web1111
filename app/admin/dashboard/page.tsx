"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiHome, FiPlus, FiEdit, FiUsers, FiCalendar, FiBookmark, FiDribbble, FiBell, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import CreateEventTab from "../components/CreateEventTab";
import EditEventsTab from "../components/EditEventsTab";
import ManageReservationsTab from "../components/ManageReservationsTab";
import AddBottleToCatalogTab from "../components/AddBottleToCatalogTab";
import AddBottlesToEventTab from "../components/AddBottlesToEventTab";
import PushNotificationsTab from "../components/PushNotificationsTab";
import Image from "next/image";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    console.log('Admin dashboard - Current user:', user);
    console.log('Admin dashboard - Loading state:', loading);
    
    // Redirect if not authenticated or not an admin/promoter
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'promoter'))) {
      console.log('User not authorized for admin dashboard:', { 
        user: user?.email, 
        role: user?.role 
      });
      router.replace("/dashboard");
      return;
    }
    
    // Close sidebar on mobile by default
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, user, router]);

  // Tabs configuration
  const tabs = [
    { id: "Dashboard", label: "Dashboard", icon: <FiHome size={20} /> },
    { id: "CreateEvent", label: "Create Event", icon: <FiPlus size={20} /> },
    { id: "EditEvents", label: "Edit Events", icon: <FiEdit size={20} /> },
    { id: "ManageUsers", label: "Manage Users", icon: <FiUsers size={20} /> },
    { id: "ManageReservations", label: "Manage Reservations", icon: <FiCalendar size={20} /> },
    { id: "AddBottleToCatalog", label: "Add to Catalog", icon: <FiBookmark size={20} /> },
    { id: "AddBottlesToEvent", label: "Event Bottles", icon: <FiDribbble size={20} /> },
    { id: "PushNotifications", label: "Notifications", icon: <FiBell size={20} /> },
  ];

  // Tab content components
  const TabContent = ({ tab }: { tab: string }) => {
    switch (tab) {
      case "Dashboard":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300">Admin Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 p-6 rounded-lg border border-cyan-900/30 relative overflow-hidden group hover:border-cyan-700/50 transition-all duration-300">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-2 text-white">Events</h3>
                  <p className="text-3xl font-bold text-cyan-400 digital-glow-soft">12</p>
                  <p className="text-gray-400 mt-2">Upcoming events</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              <div className="bg-zinc-900 p-6 rounded-lg border border-cyan-900/30 relative overflow-hidden group hover:border-cyan-700/50 transition-all duration-300">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-2 text-white">Users</h3>
                  <p className="text-3xl font-bold text-cyan-400 digital-glow-soft">342</p>
                  <p className="text-gray-400 mt-2">Registered users</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              <div className="bg-zinc-900 p-6 rounded-lg border border-cyan-900/30 relative overflow-hidden group hover:border-cyan-700/50 transition-all duration-300">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-2 text-white">Reservations</h3>
                  <p className="text-3xl font-bold text-cyan-400 digital-glow-soft">56</p>
                  <p className="text-gray-400 mt-2">Pending reservations</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          </div>
        );
      case "CreateEvent":
        return <CreateEventTab />;
      case "EditEvents":
        return <EditEventsTab />;
      case "ManageReservations":
        return <ManageReservationsTab />;
      case "ManageUsers":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-cyan-300">Manage Users</h2>
            <p>User management interface will be implemented here.</p>
          </div>
        );
      case "AddBottleToCatalog":
        return <AddBottleToCatalogTab />;
      case "AddBottlesToEvent":
        return <AddBottlesToEventTab eventId={selectedEventId || ""} />;
      case "PushNotifications":
        return <PushNotificationsTab />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user or wrong role (will redirect in useEffect)
  if (!user || (user.role !== 'admin' && user.role !== 'promoter')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-cyan-900/30 bg-zinc-950">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-full bg-zinc-900 border border-cyan-700/40"
        >
          {sidebarOpen ? <FiX className="text-cyan-400" /> : <FiMenu className="text-cyan-400" />}
        </button>
        <div className="text-xl font-bold text-cyan-400 digital-glow-soft" style={{ fontFamily: 'Digital Dismay, sans-serif' }}>
          11:11 ADMIN
        </div>
        <div className="px-2 py-1 rounded-full bg-gradient-to-r from-red-700/60 to-red-600/40 text-xs font-bold">
          {user.role.toUpperCase()}
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-40 md:z-auto transition-transform duration-300 
        w-72 min-h-screen border-r border-cyan-900/30 bg-zinc-950 backdrop-blur-lg overflow-y-auto
      `}>
        {/* Sidebar Header - Logo */}
        <div className="hidden md:flex items-center justify-center py-7 px-4 border-b border-cyan-900/30">
          <div className="text-2xl font-bold text-cyan-400 digital-glow-soft" style={{ fontFamily: 'Digital Dismay, sans-serif' }}>
            11:11 ADMIN
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-b border-cyan-900/30 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-cyan-600 overflow-hidden mb-3 flex items-center justify-center bg-zinc-900">
            <div className="text-5xl text-cyan-400">
              {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-white mb-1">{user.email?.split('@')[0]}</div>
            <div className="px-2 py-1 bg-gradient-to-r from-red-700/60 to-red-600/40 rounded-full text-xs inline-block">
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="py-4">
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id} className="mb-1">
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    flex items-center gap-3 w-full px-6 py-3 transition-all duration-300 relative
                    ${activeTab === tab.id 
                      ? 'text-white bg-cyan-950/30 border-r-2 border-cyan-400 digital-glow-soft-right' 
                      : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-900/10'}
                  `}
                >
                  <span className={`${activeTab === tab.id ? 'text-cyan-300' : 'text-gray-500'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
            
            {/* Logout Button */}
            <li className="mt-6">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-6 py-3 text-red-400 hover:bg-red-900/10 transition-colors"
              >
                <FiLogOut size={20} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500 border-t border-cyan-900/30">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Return to Website
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-0' : 'md:ml-0'}`}>
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Content Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-cyan-900/30 bg-zinc-950/90">
          <h1 className="text-2xl font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-cyan-600/30 bg-cyan-900/10 hover:bg-cyan-800/20 text-cyan-400 rounded transition-colors"
          >
            Member Dashboard
          </Link>
        </div>
        
        {/* Content Area - Contains the active tab */}
        <div className="p-4">
          <div className="bg-zinc-950/30 rounded-lg border border-cyan-900/20 shadow-lg shadow-black/30 min-h-[calc(100vh-10rem)] relative">
            <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
            <div className="relative z-10">
              <TabContent tab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
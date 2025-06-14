"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiHome, FiPlus, FiEdit, FiUsers, FiCalendar, FiBookmark, FiDribbble, FiBell, FiLogOut, FiMenu, FiX, FiChevronDown, FiClock } from "react-icons/fi";
import CreateEventTab from "../components/CreateEventTab";
import EditEventsTab from "../components/EditEventsTab";
import ManageReservationsTab from "../components/ManageReservationsTab";
import AddBottleToCatalogTab from "../components/AddBottleToCatalogTab";
import AddBottlesToEventTab from "../components/AddBottlesToEventTab";
import PushNotificationsTab from "../components/PushNotificationsTab";
import StaffScheduleTab from "../components/StaffScheduleTab";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    
    // Handle responsive sidebar behavior
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setMobileMenuOpen(false);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, user, router]);

  // Tabs configuration with better mobile labels
  const tabs = [
    { id: "Dashboard", label: "Dashboard", mobileLabel: "Home", icon: <FiHome size={20} /> },
    { id: "CreateEvent", label: "Create Event", mobileLabel: "Create", icon: <FiPlus size={20} /> },
    { id: "EditEvents", label: "Edit Events", mobileLabel: "Edit", icon: <FiEdit size={20} /> },
    { id: "ManageUsers", label: "Manage Users", mobileLabel: "Users", icon: <FiUsers size={20} /> },
    { id: "ManageReservations", label: "Reservations", mobileLabel: "Bookings", icon: <FiCalendar size={20} /> },
    { id: "StaffSchedule", label: "Staff Schedule", mobileLabel: "Schedule", icon: <FiClock size={20} /> },
    { id: "AddBottleToCatalog", label: "Add to Catalog", mobileLabel: "Catalog", icon: <FiBookmark size={20} /> },
    { id: "AddBottlesToEvent", label: "Event Bottles", mobileLabel: "Bottles", icon: <FiDribbble size={20} /> },
    { id: "PushNotifications", label: "Notifications", mobileLabel: "Notify", icon: <FiBell size={20} /> },
  ];

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Tab content components
  const TabContent = ({ tab }: { tab: string }) => {
    switch (tab) {
      case "Dashboard":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Dashboard Overview</h2>
              <div className="text-sm text-gray-400">Welcome back, {user?.email?.split('@')[0]}</div>
            </div>
            
            {/* Mobile-first stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-zinc-900 p-4 lg:p-6 rounded-lg border border-gray-700/30 relative overflow-hidden group hover:border-gray-600/50 transition-all duration-300">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 text-white">Events</h3>
                  <p className="text-2xl lg:text-3xl font-bold text-white">12</p>
                  <p className="text-gray-400 mt-2 text-sm lg:text-base">Upcoming events</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              
              <div className="bg-zinc-900 p-4 lg:p-6 rounded-lg border border-gray-700/30 relative overflow-hidden group hover:border-gray-600/50 transition-all duration-300">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 text-white">Users</h3>
                  <p className="text-2xl lg:text-3xl font-bold text-white">342</p>
                  <p className="text-gray-400 mt-2 text-sm lg:text-base">Registered users</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
              
              <div className="bg-zinc-900 p-4 lg:p-6 rounded-lg border border-gray-700/30 relative overflow-hidden group hover:border-gray-600/50 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 noise opacity-5"></div>
                <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 text-white">Reservations</h3>
                  <p className="text-2xl lg:text-3xl font-bold text-white">56</p>
                  <p className="text-gray-400 mt-2 text-sm lg:text-base">Pending reservations</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className="bg-zinc-900 p-4 lg:p-6 rounded-lg border border-gray-700/30">
              <h3 className="text-lg lg:text-xl font-semibold mb-4 text-white">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tabs.slice(1, 5).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center gap-2 p-3 lg:p-4 bg-zinc-800 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 hover:bg-zinc-700"
                  >
                    <span className="text-white">{tab.icon}</span>
                    <span className="text-xs lg:text-sm text-gray-300 text-center">{tab.mobileLabel}</span>
                  </button>
                ))}
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
      case "StaffSchedule":
        return <StaffScheduleTab />;
      case "ManageUsers":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">Manage Users</h2>
            <div className="bg-zinc-900 p-4 lg:p-6 rounded-lg border border-gray-700/30">
              <p className="text-gray-400">User management interface will be implemented here.</p>
            </div>
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user or wrong role (will redirect in useEffect)
  if (!user || (user.role !== 'admin' && user.role !== 'promoter')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-center">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header - Always visible on mobile */}
      <div className="lg:hidden sticky top-0 z-50 bg-zinc-950 border-b border-gray-700/30 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-gray-600/40 hover:border-gray-500 transition-colors"
          >
            {mobileMenuOpen ? <FiX className="text-white" size={20} /> : <FiMenu className="text-white" size={20} />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-white" style={{ fontFamily: 'Digital Dismay, sans-serif' }}>
              11:11
            </div>
            <div className="px-2 py-1 rounded-full bg-gradient-to-r from-red-700/60 to-red-600/40 text-xs font-bold">
              {user.role.toUpperCase()}
            </div>
          </div>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-red-900/20 border border-red-700/40 hover:border-red-600 transition-colors"
          >
            <FiLogOut className="text-red-400" size={18} />
          </button>
        </div>

        {/* Mobile Current Tab Indicator */}
        <div className="px-4 pb-3">
          <div className="text-sm text-white font-medium">{currentTab?.label}</div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-zinc-950 border-r border-gray-700/30 overflow-y-auto animate-slideIn">
            {/* Mobile Menu Header */}
            <div className="p-6 border-b border-gray-700/30">
              {/* User Profile - Mobile */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-gray-600 overflow-hidden flex items-center justify-center bg-zinc-900">
                  <div className="text-2xl text-white">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{user.email?.split('@')[0]}</div>
                  <div className="px-2 py-1 bg-gradient-to-r from-red-700/60 to-red-600/40 rounded-full text-xs inline-block">
                    {user.role.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <div className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200
                        ${activeTab === tab.id 
                          ? 'text-white bg-gray-800/50 border border-gray-600/50 digital-glow-soft' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/20 border border-transparent'}
                      `}
                    >
                      <span className={`${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                        {tab.icon}
                      </span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className={`
          hidden lg:flex flex-col w-80 min-h-screen border-r border-gray-700/30 bg-zinc-950 backdrop-blur-lg
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300
        `}>
          {/* Desktop Header */}
          <div className="py-4 px-6 border-b border-gray-700/30">
          </div>
          
          {/* Desktop User Profile */}
          <div className="p-6 border-b border-gray-700/30 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-2 border-gray-600 overflow-hidden mb-4 flex items-center justify-center bg-zinc-900">
              <div className="text-4xl text-white">
                {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white mb-2">{user.email?.split('@')[0]}</div>
              <div className="px-3 py-1 bg-gradient-to-r from-red-700/60 to-red-600/40 rounded-full text-sm inline-block">
                {user.role.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="flex-1 py-6 overflow-y-auto">
            <ul className="px-4 space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-4 w-full px-6 py-4 rounded-lg transition-all duration-200 relative
                      ${activeTab === tab.id 
                        ? 'text-white bg-gray-800/30 border border-gray-600/50 digital-glow-soft' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/20 border border-transparent'}
                    `}
                  >
                    <span className={`${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Desktop Logout */}
            <div className="px-4 mt-8">
              <button
                onClick={logout}
                className="flex items-center gap-4 w-full px-6 py-4 text-red-400 hover:bg-red-900/10 rounded-lg transition-colors border border-transparent hover:border-red-700/40"
              >
                <FiLogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Desktop Header */}
          <div className="hidden lg:block h-20 border-b border-gray-700/30 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between h-full px-8">
              <h1 className="text-2xl font-bold text-white">
                {currentTab?.label || "Dashboard"}
              </h1>
              <div className="text-gray-400">
                Welcome back, {user.email?.split('@')[0]}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-8 pb-safe">
            <TabContent tab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
} 
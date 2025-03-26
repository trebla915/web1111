"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { checkUserRoleByEmail, setUserRole } from "@/lib/services/users";
import { useRouter } from "next/navigation";
import CookiesSection from './CookiesSection';
import TokenDisplay from './TokenDisplay';

export default function DebugPage() {
  const { user, loading } = useAuth();
  const [firestoreRole, setFirestoreRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState(false);
  const router = useRouter();

  // Check the user's role in Firestore directly
  const verifyRoleInFirestore = async () => {
    if (user?.email) {
      setIsChecking(true);
      try {
        const role = await checkUserRoleByEmail(user.email);
        setFirestoreRole(role);
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setIsChecking(false);
      }
    }
  };

  // Set the user's role manually
  const changeUserRole = async (newRole: 'user' | 'admin' | 'promoter') => {
    if (!user) return;
    
    setIsSettingRole(true);
    try {
      await setUserRole(user.uid, newRole);
      setFirestoreRole(newRole);
      alert(`Role set to ${newRole}. Please refresh or re-login for changes to take effect.`);
    } catch (error) {
      console.error("Error setting role:", error);
      alert("Failed to set role. See console for details.");
    } finally {
      setIsSettingRole(false);
    }
  };

  useEffect(() => {
    // Auto-check when user is loaded
    if (user?.email && !firestoreRole && !isChecking) {
      verifyRoleInFirestore();
    }
  }, [user, firestoreRole, isChecking]);

  // Add a function to read and parse cookies
  const getCookies = () => {
    const cookies: Record<string, string> = {};
    
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) cookies[name] = decodeURIComponent(value);
    });
    
    return cookies;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Debug Page</h1>
      
      {/* User Info Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">User Information</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          {loading ? (
            <div className="animate-pulse">Loading user data...</div>
          ) : user ? (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">User from Auth Context:</h2>
                <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Role Verification:</h2>
                <p className="mb-4">
                  <strong>Context Role:</strong> {user.role || "No role in context"}
                </p>
                <p className="mb-4">
                  <strong>Firestore Role:</strong>{" "}
                  {isChecking 
                    ? "Checking..." 
                    : firestoreRole 
                      ? firestoreRole 
                      : "Not checked yet"}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={verifyRoleInFirestore}
                    disabled={isChecking}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isChecking ? "Checking..." : "Verify Role in Firestore"}
                  </button>
                  
                  <button
                    onClick={() => changeUserRole('user')}
                    disabled={isSettingRole}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Set as User
                  </button>
                  
                  <button
                    onClick={() => changeUserRole('admin')}
                    disabled={isSettingRole}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Set as Admin
                  </button>
                  
                  <button
                    onClick={() => changeUserRole('promoter')}
                    disabled={isSettingRole}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Set as Promoter
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Navigation:</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="/dashboard" 
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-center"
                  >
                    Go to Member Dashboard
                  </a>
                  <a 
                    href="/admin/dashboard" 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-center"
                  >
                    Go to Admin Dashboard
                  </a>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      // Force reload to clear everything
                      window.location.href = "/";
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-center"
                  >
                    Clear Storage & Reload
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 p-6 rounded-lg">
              <p>No user is logged in.</p>
              <a 
                href="/auth/login" 
                className="inline-block mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </section>
      
      {/* Cookies Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Cookies</h2>
        <CookiesSection />
      </section>
      
      {/* Token Display Section - only show if user is logged in */}
      {user && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Push Notification Tokens</h2>
          <TokenDisplay />
        </section>
      )}
      
      {/* Role Management Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Role Management</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          {/* ... existing role management code ... */}
        </div>
      </section>
    </div>
  );
} 
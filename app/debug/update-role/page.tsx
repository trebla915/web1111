"use client";

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function UpdateRolePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const updateRole = async (role: 'admin' | 'promoter' | 'user') => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/debug/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          role
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage(`Role updated to ${role}`);
        // Force a page reload to update the auth state
        window.location.reload();
      } else {
        setMessage('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in first</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Update User Role</h1>
      <div className="mb-4">
        <p>Current user: {user.email}</p>
        <p>Current role: {user.role || 'none'}</p>
      </div>
      <div className="space-x-4">
        <button
          onClick={() => updateRole('admin')}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          Set as Admin
        </button>
        <button
          onClick={() => updateRole('promoter')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          Set as Promoter
        </button>
        <button
          onClick={() => updateRole('user')}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded disabled:opacity-50"
        >
          Set as User
        </button>
      </div>
      {message && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
} 
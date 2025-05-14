"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </div>
  );
} 
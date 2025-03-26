"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from 'next/link';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the actual login function from AuthProvider
      await login(email, password);
      
      // Call onSuccess callback if provided to close modal
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigation will be handled in the AuthProvider login function
    } catch (error: any) {
      // Error is already handled in the login function
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Set guest mode in localStorage
    localStorage.setItem('guestMode', 'true');
    
    // Show success message
    toast.success('Logged in as guest');
    
    // Call onSuccess to close modal
    if (onSuccess) {
      onSuccess();
    }
    
    // Reload page to apply guest mode
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-cyan-500 focus:border-cyan-500"
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-cyan-500 focus:border-cyan-500"
          placeholder="••••••••"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="text-cyan-400 hover:text-cyan-300">
            Forgot your password?
          </Link>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition duration-150 ease-in-out ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
      
      <div className="text-center mt-4">
        <span className="text-gray-400">Don't have an account?</span>{' '}
        <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300">
          Sign up
        </Link>
      </div>
      
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={handleGuestMode}
          className="w-full py-2 px-4 border border-gray-700 rounded bg-transparent text-white hover:bg-gray-800 transition duration-150 ease-in-out"
        >
          Guest Mode
        </button>
      </div>
    </form>
  );
} 
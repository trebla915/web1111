"use client";

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      onClose(); // Close the modal on successful login
    } catch (err) {
      setError("Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-lg">
      {/* Modal Content */}
      <div className="bg-black text-white p-10 rounded-xl shadow-xl relative w-[80%] max-w-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-4xl"
        >
          &times;
        </button>

        {/* Modal Header */}
        <h2 className="text-3xl font-bold text-center mb-8">Login</h2>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 bg-red-800 p-6 rounded text-center mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-4">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-8 py-4 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500 text-xl"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-4">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-8 py-4 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500 text-xl"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-lg ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>,
    document.body // Render the modal into <body>
  );
};

export default LoginModal;
"use client";

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function EventNotFound() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Link href="/events" className="flex items-center text-white hover:text-white/80 mb-8">
        <FiArrowLeft className="mr-2" /> BACK TO EVENTS
      </Link>
      <div className="bg-red-900/30 text-red-200 p-8 rounded-lg text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p>Sorry, we couldn't find the event you're looking for.</p>
        <Link href="/events" className="inline-block mt-6 bg-white hover:bg-white/90 text-black px-6 py-2 rounded-lg transition-colors">
          VIEW ALL EVENTS
        </Link>
      </div>
    </div>
  );
} 
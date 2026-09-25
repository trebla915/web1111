"use client";

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export default function EventNotFound() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Link href="/events" className="flex items-center text-fg hover:text-fg/80 mb-8">
        <FiArrowLeft className="mr-2" /> BACK TO EVENTS
      </Link>
      <div className="bg-danger-900/30 text-danger-200 p-8 rounded-lg text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p>Sorry, we couldn't find the event you're looking for.</p>
        <Button asChild variant="primary" className="mt-6">
          <Link href="/events">
            VIEW ALL EVENTS
          </Link>
        </Button>
      </div>
    </div>
  );
} 
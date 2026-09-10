"use client";

import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import EventsFestivalSection from '@/components/sections/EventsFestivalSection';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          {/* Was `text-9xl` — a 128px word occupying most of the first viewport
              above a list the visitor came to read. Still the loudest thing on
              the page, no longer the only thing on it. */}
          <h1 className="mb-8 text-center font-heading text-6xl text-accent-400 md:text-8xl">
            MUSIC
          </h1>

          {/* Search bar.
              This box was wired to nothing: `searchQuery` was stored and never
              read, so typing in it filtered no events — a control that looks
              like it works and doesn't is worse than no control. It also had no
              label, and its clear affordance was a bare `<FiX onClick>` that no
              keyboard could reach. */}
          <div className="mx-auto mb-12 max-w-xl">
            <Label htmlFor="event-search" className="sr-only">
              Search events
            </Label>
            <div className="relative">
              <Input
                id="event-search"
                type="search"
                placeholder="Search events by name or venue"
                value={searchQuery}
                onChange={handleSearch}
                leadingIcon={<FiSearch aria-hidden="true" className="h-4 w-4" />}
                className={searchQuery ? 'pr-12' : undefined}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-0"
                >
                  <FiX aria-hidden="true" size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        <EventsFestivalSection
          title="ALL EVENTS"
          className="pt-0"
          query={searchQuery}
        />
      </div>
    </div>
  );
}

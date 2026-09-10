"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiSearch, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { BottleService } from "@/lib/services/bottles";
import { Bottle } from '@/types/reservation';
import EventPicker from "./EventPicker";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface AddBottlesToEventTabProps {
  eventId?: string;
}

export default function AddBottlesToEventTab({ eventId: initialEventId }: AddBottlesToEventTabProps) {
  const [eventId, setEventId] = useState(initialEventId || "");
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [selectedBottles, setSelectedBottles] = useState<Bottle[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setAvailableBottles([]);
      setSelectedBottles([]);
      return;
    }

    const loadBottles = async () => {
      try {
        setLoading(true);
        const bottles = await BottleService.getByEvent(eventId);
        setAvailableBottles(bottles);
        setSelectedBottles([]);
      } catch (error) {
        console.error("Error loading bottles:", error);
        toast.error("Failed to load bottles for this event.");
      } finally {
        setLoading(false);
      }
    };

    loadBottles();
  }, [eventId]);

  const filteredBottles = availableBottles.filter(bottle =>
    bottle.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddBottle = (bottle: Bottle) => {
    setSelectedBottles([...selectedBottles, bottle]);
    setAvailableBottles(availableBottles.filter(b => b.id !== bottle.id));
  };

  const handleRemoveBottle = (bottle: Bottle) => {
    setSelectedBottles(selectedBottles.filter(b => b.id !== bottle.id));
    setAvailableBottles([...availableBottles, bottle]);
  };

  const handleSave = async () => {
    try {
      await BottleService.addToEvent(eventId, selectedBottles);
      toast.success('Bottles added successfully');
      setSelectedBottles([]);
      // Reload available bottles
      const bottles = await BottleService.getByEvent(eventId);
      setAvailableBottles(bottles);
    } catch (error) {
      console.error('Error adding bottles:', error);
      toast.error('Failed to add bottles');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-fg">Event Bottles</h2>
        <div className="text-sm text-fg-muted">Assign catalog bottles to an event</div>
      </div>

      {/* Event Selector */}
      <Card padding="lg" className="bg-surface/50">
        <EventPicker value={eventId} onChange={setEventId} label="Select event" />
      </Card>

      {!eventId ? (
        <EmptyState
          title="No event selected"
          description="Choose an event above to manage its bottles."
        />
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" className="text-accent-500" />
        </div>
      ) : (
        <>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-accent-600" />
        </div>
        <Input
          type="text"
          className="p-3 pl-10 bg-surface-raised border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50 text-base lg:text-sm"
          placeholder="Search bottles..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Available Bottles */}
      <div>
        <h3 className="text-lg font-bold text-fg mb-4">Available Bottles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBottles.map((bottle) => (
            <div
              key={bottle.id}
              className="bg-surface-raised rounded-lg p-4 flex justify-between items-center"
            >
              <div className="flex items-center space-x-4">
                <div className="relative h-16 w-16 flex-shrink-0 bg-canvas/30 rounded-md border border-accent-900/20 p-1">
                  <Image
                    src={bottle.imageUrl}
                    alt={bottle.name}
                    fill
                    className="rounded-md object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-fg">{bottle.name}</h4>
                  <p className="text-accent-400">${bottle.price.toFixed(2)}</p>
                </div>
              </div>
              <Button
                onClick={() => handleAddBottle(bottle)}
                variant="accent" size="md" className="p-2 bg-accent-600 rounded-full hover:bg-accent-700"
              >
                <FiPlus className="text-fg" size={20} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Bottles */}
      {selectedBottles.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-fg mb-4">Selected Bottles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBottles.map((bottle) => (
              <div
                key={bottle.id}
                className="bg-surface-raised rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 flex-shrink-0 bg-canvas/30 rounded-md border border-accent-900/20 p-1">
                    <Image
                      src={bottle.imageUrl}
                      alt={bottle.name}
                      fill
                      className="rounded-md object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-fg">{bottle.name}</h4>
                    <p className="text-accent-400">${bottle.price.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveBottle(bottle)}
                  variant="danger" size="md" className="p-2 bg-danger-600 rounded-full hover:bg-danger-700"
                >
                  <FiTrash2 className="text-fg" size={20} />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button
              onClick={handleSave}
              variant="accent" size="md" className="px-4 py-2 bg-accent-600 rounded-md hover:bg-accent-700 flex items-center space-x-2"
            >
              <FiSave size={20} />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
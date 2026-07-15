"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiSearch, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { BottleService } from "@/lib/services/bottles";
import { Bottle } from '@/types/reservation';
import EventPicker from "./EventPicker";

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
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Event Bottles</h2>
        <div className="text-sm text-gray-400">Assign catalog bottles to an event</div>
      </div>

      {/* Event Selector */}
      <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-4 lg:p-6">
        <EventPicker value={eventId} onChange={setEventId} label="Select event" />
      </div>

      {!eventId ? (
        <div className="text-center py-12 text-gray-400 bg-zinc-900/50 rounded-lg border border-cyan-900/30">
          <p>Select an event above to manage its bottles.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-cyan-600" />
        </div>
        <input
          type="text"
          className="w-full p-3 pl-10 bg-zinc-800 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-base lg:text-sm"
          placeholder="Search bottles..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Available Bottles */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Available Bottles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBottles.map((bottle) => (
            <div
              key={bottle.id}
              className="bg-zinc-800 rounded-lg p-4 flex justify-between items-center"
            >
              <div className="flex items-center space-x-4">
                <div className="relative h-16 w-16 flex-shrink-0 bg-black/30 rounded-md border border-cyan-900/20 p-1">
                  <Image
                    src={bottle.imageUrl}
                    alt={bottle.name}
                    fill
                    style={{objectFit: "contain"}}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white">{bottle.name}</h4>
                  <p className="text-cyan-400">${bottle.price.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddBottle(bottle)}
                className="p-2 bg-cyan-600 rounded-full hover:bg-cyan-700 transition-colors"
              >
                <FiPlus className="text-white" size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Bottles */}
      {selectedBottles.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Selected Bottles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBottles.map((bottle) => (
              <div
                key={bottle.id}
                className="bg-zinc-800 rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 flex-shrink-0 bg-black/30 rounded-md border border-cyan-900/20 p-1">
                    <Image
                      src={bottle.imageUrl}
                      alt={bottle.name}
                      fill
                      style={{objectFit: "contain"}}
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{bottle.name}</h4>
                    <p className="text-cyan-400">${bottle.price.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBottle(bottle)}
                  className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 className="text-white" size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center space-x-2"
            >
              <FiSave size={20} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
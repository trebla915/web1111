"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiSearch, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { BottleService } from "@/lib/services/backend/bottles";
import { Bottle } from '@/types/reservation';

interface AddBottlesToEventTabProps {
  eventId: string;
}

export default function AddBottlesToEventTab({ eventId }: AddBottlesToEventTabProps) {
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [selectedBottles, setSelectedBottles] = useState<Bottle[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBottles = async () => {
      try {
        setLoading(true);
        const bottles = await BottleService.getByEvent(eventId);
        setAvailableBottles(bottles);
      } catch (error) {
        console.error("Error loading bottles:", error);
        toast.error("Failed to load bottles for this event.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadBottles();
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-cyan-600" />
        </div>
        <input
          type="text"
          className="w-full p-3 pl-10 bg-zinc-800 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
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
    </div>
  );
} 
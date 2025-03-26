"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiSearch, FiX, FiCheck, FiPlus, FiCalendar, FiPackage, FiDollarSign, FiTrash2 } from "react-icons/fi";
import { fetchAllBottlesFromCatalog } from "@/lib/services/catalog";
import { fetchAllBottlesForEvent, addBottlesToEvent, deleteBottleFromEvent } from "@/lib/services/bottleService";
import { fetchAllEvents } from "@/lib/services/events";

interface BottleCatalog {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface EventBottle {
  id: string;
  name: string;
  price: number;
  eventId: string;
}

interface MergedBottle extends BottleCatalog {
  isInEvent: boolean;
  eventData?: EventBottle;
}

interface Event {
  id: string;
  title: string;
  date?: string;
}

export default function AddBottlesToEventTab() {
  const [catalogBottles, setCatalogBottles] = useState<BottleCatalog[]>([]);
  const [mergedBottles, setMergedBottles] = useState<MergedBottle[]>([]);
  const [filteredBottles, setFilteredBottles] = useState<MergedBottle[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal-specific state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<MergedBottle | null>(null);
  const [modalPrice, setModalPrice] = useState<string>("");

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const fetchedCatalog = await fetchAllBottlesFromCatalog();
        setCatalogBottles(fetchedCatalog);

        const fetchedEvents = await fetchAllEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error initializing data:", error);
        toast.error("Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAndMergeEventBottles(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredBottles(mergedBottles);
    } else {
      setFilteredBottles(
        mergedBottles.filter((bottle) =>
          bottle.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, mergedBottles]);

  const fetchAndMergeEventBottles = async (eventId: string) => {
    try {
      setLoading(true);
      const eventBottles = await fetchAllBottlesForEvent(eventId);

      const combinedBottles = catalogBottles.map((catalogBottle) => {
        const matchingEventBottle = eventBottles.find(
          (eventBottle) => eventBottle.id === catalogBottle.id
        );

        return {
          ...catalogBottle,
          isInEvent: !!matchingEventBottle,
          eventData: matchingEventBottle || undefined,
        };
      });

      setMergedBottles(combinedBottles);
      setFilteredBottles(combinedBottles);
    } catch (error) {
      console.error("Error fetching event bottles:", error);
      toast.error("Failed to load bottles for the selected event.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditBottle = (bottle: MergedBottle) => {
    setCurrentBottle(bottle);
    setModalPrice(bottle.eventData?.price?.toString() || "");
    setIsModalVisible(true);
  };

  const handleDeleteBottleFromEvent = async () => {
    if (!currentBottle || !selectedEventId) return;

    if (confirm(`Are you sure you want to remove ${currentBottle.name} from this event?`)) {
      try {
        setLoading(true);
        await deleteBottleFromEvent(selectedEventId, currentBottle.id);
        toast.success(`${currentBottle.name} removed from event!`);
        setIsModalVisible(false);
        await fetchAndMergeEventBottles(selectedEventId);
      } catch (error) {
        console.error("Error removing bottle from event:", error);
        toast.error(`Failed to remove ${currentBottle.name} from event.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateBottlePrice = async () => {
    if (!currentBottle || !selectedEventId || !modalPrice) {
      toast.error("Please fill in the price.");
      return;
    }

    if (isNaN(parseFloat(modalPrice))) {
      toast.error("Price must be a valid number.");
      return;
    }

    const updatedBottle = {
      id: currentBottle.id,
      name: currentBottle.name,
      price: parseFloat(modalPrice),
      eventId: selectedEventId,
    };

    try {
      setLoading(true);
      await addBottlesToEvent(selectedEventId, [updatedBottle]);
      toast.success("Bottle price updated!");
      setIsModalVisible(false);
      await fetchAndMergeEventBottles(selectedEventId);
    } catch (error) {
      console.error("Error updating bottle price:", error);
      toast.error("Failed to update the bottle price.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Add Bottles to Event</h2>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-16 h-16 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Event Selector */}
      <div className="mb-6 bg-zinc-900 border border-cyan-900/30 p-6 rounded-lg relative">
        <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
        <div className="relative z-10">
          <label htmlFor="eventSelect" className="flex items-center text-sm font-medium mb-2 text-cyan-200">
            <FiCalendar className="mr-2 text-cyan-500" />
            Select Event
          </label>
          <select
            id="eventSelect"
            className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select an Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEventId && (
        <>
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-cyan-600" />
            </div>
            <input
              type="text"
              className="w-full p-3 pl-10 bg-zinc-900 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              placeholder="Search bottles..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Bottles List Header */}
          <div className="flex items-center mb-4">
            <FiPackage className="text-cyan-500 mr-2" />
            <h3 className="text-lg font-medium text-cyan-200">Available Bottles</h3>
          </div>

          {/* Bottles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBottles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400 border border-dashed border-cyan-900/30 rounded-lg bg-zinc-900/50">
                <FiPackage size={48} className="mx-auto mb-4 text-cyan-900/50" />
                <p className="text-xl">No bottles match your search.</p>
              </div>
            ) : (
              filteredBottles.map((bottle) => (
                <div
                  key={bottle.id}
                  className={`bg-zinc-900 border ${
                    bottle.isInEvent ? 'border-green-500/70' : 'border-cyan-900/30'
                  } p-4 rounded-lg cursor-pointer hover:border-cyan-700/50 transition-all relative group`}
                  onClick={() => handleAddOrEditBottle(bottle)}
                >
                  <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 mr-4 bg-black/30 rounded-md border border-cyan-900/20 p-1">
                      <Image
                        src={bottle.imageUrl}
                        alt={bottle.name}
                        fill
                        style={{objectFit: "contain"}}
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{bottle.name}</h3>
                      {bottle.isInEvent && (
                        <p className="text-green-400 flex items-center">
                          <FiDollarSign className="mr-1 text-green-500" />
                          {bottle.eventData?.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className={`ml-2 p-2 rounded-full ${
                      bottle.isInEvent 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-cyan-900/30 text-cyan-400'
                    }`}>
                      {bottle.isInEvent ? (
                        <FiCheck className="h-5 w-5" />
                      ) : (
                        <FiPlus className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  
                  {/* Hover effect bottom gradient line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isModalVisible && currentBottle && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 border border-cyan-900/50 rounded-lg p-6 max-w-md w-full relative">
            <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-cyan-300">{currentBottle.name}</h3>
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="text-gray-400 hover:text-white bg-zinc-800/80 p-2 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="bottlePrice" className="block text-sm font-medium mb-2 text-cyan-200">
                  Price for Event
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-cyan-600" />
                  </div>
                  <input
                    id="bottlePrice"
                    type="number"
                    step="0.01"
                    className="w-full p-3 pl-8 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="Enter bottle price"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUpdateBottlePrice}
                  className="w-full p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 rounded-lg text-white font-medium transition-all border border-cyan-500/50 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
                  <span className="relative z-10 flex items-center justify-center">
                    <FiCheck className="mr-2" />
                    Update Price
                  </span>
                </button>
                
                {currentBottle.isInEvent && (
                  <button
                    onClick={handleDeleteBottleFromEvent}
                    className="w-full p-3 bg-gradient-to-r from-red-900/80 to-red-700/80 hover:from-red-800 hover:to-red-600 rounded-lg text-white font-medium transition-all border border-red-500/50 flex items-center justify-center"
                  >
                    <FiTrash2 className="mr-2" />
                    Remove from Event
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
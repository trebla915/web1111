"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReservationDetails, Bottle, Mixer } from '@/types/reservation';

interface ReservationContextType {
  reservationDetails: ReservationDetails | null;
  setReservationDetails: (details: ReservationDetails) => void;
  updateReservationDetails: (details: Partial<ReservationDetails>) => void;
  clearReservation: () => void;
  addBottle: (bottle: Bottle) => void;
  removeBottle: (bottleId: string) => void;
  addMixer: (mixer: Mixer) => void;
  removeMixer: (mixerId: string) => void;
  calculateTotal: () => number;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function useReservation(): ReservationContextType {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [reservationDetails, setReservationDetailsState] = useState<ReservationDetails | null>(null);

  const setReservationDetails = (details: ReservationDetails) => {
    setReservationDetailsState(details);
  };

  const updateReservationDetails = (details: Partial<ReservationDetails>) => {
    if (!reservationDetails) return;
    setReservationDetailsState(prev => prev ? { ...prev, ...details } : null);
  };

  const clearReservation = () => {
    setReservationDetailsState(null);
  };

  const addBottle = (bottle: Bottle) => {
    if (!reservationDetails) return;
    setReservationDetailsState(prev => {
      if (!prev) return null;
      const bottles = prev.bottles || [];
      return {
        ...prev,
        bottles: [...bottles, bottle]
      };
    });
  };

  const removeBottle = (bottleId: string) => {
    if (!reservationDetails) return;
    setReservationDetailsState(prev => {
      if (!prev || !prev.bottles) return prev;
      return {
        ...prev,
        bottles: prev.bottles.filter(bottle => bottle.id !== bottleId)
      };
    });
  };

  const addMixer = (mixer: Mixer) => {
    if (!reservationDetails) return;
    setReservationDetailsState(prev => {
      if (!prev) return null;
      const mixers = prev.mixers || [];
      return {
        ...prev,
        mixers: [...mixers, mixer]
      };
    });
  };

  const removeMixer = (mixerId: string) => {
    if (!reservationDetails) return;
    setReservationDetailsState(prev => {
      if (!prev || !prev.mixers) return prev;
      return {
        ...prev,
        mixers: prev.mixers.filter(mixer => mixer.id !== mixerId)
      };
    });
  };

  const calculateTotal = () => {
    if (!reservationDetails) return 0;

    const tablePrice = reservationDetails.tablePrice || 0;
    const bottlesCost = 
      reservationDetails.bottles?.reduce((acc, bottle) => acc + bottle.price, 0) || 0;
    const mixersCost = 
      reservationDetails.mixers?.reduce((acc, mixer) => acc + mixer.price, 0) || 0;

    const subtotal = tablePrice + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.029 + 0.3; // 2.9% + $0.30 fixed fee

    return subtotal + serviceFee;
  };

  const value = {
    reservationDetails,
    setReservationDetails,
    updateReservationDetails,
    clearReservation,
    addBottle,
    removeBottle,
    addMixer,
    removeMixer,
    calculateTotal
  };

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
} 
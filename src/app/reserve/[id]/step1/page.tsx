'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Step1Page() {
  const params = useParams(); // ✅ Get eventId from the dynamic route
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get table details from URL
  const tableId = searchParams.get('tableId');
  const tablePrice = searchParams.get('price');
  const tableCapacity = Number(searchParams.get('capacity')) || 1;

  const [guests, setGuests] = useState(1);

  useEffect(() => {
    setGuests(1);
  }, [tableCapacity]);

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(
      Math.max(1, Number(e.target.value)),
      tableCapacity
    );
    setGuests(value);
  };

  const handleNextStep = () => {
    if (!params.id) {
      console.error("🚨 No event ID found in URL. Navigation stopped.");
      return;
    }
  
    router.push(
      `/reserve/${params.id}/step2?` + 
      new URLSearchParams({
        tableId: tableId || '',
        tablePrice: tablePrice || '',
        tableNumber: searchParams.get('tableNumber') || 'Unknown Table', // ✅ Now Passing Table Number
        guests: guests.toString()
      })
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-2xl w-full space-y-10 p-8 border border-white/20 backdrop-blur-lg rounded-xl bg-black/50">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
          Select Number of Guests
        </h1>

        {/* Guest Selection */}
        <div className="space-y-4">
          <label className="text-lg font-medium text-white block">
            Guests (Max: {tableCapacity})
          </label>
          <input
            type="number"
            value={guests}
            min={1}
            max={tableCapacity}
            onChange={handleGuestChange}
            className="w-full p-3 rounded-lg bg-transparent border border-white/30 text-white focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* Table Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-white/20 bg-transparent text-white">
            <h3 className="text-gray-400 mb-2">Table Price</h3>
            <p className="text-2xl font-bold">${tablePrice}</p>
          </div>
          <div className="p-4 rounded-lg border border-white/20 bg-transparent text-white">
            <h3 className="text-gray-400 mb-2">Max Capacity</h3>
            <p className="text-2xl font-bold">{tableCapacity}</p>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextStep}
          className="w-full py-4 border border-white text-white rounded-xl font-bold transition-all hover:bg-white hover:text-black"
        >
          Continue to Bottle Selection
        </button>
      </div>
    </div>
  );
}
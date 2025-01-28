import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

const Step1 = () => {
  const router = useRouter();
  const { id, tableId, tablePrice, tableCapacity } = router.query; // Get eventId, tableId, tablePrice, and tableCapacity from the URL

  const [guests, setGuests] = useState<number>(1);

  const handleGuestChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value <= Number(tableCapacity)) {
      setGuests(value);
    }
  };

  const handleNextStep = () => {
    // Navigate to step 2 with selected guest and table information
    router.push(`/reserve/${id}/step2?tableId=${tableId}&tablePrice=${tablePrice}&guests=${guests}`);
  };

  return (
    <>
      <Header />
      <div className="flex flex-col justify-center items-center min-h-screen py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Select Guests</h1>

        {/* Guest selection */}
        <div className="mb-8 w-full max-w-xs">
          <label htmlFor="guests" className="text-lg">Number of Guests (Max: {tableCapacity})</label>
          <input
            type="number"
            id="guests"
            value={guests}
            min="1"
            max={Number(tableCapacity)}
            onChange={handleGuestChange}
            className="mt-2 p-2 border rounded-md w-full bg-white text-foreground"
          />
        </div>

        {/* Next Step Button */}
        <button
          onClick={handleNextStep}
          className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md w-full max-w-xs"
        >
          Proceed to Bottle Selection
        </button>
      </div>
      <Footer />
    </>
  );
};

export default Step1;
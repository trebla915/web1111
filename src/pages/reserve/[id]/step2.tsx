import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header'; // Import Header
import Footer from '../../../components/Footer'; // Import Footer
import { apiClient } from '../../../utils/apiClient'; // Import the apiClient

const Step2 = () => {
  const router = useRouter();
  const { id, guests, tableId, tablePrice } = router.query; // Get eventId, tableId, tablePrice, and guests from URL

  const [selectedBottles, setSelectedBottles] = useState<string[]>([]); // For selecting bottles
  const [bottles, setBottles] = useState<any[]>([]); // Bottles fetched from the API
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Error handling state

  // Fetch bottles from the API based on the event ID
  useEffect(() => {
    if (id) {
      const fetchBottles = async () => {
        try {
          const response = await apiClient.get(`/bottles/${id}`);
          setBottles(response.data); // Set bottle data
        } catch (error) {
          console.error('Error fetching bottles:', error);
          setError('Error fetching bottles. Please try again later.');
        } finally {
          setLoading(false); // Stop loading spinner after data is fetched
        }
      };

      fetchBottles();
    }
  }, [id]);

  const handleBottleSelection = (bottle: string) => {
    setSelectedBottles((prev) => {
      if (prev.includes(bottle)) {
        return prev.filter((item) => item !== bottle); // Deselect bottle
      }
      return [...prev, bottle]; // Select bottle
    });
  };

  const handleNextStep = () => {
    // Prepare the data to be passed to the next step
    const reservationDetails = {
      tableId,
      tablePrice,
      selectedBottles,
      guests,
    };

    // Pass selected table, bottles, and guest information to Step 3
    router.push({
      pathname: `/reserve/${id}/step3`, // Navigate to step 3
      query: reservationDetails, // Pass the necessary data as query parameters
    });
  };

  // If loading or error, display appropriate message
  if (loading) {
    return <div className="text-center">Loading bottles...</div>;
  }

  if (error) {
    return <div className="text-center">{error}</div>;
  }

  return (
    <>
      <Header />
      <div className="flex flex-col justify-center items-center min-h-screen py-8 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">Select Bottles</h1>

        {/* Bottle selection */}
        <div className="mb-8 w-full max-w-6xl">
          <h2 className="text-xl text-white mb-4">Select Bottles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {bottles.map((bottle) => (
              <div
                key={bottle.id}
                onClick={() => handleBottleSelection(bottle.name)}
                className={`relative p-4 border rounded-3xl shadow-lg cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl ${
                  selectedBottles.includes(bottle.name) ? 'bg-blue-600 text-white' : 'bg-white bg-opacity-50 backdrop-blur-md'}`}
              >
                {/* Price tag in top-right corner */}
                <div className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full flex items-center">
                  <span className="text-xs">${bottle.price}</span>
                </div>

                {/* Bottle image */}
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={bottle.imageUrl}
                    alt={bottle.name}
                    className="w-32 h-32 object-cover rounded-full mb-4"
                  />

                  {/* Bottle Title */}
                  <h3 className="text-lg font-semibold text-center truncate max-w-full">{bottle.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Step Button */}
        <button
          onClick={handleNextStep}
          className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md w-full max-w-xs"
        >
          Proceed to Next Step
        </button>
      </div>
      <Footer />
    </>
  );
};

export default Step2;
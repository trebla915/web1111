import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../../utils/apiClient'; // Import the apiClient for fetching data
import ClubLayout from '../../../components/ClubLayout'; // Import ClubLayout
import Header from '../../../components/Header'; // Import Header
import Footer from '../../../components/Footer'; // Import Footer

const Reserve = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // State for error messages
  const { query, push } = useRouter();
  const { id } = query; // Get eventId from URL

  useEffect(() => {
    console.log('Event ID:', id); // Log to check if event ID is properly captured

    if (id) {
      const fetchTables = async () => {
        console.log('Fetching tables for event ID:', id);  // Log when the API call starts
        try {
          const response = await apiClient.get(`/tables/${id}`);
          console.log('API response:', response);  // Log the response data

          if (response.data && Array.isArray(response.data)) {
            setTables(response.data);  // Set tables data to state
            console.log('Tables fetched successfully:', response.data);  // Log the tables data
          } else {
            setError('No tables found for this event.');
            console.log('No tables found for this event.');  // Log if no tables found
          }
        } catch (error) {
          console.error('Error fetching tables:', error);  // Log any errors that occur
          setError('Error fetching tables. Please try again later.');
        } finally {
          setLoading(false);  // Stop loading spinner once data is fetched
          console.log('Finished fetching tables.');
        }
      };

      fetchTables();
    }
  }, [id]); // This effect runs when the id changes

  if (loading) {
    return <div className="text-center">Loading tables...</div>;
  }

  if (error) {
    return <div className="text-center">{error}</div>; // Display error message if there's an issue
  }

  // Define the function for table selection
  const handleTableSelect = (tableId: string, tablePrice: number, tableCapacity: number) => {
    // Redirect to step1 with selected table information and capacity
    push({
      pathname: `/reserve/${id}/step1`, // Navigate to the step1 page
      query: { tableId, tablePrice, tableCapacity }, // Pass the tableId, tablePrice, and tableCapacity as query params
    });
  };

  return (
    <>
      {/* Header Section */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-col justify-center items-center min-h-screen py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Table Selection</h1>

        {/* Table layout container */}
        <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
          <ClubLayout
            tables={tables}
            onTableSelect={handleTableSelect} // Function to handle table selection
          />
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </>
  );
};

export default Reserve;
import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchAllBottlesForEvent } from '../../src/utils/bottleService'; // Correct import
import { BottleCatalog, BackendBottle, MergedBottle } from '../../src/utils/types';

const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150'; // Fallback image URL

interface BottleContextType {
  catalog: BottleCatalog[];
  mergedBottles: MergedBottle[];
  fetchAndSetCatalog: () => Promise<void>;
  fetchAndMergeEventBottles: (eventId: string) => Promise<void>;
}

const BottleContext = createContext<BottleContextType | undefined>(undefined);

export const BottleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<BottleCatalog[]>([]);
  const [mergedBottles, setMergedBottles] = useState<MergedBottle[]>([]);

  // Fetch and set the catalog globally
  const fetchAndSetCatalog = async (): Promise<void> => {
    try {
      const fetchedBottles = await fetchAllBottlesForEvent('dummyEventId'); // Example event ID
      // Convert BackendBottle[] to BottleCatalog[]
      const catalogData: BottleCatalog[] = fetchedBottles.map(bottle => ({
        id: bottle.id,
        name: bottle.name,
        imageUrl: bottle.imageUrl || PLACEHOLDER_IMAGE_URL,
        price: bottle.price || 0,
      }));
      setCatalog(catalogData);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    }
  };

  // Fetch event bottles and merge them with the catalog
  const fetchAndMergeEventBottles = async (eventId: string): Promise<void> => {
    try {
      const eventBottles = await fetchAllBottlesForEvent(eventId); // Use fetchAllBottlesForEvent instead
      console.log(`Merging event bottles for event ${eventId}:`, eventBottles);
  
      const merged = catalog.map((bottle) => {
        const eventBottle = eventBottles.find((eb) => eb.id === bottle.id);
        return {
          ...bottle,
          isInEvent: !!eventBottle,
          eventData: eventBottle || undefined, // Use `undefined` instead of `null`
          imageUrl: eventBottle?.imageUrl || PLACEHOLDER_IMAGE_URL, // Use fallback image if not available
        };
      });
  
      console.log('Merged Bottles:', merged);
      setMergedBottles(merged);
    } catch (error) {
      console.error('Error fetching or merging event bottles:', error);
    }
  };

  useEffect(() => {
    fetchAndSetCatalog(); // Load the catalog on app startup
  }, []);

  return (
    <BottleContext.Provider
      value={{
        catalog,
        mergedBottles,
        fetchAndSetCatalog,
        fetchAndMergeEventBottles,
      }}
    >
      {children}
    </BottleContext.Provider>
  );
};

export const useBottleContext = (): BottleContextType => {
  const context = useContext(BottleContext);
  if (!context) throw new Error('useBottleContext must be used within BottleProvider');
  return context;
};

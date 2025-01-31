'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/utils/apiClient';
import ClubLayout, { FrontendTable } from '@/components/reservation/ClubLayout';
import Loader from '@/components/ui/Loader';

export default function ReservationPage() {
  const [tables, setTables] = useState<FrontendTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await apiClient.get<FrontendTable[]>(`/tables/${id}`);
        if (response.data?.length) {
          setTables(response.data);
        } else {
          setError('No tables available');
        }
      } catch (err) {
        setError('Failed to load tables');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTables();
  }, [id]);

  const handleTableSelect = (tableId: string, price: number, capacity: number) => {
    router.push(
      `/reserve/${id}/step1?` + 
      new URLSearchParams({ 
        tableId, 
        price: price.toString(), 
        capacity: capacity.toString() 
      })
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader />
    </div>
  );

  if (error) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-black"
    >
      <div className="bg-red-500/20 backdrop-blur-sm p-6 rounded-xl border border-red-500/30">
        <p className="text-red-400 text-lg font-bold">{error}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Decorations Removed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <ClubLayout 
          tables={tables} 
          onTableSelect={handleTableSelect}
          renderTable={(table: FrontendTable, handleSelect) => (
            <motion.div
              key={table.id}
              whileHover={{ scale: 1.02 }}
              className="group relative bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 hover:border-white transition-all cursor-pointer h-full"
            >
              {table.capacity < 4 && (
                <div className="absolute top-2 right-2 bg-red-500/80 text-xs px-2 py-1 rounded-full">
                  Small Group
                </div>
              )}
              
              <div className="absolute inset-0 -z-10 bg-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-2 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-white uppercase">
                    {table.number}
                  </h3>
                  <span className="px-2 py-1 rounded-full bg-gray-700/50 text-xs text-white">
                    ${table.price}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Up to {table.capacity}</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSelect}
                  disabled={table.reserved}
                  className={`w-full py-2 rounded-md font-medium text-sm border border-white text-white transition-all ${
                    table.reserved 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-transparent hover:bg-white hover:text-black'
                  }`}
                >
                  {table.reserved ? 'Reserved' : 'Select Table'}
                </motion.button>
              </div>
            </motion.div>
          )}
        />
      </motion.div>
    </div>
  );
}
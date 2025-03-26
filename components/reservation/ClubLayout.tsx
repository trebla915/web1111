"use client";

import React, { useEffect } from 'react';
import { Table } from '@/types/reservation';

interface ClubLayoutProps {
  tables: Table[];
  onTableSelect: (tableId: string, tablePrice: number) => void;
  showTablePrice?: boolean;
}

const ClubLayout: React.FC<ClubLayoutProps> = ({ 
  tables, 
  onTableSelect, 
  showTablePrice = false 
}) => {
  // Debug logging
  useEffect(() => {
    console.log('ClubLayout rendering with tables:', tables);
  }, [tables]);

  // Sort tables by number for display consistency
  const sortedTables = [...tables].sort((a, b) => (a.number || 0) - (b.number || 0));

  // Use the same index-based approach as the React Native version
  // Left side tables: first 7 tables by index
  const leftSideTables = sortedTables.slice(0, 7);
  // Right side tables: tables 7-12 by index
  const rightSideTables = sortedTables.slice(7, 12);

  return (
    <div className="w-full max-w-5xl mx-auto relative">
      <div className="bg-gradient-to-b from-black to-zinc-900/95 text-white rounded-xl border border-cyan-900/40 overflow-hidden shadow-[0_0_30px_rgba(8,145,178,0.15)]">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="p-8 relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl"></div>
          
          {/* Background noise texture for club atmosphere */}
          <div className="absolute inset-0 noise opacity-5"></div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-8">Select a Table</h2>
          
          {/* Stage area */}
          <div className="bg-gradient-to-r from-cyan-900/40 via-purple-900/50 to-cyan-900/40 py-8 mx-auto w-1/3 mb-10 relative rounded-md overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <div className="absolute inset-0 spotlight opacity-20"></div>
            <div className="absolute inset-0 noise opacity-10"></div>
            <h3 className="text-2xl text-center font-semibold tracking-wider text-cyan-300 digital-glow-soft">STAGE</h3>
          </div>
          
          {sortedTables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-400">No tables available for this event.</p>
            </div>
          ) : (
            <div className="w-full relative">
              {/* Dance floor - starts right below the stage and extends to the bottom */}
              <div className="absolute left-1/3 right-1/3 top-0 bottom-0 mx-auto bg-gradient-to-b from-purple-900/30 via-cyan-900/20 to-transparent rounded-xl overflow-hidden">
                <div className="absolute inset-0 spotlight opacity-15"></div>
                <div className="absolute inset-0 noise opacity-10"></div>
                <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse-slow"></div>
              </div>
              
              <div className="flex relative">
                {/* Left side tables */}
                <div className="w-1/3 flex flex-col items-end pr-8">
                  {leftSideTables.map((table, index) => (
                    <div 
                      key={table.id}
                      className={`
                        relative w-4/5 p-5 rounded-xl text-center transition-all duration-300 transform mb-14
                        ${table.reserved 
                          ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed' 
                          : 'bg-gradient-to-br from-cyan-900/30 to-zinc-900/90 border border-cyan-800/50 hover:border-cyan-400/70 cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105'
                        }
                      `}
                      onClick={() => {
                        if (!table.reserved) {
                          onTableSelect(table.id, table.price);
                        }
                      }}
                    >
                      {/* Noise texture */}
                      <div className="absolute inset-0 rounded-xl noise opacity-10"></div>
                      
                      {/* Glow effect for available tables */}
                      {!table.reserved && (
                        <div className="absolute -inset-0.5 bg-cyan-900/20 rounded-xl blur-sm"></div>
                      )}
                      
                      <div className="relative">
                        <h4 className={`text-2xl font-bold ${table.reserved ? 'text-gray-400' : 'text-cyan-300 digital-glow-soft'}`}>
                          {table.number}
                        </h4>
                        
                        {showTablePrice && (
                          <p className={`font-medium mt-1 ${table.reserved ? 'text-gray-500' : 'text-cyan-400'}`}>
                            ${table.price?.toFixed(2) || 'N/A'}
                          </p>
                        )}
                        
                        <p className="text-xs mt-2 text-gray-400">VIP Booth</p>
                      </div>
                      
                      {table.reserved && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative bg-black/40 p-2 rounded-lg backdrop-blur-sm">
                            {/* X mark */}
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-6 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                              <div className="w-6 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
                            </div>
                            <p className="text-xs text-red-400 mt-1">RESERVED</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Center space - empty */}
                <div className="w-1/3"></div>
                
                {/* Right side tables */}
                <div className="w-1/3 flex flex-col items-start pl-8">
                  {rightSideTables.map((table, index) => (
                    <div 
                      key={table.id}
                      className={`
                        relative w-4/5 p-5 rounded-xl text-center transition-all duration-300 transform mb-14
                        ${table.reserved 
                          ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed' 
                          : 'bg-gradient-to-br from-cyan-900/30 to-zinc-900/90 border border-cyan-800/50 hover:border-cyan-400/70 cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105'
                        }
                      `}
                      onClick={() => {
                        if (!table.reserved) {
                          onTableSelect(table.id, table.price);
                        }
                      }}
                    >
                      {/* Noise texture */}
                      <div className="absolute inset-0 rounded-xl noise opacity-10"></div>
                      
                      {/* Glow effect for available tables */}
                      {!table.reserved && (
                        <div className="absolute -inset-0.5 bg-cyan-900/20 rounded-xl blur-sm"></div>
                      )}
                      
                      <div className="relative">
                        <h4 className={`text-2xl font-bold ${table.reserved ? 'text-gray-400' : 'text-cyan-300 digital-glow-soft'}`}>
                          {table.number}
                        </h4>
                        
                        {showTablePrice && (
                          <p className={`font-medium mt-1 ${table.reserved ? 'text-gray-500' : 'text-cyan-400'}`}>
                            ${table.price?.toFixed(2) || 'N/A'}
                          </p>
                        )}
                        
                        <p className="text-xs mt-2 text-gray-400">VIP Booth</p>
                      </div>
                      
                      {table.reserved && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative bg-black/40 p-2 rounded-lg backdrop-blur-sm">
                            {/* X mark */}
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-6 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                              <div className="w-6 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
                            </div>
                            <p className="text-xs text-red-400 mt-1">RESERVED</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubLayout; 
"use client";

import React, { useEffect, useState } from 'react';
import { Table } from '@/types/reservation';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleTableClick = (table: Table) => {
    if (table.reserved) return;
    onTableSelect(table.id, table.price || 0);
  };

  // Split tables into left and right sides
  const sortedTables = [...tables].sort((a, b) => a.number - b.number);
  const midPoint = Math.ceil(sortedTables.length / 2);
  const leftSideTables = sortedTables.slice(0, midPoint);
  const rightSideTables = sortedTables.slice(midPoint);

  return (
    <>
      <div className="w-full max-w-5xl mx-auto relative">
        <div className="bg-gradient-to-b from-black to-zinc-900/95 text-white rounded-xl border border-white/20 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="p-1 md:p-8 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 md:w-16 h-2 md:h-16 border-t-2 border-l-2 border-white/20 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-2 md:w-16 h-2 md:h-16 border-t-2 border-r-2 border-white/20 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-2 md:w-16 h-2 md:h-16 border-b-2 border-l-2 border-white/20 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-2 md:w-16 h-2 md:h-16 border-b-2 border-r-2 border-white/20 rounded-br-xl"></div>
            
            {/* Background noise texture for club atmosphere */}
            <div className="absolute inset-0 noise opacity-5"></div>
            
            {/* Title */}
            <h2 className="text-sm md:text-2xl font-bold text-center mb-1 md:mb-8">Select a Table</h2>
            
            {/* Stage area */}
            <div className="bg-gradient-to-r from-white/5 via-white/10 to-white/5 py-1 md:py-8 mx-auto w-full md:w-1/3 mb-1 md:mb-10 relative rounded-md overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <div className="absolute inset-0 spotlight opacity-20"></div>
              <div className="absolute inset-0 noise opacity-10"></div>
              <h3 className="text-xs md:text-2xl text-center font-semibold tracking-wider text-white digital-glow-soft">STAGE</h3>
            </div>
            
            {sortedTables.length === 0 ? (
              <div className="text-center py-2 md:py-12">
                <p className="text-xs md:text-lg text-gray-400">No tables available for this event.</p>
              </div>
            ) : (
              <div className="w-full relative">
                {/* Dance floor - starts right below the stage and extends to the bottom */}
                <div className="absolute left-1/3 md:left-1/3 right-1/3 md:right-1/3 top-0 bottom-0 mx-auto bg-gradient-to-b from-white/5 via-white/10 to-transparent rounded-xl overflow-hidden">
                  <div className="absolute inset-0 spotlight opacity-15"></div>
                  <div className="absolute inset-0 noise opacity-10"></div>
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse-slow"></div>
                </div>
                
                <div className="flex flex-row relative">
                  {/* Left side tables */}
                  <div className="w-1/3 md:w-1/3 flex flex-col items-end pr-1 md:pr-8">
                    {leftSideTables.map((table) => (
                      <div 
                        key={table.id}
                        className={`
                          relative w-3/4 md:w-4/5 p-0.5 md:p-5 rounded-md md:rounded-xl text-center transition-all duration-300 transform mb-0.5 md:mb-14
                          ${table.reserved 
                            ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed' 
                            : 'bg-gradient-to-br from-white/5 to-zinc-900/90 border border-white/20 hover:border-white/40 cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105'
                          }
                        `}
                        onClick={() => {
                          if (!table.reserved) {
                            handleTableClick(table);
                          }
                        }}
                      >
                        {/* Noise texture */}
                        <div className="absolute inset-0 rounded-md md:rounded-xl noise opacity-10"></div>
                        
                        {/* Glow effect for available tables */}
                        {!table.reserved && (
                          <div className="absolute -inset-0.5 bg-white/5 rounded-md md:rounded-xl blur-sm"></div>
                        )}
                        
                        <div className="relative">
                          <h4 className={`text-xs md:text-2xl font-bold ${table.reserved ? 'text-gray-400' : 'text-white digital-glow-soft'}`}>
                            {table.number}
                          </h4>
                          
                          {showTablePrice && (
                            <p className={`text-[10px] md:text-base font-medium mt-0.5 md:mt-1 ${table.reserved ? 'text-gray-500' : 'text-white/60'}`}>
                              ${table.price?.toFixed(2) || 'N/A'}
                            </p>
                          )}
                          
                          <p className="text-[8px] md:text-xs mt-0.5 md:mt-2 text-gray-400">VIP Booth</p>
                        </div>
                        
                        {table.reserved && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative bg-black/40 p-0.5 md:p-2 rounded-md backdrop-blur-sm">
                              {/* X mark */}
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 md:w-6 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                                <div className="w-2 md:w-6 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
                              </div>
                              <p className="text-[6px] md:text-xs text-red-400 mt-0.5 md:mt-1">RESERVED</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Center space - empty */}
                  <div className="w-1/3 md:w-1/3"></div>
                  
                  {/* Right side tables */}
                  <div className="w-1/3 md:w-1/3 flex flex-col items-start pl-1 md:pl-8">
                    {rightSideTables.map((table) => (
                      <div 
                        key={table.id}
                        className={`
                          relative w-3/4 md:w-4/5 p-0.5 md:p-5 rounded-md md:rounded-xl text-center transition-all duration-300 transform mb-0.5 md:mb-14
                          ${table.reserved 
                            ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed' 
                            : 'bg-gradient-to-br from-white/5 to-zinc-900/90 border border-white/20 hover:border-white/40 cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105'
                          }
                        `}
                        onClick={() => {
                          if (!table.reserved) {
                            handleTableClick(table);
                          }
                        }}
                      >
                        {/* Noise texture */}
                        <div className="absolute inset-0 rounded-md md:rounded-xl noise opacity-10"></div>
                        
                        {/* Glow effect for available tables */}
                        {!table.reserved && (
                          <div className="absolute -inset-0.5 bg-white/5 rounded-md md:rounded-xl blur-sm"></div>
                        )}
                        
                        <div className="relative">
                          <h4 className={`text-xs md:text-2xl font-bold ${table.reserved ? 'text-gray-400' : 'text-white digital-glow-soft'}`}>
                            {table.number}
                          </h4>
                          
                          {showTablePrice && (
                            <p className={`text-[10px] md:text-base font-medium mt-0.5 md:mt-1 ${table.reserved ? 'text-gray-500' : 'text-white/60'}`}>
                              ${table.price?.toFixed(2) || 'N/A'}
                            </p>
                          )}
                          
                          <p className="text-[8px] md:text-xs mt-0.5 md:mt-2 text-gray-400">VIP Booth</p>
                        </div>
                        
                        {table.reserved && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative bg-black/40 p-0.5 md:p-2 rounded-md backdrop-blur-sm">
                              {/* X mark */}
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 md:w-6 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                                <div className="w-2 md:w-6 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
                              </div>
                              <p className="text-[6px] md:text-xs text-red-400 mt-0.5 md:mt-1">RESERVED</p>
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
    </>
  );
};

export default ClubLayout; 
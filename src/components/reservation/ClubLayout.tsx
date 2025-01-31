"use client";

import React from "react";
import { motion } from "framer-motion";

export interface FrontendTable {
  id: string;
  number: string;
  price: number;
  capacity: number;
  reserved: boolean;
}

interface ClubLayoutProps {
  tables: FrontendTable[];
  onTableSelect: (tableId: string, price: number, capacity: number) => void;
  renderTable: (table: FrontendTable, handleSelect: () => void) => React.ReactNode;
}

const ClubLayout: React.FC<ClubLayoutProps> = ({ tables, onTableSelect, renderTable }) => {
  const leftTables = tables.filter(table => parseInt(table.number) >= 1 && parseInt(table.number) <= 7);
  const rightTables = tables.filter(table => parseInt(table.number) >= 8 && parseInt(table.number) <= 12);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stage at the top */}
      <motion.div 
        className="w-full p-3 border-b border-white text-center backdrop-blur-md bg-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">
          Main Stage
        </h3>
      </motion.div>

      {/* Main layout area with aligned columns */}
      <div className="flex-1 grid grid-cols-3 gap-x-4 p-6 min-h-[500px]">
        {/* Left Tables - Right-aligned */}
        <div className="flex flex-col items-end gap-2 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2 w-full max-w-[140px]">
            {leftTables.map(table => (
              <div key={table.id} className="aspect-square w-full">
                {renderTable(table, () => {
                  if (!table.reserved) {
                    onTableSelect(table.id, table.price, table.capacity);
                  }
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Dance Floor - Centered (Now without Lock Icon & Capacity) */}
        <motion.div 
          className="border border-white rounded-lg p-4 backdrop-blur-md flex items-center justify-center bg-transparent"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <div className="text-center w-full max-w-[200px]">
            <div className="text-lg font-bold text-white uppercase tracking-wider">
              Dance Floor
            </div>
            <div className="aspect-square w-full border border-white rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-semibold">General Admission</span>
            </div>
          </div>
        </motion.div>

        {/* Right Tables - Left-aligned */}
        <div className="flex flex-col items-start gap-2 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2 w-full max-w-[140px]">
            {rightTables.map(table => (
              <div key={table.id} className="aspect-square w-full">
                {renderTable(table, () => {
                  if (!table.reserved) {
                    onTableSelect(table.id, table.price, table.capacity);
                  }
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubLayout;
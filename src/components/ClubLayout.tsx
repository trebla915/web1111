import React from 'react';
import { FrontendTable } from '../../src/utils/types';

interface ClubLayoutProps {
  tables: FrontendTable[];
  onTableSelect: (tableId: string, tablePrice: number, tableCapacity: number) => void;
  showTablePrice?: boolean;
}

const ClubLayout: React.FC<ClubLayoutProps> = ({ tables, onTableSelect, showTablePrice = false }) => {
  return (
    <div className="flex justify-center items-center mt-8">
      <svg height="600" width="800">
        {/* Title */}
        <text x="50%" y="30" fontSize="24" fill="#fff" textAnchor="middle">
          Select a Table
        </text>

        {/* Stage */}
        <rect x="200" y="50" width="400" height="80" fill="#444" />
        <text x="400" y="100" fontSize="24" fill="#fff" textAnchor="middle">
          Stage
        </text>

        {/* Render Tables */}
        {tables.map((table, index) => {
          const xPosition = 100 + (index % 5) * 150; // Adjusting for X position based on table index
          const yPosition = 150 + Math.floor(index / 5) * 100; // Adjusting Y position for multiple rows

          return (
            <g key={table.id}>
              <rect
                x={xPosition}
                y={yPosition}
                width={100}
                height={80}
                fill={table.reserved ? '#888' : '#fff'}
                onClick={() => {
                  if (!table.reserved) {
                    onTableSelect(table.id, table.price, table.capacity); // Pass price and capacity along
                  }
                }}
                className="cursor-pointer transition-all transform hover:scale-105"
              />
              <text x={xPosition + 50} y={yPosition + 30} fontSize="16" fill={table.reserved ? '#D3D3D3' : '#000'} textAnchor="middle">
                {table.number}
              </text>

              {/* Show price if selected */}
              {showTablePrice && (
                <text x={xPosition + 50} y={yPosition + 60} fontSize="12" fill="#FFD700" textAnchor="middle">
                  ${table.price}
                </text>
              )}

              {/* Draw "X" over reserved tables */}
              {table.reserved && (
                <>
                  <line x1={xPosition} y1={yPosition} x2={xPosition + 100} y2={yPosition + 80} stroke="#fff" strokeWidth="3" />
                  <line x1={xPosition + 100} y1={yPosition} x2={xPosition} y2={yPosition + 80} stroke="#fff" strokeWidth="3" />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ClubLayout;
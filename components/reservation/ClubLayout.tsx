"use client";

/**
 * ClubLayout — Customer-facing VIP table seating map
 *
 * Data flow:
 *   1. Parent page fetches tables via getTablesByEvent() → GET /api/events/[id]/tables
 *   2. Tables arrive with a `location` field ('left' | 'right') set in Firestore
 *   3. This component groups tables by `location`:
 *        Left column  (tables 1–7)  → rendered as rectangular booths
 *        Right column (tables 8–15) → rendered as circles (border-radius 50%)
 *   4. Click handler delegates to parent via onTableSelect(tableId, tablePrice)
 *
 * Layout (top to bottom):
 *   ┌────────────────────────────────┐
 *   │           STAGE                │
 *   ├──────┬──────────────┬──────────┤
 *   │ Left │  Dance Floor │  Right   │
 *   │ 1–7  │              │  8–15    │
 *   │ rect │              │  circle  │
 *   └──────┴──────────────┴──────────┘
 */

import React from 'react';
import { Table } from '@/types/reservation';

interface ClubLayoutProps {
  tables: Table[];
  onTableSelect: (tableId: string, tablePrice: number) => void;
  showTablePrice?: boolean;
}

const ClubLayout: React.FC<ClubLayoutProps> = ({
  tables,
  onTableSelect,
  showTablePrice = false,
}) => {
  const handleTableClick = (table: Table) => {
    if (table.reserved) return;
    onTableSelect(table.id, table.price || 0);
  };

  // ── Group tables by their database `location` field ──────────────────
  let leftTables = tables
    .filter((t) => t.location === 'left')
    .sort((a, b) => a.number - b.number);
  let rightTables = tables
    .filter((t) => t.location === 'right')
    .sort((a, b) => a.number - b.number);

  // Any legacy "center" tables get folded into the left column
  const centerTables = tables
    .filter((t) => t.location === 'center')
    .sort((a, b) => a.number - b.number);
  if (centerTables.length > 0) {
    leftTables = [...leftTables, ...centerTables].sort(
      (a, b) => a.number - b.number
    );
  }

  // Fallback: if no location data at all, split by number (legacy support)
  if (leftTables.length === 0 && rightTables.length === 0 && tables.length > 0) {
    const sorted = [...tables].sort((a, b) => a.number - b.number);
    const mid = Math.ceil(sorted.length / 2);
    leftTables = sorted.slice(0, mid);
    rightTables = sorted.slice(mid);
  }

  // ── Rectangular table (left side) ────────────────────────────────────
  const renderRectTable = (table: Table) => (
    <div
      key={table.id}
      className={`
        relative w-3/4 md:w-4/5 p-0.5 md:p-4 rounded-md md:rounded-xl text-center
        transition-all duration-300 transform
        ${table.reserved
          ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed'
          : 'bg-gradient-to-br from-white/5 to-zinc-900/90 border border-white/20 hover:border-white/40 cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105'
        }
      `}
      onClick={() => { if (!table.reserved) handleTableClick(table); }}
    >
      <div className="absolute inset-0 rounded-md md:rounded-xl noise opacity-10"></div>

      {!table.reserved && (
        <div className="absolute -inset-0.5 bg-white/5 rounded-md md:rounded-xl blur-sm"></div>
      )}

      <div className="relative">
        <h4
          className={`text-xs md:text-2xl font-bold ${
            table.reserved ? 'text-gray-400' : 'text-white digital-glow-soft'
          }`}
        >
          {table.number}
        </h4>

        {showTablePrice && (
          <p
            className={`text-[10px] md:text-base font-medium mt-0.5 md:mt-1 ${
              table.reserved ? 'text-gray-500' : 'text-white/60'
            }`}
          >
            ${table.price?.toFixed(2) || 'N/A'}
          </p>
        )}

        <p className="text-[8px] md:text-xs mt-0.5 md:mt-2 text-gray-400">
          VIP Booth
        </p>
      </div>

      {table.reserved && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative bg-black/40 p-0.5 md:p-2 rounded-md backdrop-blur-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 md:w-6 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
              <div className="w-2 md:w-6 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
            </div>
            <p className="text-[6px] md:text-xs text-red-400 mt-0.5 md:mt-1">
              RESERVED
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ── Circular table (right side) ──────────────────────────────────────
  const renderCircleTable = (table: Table) => (
    <div
      key={table.id}
      className={`
        relative w-11 h-11 md:w-20 md:h-20 rounded-full
        flex items-center justify-center text-center
        transition-all duration-300 transform
        ${table.reserved
          ? 'bg-zinc-800/80 border border-zinc-700 opacity-60 cursor-not-allowed'
          : 'bg-gradient-to-br from-white/5 to-zinc-900/90 border border-white/20 hover:border-white/40 cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105'
        }
      `}
      onClick={() => { if (!table.reserved) handleTableClick(table); }}
    >
      <div className="absolute inset-0 rounded-full noise opacity-10"></div>

      {!table.reserved && (
        <div className="absolute -inset-0.5 bg-white/5 rounded-full blur-sm"></div>
      )}

      <div className="relative">
        <h4
          className={`text-[10px] md:text-lg font-bold leading-tight ${
            table.reserved ? 'text-gray-400' : 'text-white digital-glow-soft'
          }`}
        >
          {table.number}
        </h4>

        {showTablePrice && (
          <p
            className={`text-[7px] md:text-xs font-medium leading-tight ${
              table.reserved ? 'text-gray-500' : 'text-white/60'
            }`}
          >
            ${table.price?.toFixed(0) || 'N/A'}
          </p>
        )}

        <p className="text-[5px] md:text-[10px] leading-tight text-gray-400">
          VIP
        </p>
      </div>

      {table.reserved && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <div className="relative bg-black/40 p-0.5 md:p-1.5 rounded-full backdrop-blur-sm">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1.5 md:w-4 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
              <div className="w-1.5 md:w-4 h-0.5 bg-red-500 -rotate-45 transform origin-center"></div>
            </div>
            <p className="text-[5px] md:text-[10px] text-red-400">RESERVED</p>
          </div>
        </div>
      )}
    </div>
  );

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

            {/* Background noise texture */}
            <div className="absolute inset-0 noise opacity-5"></div>

            {/* Title */}
            <h2 className="text-sm md:text-2xl font-bold text-center mb-1 md:mb-8">
              Select a Table
            </h2>

            {/* Stage area */}
            <div className="bg-gradient-to-r from-white/5 via-white/10 to-white/5 py-1 md:py-8 mx-auto w-full md:w-1/3 mb-1 md:mb-3 relative rounded-md overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <div className="absolute inset-0 spotlight opacity-20"></div>
              <div className="absolute inset-0 noise opacity-10"></div>
              <h3 className="text-xs md:text-2xl text-center font-semibold tracking-wider text-white digital-glow-soft">
                STAGE
              </h3>
            </div>

            {tables.length === 0 ? (
              <div className="text-center py-2 md:py-12">
                <p className="text-xs md:text-lg text-gray-400">
                  No tables available for this event.
                </p>
              </div>
            ) : (
              <div className="w-full relative">
                {/* Dance floor overlay — center column */}
                <div className="absolute left-1/3 right-1/3 top-0 bottom-0 mx-auto bg-gradient-to-b from-white/5 via-white/10 to-transparent rounded-xl overflow-hidden">
                  <div className="absolute inset-0 spotlight opacity-15"></div>
                  <div className="absolute inset-0 noise opacity-10"></div>
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse-slow"></div>
                </div>

                <div className="flex flex-row relative items-start">
                  {/* ── Left column: tables 1–7 (rectangles) ── */}
                  <div className="w-1/3 flex flex-col items-end gap-0.5 md:gap-5 pr-1 md:pr-8 pt-0 pb-1 md:pb-4">
                    {leftTables.map((table) => renderRectTable(table))}
                  </div>

                  {/* Center space (dance floor) */}
                  <div className="w-1/3"></div>

                  {/* ── Right side: tables 8–15 (circles), 2-col grid, pushed up to stage ── */}
                  {/* Row order: 8,9 | 10,11 | 12,13 | 14,15 */}
                  <div className="w-1/3 flex items-start pl-1 md:pl-4 pt-0 pb-1 md:pb-4">
                    <div className="grid grid-cols-2 gap-1.5 md:gap-3 w-full justify-items-center">
                      {rightTables.map((table) => renderCircleTable(table))}
                    </div>
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

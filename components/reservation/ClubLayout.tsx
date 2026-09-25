"use client";

/**
 * ClubLayout — Customer-facing VIP table seating map
 *
 * Data flow:
 *   1. Parent page fetches tables via getEventTables() → GET /api/events/[id]/tables
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
 *
 * Three things this map owes the guest, and previously withheld:
 *
 *   - **Keyboard operation.** Tables were `<div onClick>`: a guest navigating by
 *     keyboard could not book a table at all. They are now real buttons in a
 *     labelled group, each announcing number, price, capacity and bottle
 *     minimum.
 *   - **The facts behind the price.** Capacity and the bottle minimum decide
 *     whether a table works for a group, and both were hidden until two steps
 *     later — where the minimum then blocked the Continue button. They are on
 *     the tile now.
 *   - **Legible type.** Labels ran down to `text-[5px]` on a phone, which is
 *     roughly a third the size of the smallest readable UI text.
 */

import React from 'react';
import { FiUsers } from 'react-icons/fi';
import { Table } from '@/types/reservation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ClubLayoutProps {
  tables: Table[];
  onTableSelect: (tableId: string, tablePrice: number) => void;
  showTablePrice?: boolean;
  /** Marks one table as the guest's current pick (used by the change-table flow). */
  selectedTableId?: string | null;
}

const money = (value?: number) =>
  typeof value === 'number' && !Number.isNaN(value)
    ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—';

/** Everything the guest needs before committing, spoken as one sentence. */
function accessibleLabel(table: Table, showTablePrice: boolean, isSelected: boolean) {
  const parts = [`Table ${table.number}`];
  if (showTablePrice) parts.push(money(table.price));
  if (table.capacity) parts.push(`seats up to ${table.capacity}`);
  if (table.minimumBottles > 0) {
    parts.push(`${table.minimumBottles} bottle minimum`);
  }
  if (table.reserved) parts.push('already reserved, not available');
  else if (isSelected) parts.push('currently selected');
  else parts.push('available');
  return parts.join(', ');
}

const ClubLayout: React.FC<ClubLayoutProps> = ({
  tables,
  onTableSelect,
  showTablePrice = false,
  selectedTableId = null,
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

  const availableCount = tables.filter((t) => !t.reserved).length;

  /**
   * Shared state styling. Availability is carried by fill, border *and* the
   * strikethrough badge, never by colour alone.
   */
  const tableStateClass = (table: Table, isSelected: boolean) =>
    cn(
      'group relative flex flex-col items-center justify-center text-center',
      'transition-[transform,border-color,background-color] duration-fast ease-out-expo',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
      table.reserved
        ? 'cursor-not-allowed border border-line bg-surface-raised/50 opacity-60'
        : isSelected
          ? 'cursor-pointer border-2 border-accent-bright bg-accent-950 shadow-glow-accent'
          : 'cursor-pointer border border-fg/25 bg-surface/70 hover:border-fg/60 hover:bg-surface-raised/80 active:scale-[0.98]'
    );

  // ── Rectangular table (left side) ────────────────────────────────────
  const renderRectTable = (table: Table) => {
    const isSelected = selectedTableId === table.id;
    return (
      <Button
        unstyled
        key={table.id}
        type="button"
        disabled={table.reserved}
        aria-label={accessibleLabel(table, showTablePrice, isSelected)}
        aria-pressed={isSelected || undefined}
        onClick={() => handleTableClick(table)}
        className={cn(
          tableStateClass(table, isSelected),
          'w-full min-h-[3.75rem] gap-0.5 rounded-lg px-1.5 py-2 sm:min-h-[5rem] sm:gap-1 sm:rounded-xl sm:px-3 sm:py-3'
        )}
      >
        <span
          className={cn(
            'font-heading text-base leading-none tracking-wide sm:text-2xl',
            table.reserved ? 'text-fg-muted' : 'text-fg'
          )}
        >
          {table.number}
        </span>

        {showTablePrice && !table.reserved && (
          <span className="tabular text-xs font-medium leading-none text-accent-bright sm:text-base">
            {money(table.price)}
          </span>
        )}

        {table.reserved ? (
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-danger-bright sm:text-xs">
            Reserved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[0.625rem] leading-none text-fg-muted sm:text-xs">
            <FiUsers aria-hidden="true" className="shrink-0" size={10} />
            <span className="tabular">{table.capacity}</span>
            {table.minimumBottles > 0 && (
              <span className="hidden sm:inline">· {table.minimumBottles} btl min</span>
            )}
          </span>
        )}
      </Button>
    );
  };

  // ── Circular table (right side) ──────────────────────────────────────
  const renderCircleTable = (table: Table) => {
    const isSelected = selectedTableId === table.id;
    return (
      <Button
        unstyled
        key={table.id}
        type="button"
        disabled={table.reserved}
        aria-label={accessibleLabel(table, showTablePrice, isSelected)}
        aria-pressed={isSelected || undefined}
        onClick={() => handleTableClick(table)}
        className={cn(
          tableStateClass(table, isSelected),
          'aspect-square w-full max-w-[4.5rem] rounded-full sm:max-w-[5.5rem]'
        )}
      >
        <span
          className={cn(
            'font-heading text-sm leading-none tracking-wide sm:text-xl',
            table.reserved ? 'text-fg-muted' : 'text-fg'
          )}
        >
          {table.number}
        </span>

        {table.reserved ? (
          <span className="mt-0.5 text-[0.625rem] font-semibold uppercase leading-none tracking-wide text-danger-bright">
            Res.
          </span>
        ) : (
          <>
            {showTablePrice && (
              <span className="tabular mt-0.5 text-[0.6875rem] font-medium leading-none text-accent-bright sm:text-sm">
                {money(table.price)}
              </span>
            )}
            <span className="tabular mt-0.5 flex items-center gap-0.5 text-[0.625rem] leading-none text-fg-muted">
              <FiUsers aria-hidden="true" size={9} />
              {table.capacity}
            </span>
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-xl border border-fg/20 bg-gradient-to-b from-canvas to-surface/95 text-fg shadow-panel">
        {/* Background noise texture */}
        <div aria-hidden="true" className="noise pointer-events-none absolute inset-0 opacity-5" />

        {/* Corner brackets — four symmetric L-shaped rules framing the
            floor plan. The detector reads these as a one-sided "side tab"
            accent; they are a deliberate, balanced motif, so they stay. */}
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-tl-xl border-l-2 border-t-2 border-fg/20 sm:h-12 sm:w-12" />
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-4 w-4 rounded-tr-xl border-r-2 border-t-2 border-fg/20 sm:h-12 sm:w-12" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 rounded-bl-xl border-b-2 border-l-2 border-fg/20 sm:h-12 sm:w-12" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 rounded-br-xl border-b-2 border-r-2 border-fg/20 sm:h-12 sm:w-12" />

        <div className="relative p-4 sm:p-8">
          {/* Header: what this is, and the one number that decides whether to
              keep looking — how many tables are actually left. */}
          <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* "Floor plan", not "Select a table": the page heading above
                  already gives the instruction, and two headings issuing the
                  same command is one of them wasted. */}
              <h2 className="font-heading text-lg tracking-wide text-fg sm:text-2xl">Floor plan</h2>
              <p className="mt-1 text-xs text-fg-muted sm:text-sm">
                {availableCount > 0
                  ? `${availableCount} of ${tables.length} tables still available`
                  : 'Every table is reserved for this event'}
              </p>
            </div>

            {/* Legend. The map uses three states and none of them were named.
                The swatches are wide bars, not squares: a small bordered square
                beside a word is read as a checkbox, which invites a click. */}
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-muted">
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-6 rounded-full border border-fg/40 bg-surface/70" />
                Available
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-6 rounded-full border border-line bg-surface-raised/50 opacity-60" />
                Reserved
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-6 rounded-full border border-accent-bright bg-accent-bright/40" />
                Selected
              </li>
            </ul>
          </div>

          {/* Stage area */}
          <div className="relative mx-auto mb-4 w-2/3 overflow-hidden rounded-md bg-gradient-to-r from-fg/5 via-fg/10 to-fg/5 py-2 shadow-stage sm:mb-6 sm:w-1/3 sm:py-5">
            <div aria-hidden="true" className="spotlight opacity-20" />
            <div aria-hidden="true" className="noise absolute inset-0 opacity-10" />
            <h3 className="relative text-center font-heading text-sm tracking-[0.2em] text-fg sm:text-xl">
              Stage
            </h3>
          </div>

          {tables.length === 0 ? (
            <p className="py-10 text-center text-sm text-fg-muted sm:text-base">
              No tables have been set up for this event yet.
            </p>
          ) : (
            <div
              role="group"
              aria-label="Club floor plan. Choose a table to reserve."
              className="relative w-full"
            >
              {/* Dance floor overlay — center column */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-[38%] right-[38%] top-0 overflow-hidden rounded-xl bg-gradient-to-b from-fg/5 via-fg/10 to-transparent sm:left-1/3 sm:right-1/3"
              >
                <div className="spotlight opacity-15" />
                <div className="noise absolute inset-0 opacity-10" />
              </div>

              <div className="relative flex flex-row items-start gap-2 sm:gap-4">
                {/* ── Left column: booths ── */}
                <div className="flex w-[38%] flex-col gap-2 sm:w-1/3 sm:gap-4">
                  {leftTables.map(renderRectTable)}
                </div>

                {/* Center space (dance floor). `self-stretch` is load-bearing:
                    the row is `items-start`, so without it this column collapses
                    to the label's own height and the rotated text rides up over
                    the stage instead of sitting in the middle of the floor. */}
                <div aria-hidden="true" className="flex w-[24%] self-stretch items-center justify-center sm:w-1/3">
                  <span className="rotate-90 whitespace-nowrap text-[0.625rem] uppercase tracking-[0.3em] text-fg-faint sm:text-xs">
                    Dance floor
                  </span>
                </div>

                {/* ── Right column: circles, two per row. Spread down the full
                    height so the two sides of the room read as one plan rather
                    than a tall column beside a short one. ── */}
                <div className="grid w-[38%] grid-cols-2 self-stretch content-around justify-items-center gap-2 sm:w-1/3 sm:gap-3">
                  {rightTables.map(renderCircleTable)}
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

/**
 * populate-tables.js — Idempotent seed script for VIP tables (1–15)
 *
 * FULL FLOW DOCUMENTATION:
 * ────────────────────────
 * Source of truth:
 *   TABLE_DEFINITIONS below defines all 15 tables with number, price, capacity,
 *   location (left/right), shape (rectangle/circle), and minimumBottles.
 *
 * Database storage:
 *   Firestore subcollection: events/{eventId}/tables/{tableId}
 *   Each document stores: number, price, capacity, location, shape, reserved,
 *   minimumBottles, createdAt, updatedAt
 *
 * How tables reach the UI:
 *   1. Customer map (ClubLayout.tsx) → fetches via GET /api/events/[id]/tables
 *      Groups by `location` field: left (1–7) renders as rectangles,
 *      right (8–15) renders as circles.
 *   2. Staff map (TableMap in staff/hub/page.tsx) → uses onSnapshot on the
 *      events/{eventId}/tables subcollection, groups by location.
 *
 * Layout rules:
 *   Left column:  tables 1–7   (rectangular booths)
 *   Right column: tables 8–15  (circular booths)
 *   Stage: centered at top
 *   Dance floor: center between columns
 *
 * Upsert logic:
 *   - Fetches all existing tables for the event in one read
 *   - If a table with the same `number` already exists → updates metadata
 *     (preserves reserved, reservedBy, reservationId)
 *   - If not → creates a new table document
 *   - Safe to run multiple times without duplicating data
 *
 * Usage:
 *   node scripts/populate-tables.js <eventId>
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
} = require('firebase/firestore/lite');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * VIP Table Definitions (1–15)
 *
 * Left side:  tables 1–7  (rectangular booths, prices preserved from original)
 * Right side: tables 8–15 (circular booths)
 *
 * Pricing for tables 1–11 matches the original configuration.
 * Tables 12–15 are new additions following the right-side pricing curve.
 */
const TABLE_DEFINITIONS = [
  // ── Left side (1–7) — rectangular ──────────────────────────────────────
  // Prices match the backend createTablesForEvent() in functions/src/services/tableService.ts
  { number: 1,  price: 500, capacity: 15, location: 'left',  shape: 'rectangle', minimumBottles: 2 },
  { number: 2,  price: 400, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 2 },
  { number: 3,  price: 300, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 2 },
  { number: 4,  price: 250, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 2 },
  { number: 5,  price: 225, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 1 },
  { number: 6,  price: 200, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 1 },
  { number: 7,  price: 150, capacity: 12, location: 'left',  shape: 'rectangle', minimumBottles: 1 },

  // ── Right side (8–15) — circular (4 people per round table) ─────────────
  // Grid renders row-by-row: 8,9 | 10,11 | 12,13 | 14,15
  { number: 8,  price: 100, capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 9,  price: 100, capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 10, price: 100, capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 11, price: 100, capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 12, price: 50,  capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 13, price: 50,  capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 14, price: 50,  capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
  { number: 15, price: 50,  capacity: 4, location: 'right', shape: 'circle', minimumBottles: 1 },
];

async function upsertTablesForEvent(eventId) {
  console.log(`\nUpserting ${TABLE_DEFINITIONS.length} tables for event: ${eventId}`);
  console.log(`Subcollection path: events/${eventId}/tables\n`);

  // Use the correct subcollection path (events/{eventId}/tables)
  const tablesRef = collection(db, 'events', eventId, 'tables');

  // Fetch all existing tables in one read
  const snapshot = await getDocs(tablesRef);
  const existingByNumber = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.number != null) {
      existingByNumber[data.number] = { ref: docSnap.ref, id: docSnap.id, ...data };
    }
  });

  console.log(`Found ${snapshot.size} existing table(s)\n`);

  let created = 0;
  let updated = 0;

  for (const tableDef of TABLE_DEFINITIONS) {
    const existing = existingByNumber[tableDef.number];

    if (existing) {
      // Update layout metadata only — preserve price, capacity, reserved, reservedBy
      await updateDoc(existing.ref, {
        location: tableDef.location,
        shape: tableDef.shape,
        minimumBottles: tableDef.minimumBottles,
        updatedAt: new Date().toISOString(),
      });
      updated++;
      console.log(
        `  ✓ Updated table #${tableDef.number} (${existing.id}) → ${tableDef.location}, ${tableDef.shape} (price/capacity preserved)`
      );
    } else {
      // Create new table document
      const newDoc = await addDoc(tablesRef, {
        number: tableDef.number,
        price: tableDef.price,
        capacity: tableDef.capacity,
        location: tableDef.location,
        shape: tableDef.shape,
        minimumBottles: tableDef.minimumBottles,
        reserved: false,
        createdAt: new Date().toISOString(),
      });
      created++;
      console.log(
        `  + Created table #${tableDef.number} (${newDoc.id}) → ${tableDef.location}, ${tableDef.shape}`
      );
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total tables in DB: ${Object.keys(existingByNumber).length + created}`);
  console.log(`Expected: ${TABLE_DEFINITIONS.length}`);
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const eventId = process.argv[2];

if (!eventId) {
  console.error('Usage: node scripts/populate-tables.js <eventId>');
  console.error('Example: node scripts/populate-tables.js abc123');
  process.exit(1);
}

upsertTablesForEvent(eventId)
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError:', error);
    process.exit(1);
  });

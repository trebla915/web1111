/**
 * check-tables.js — Verify table configuration for an event
 *
 * Reads from the correct Firestore subcollection: events/{eventId}/tables
 * Reports table counts by location, validates against expected 15-table layout.
 *
 * Usage:
 *   node scripts/check-tables.js <eventId>
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite');

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

async function checkTablesForEvent(eventId) {
  console.log(`Checking tables for event: ${eventId}`);
  console.log(`Subcollection path: events/${eventId}/tables\n`);

  // Use the correct subcollection path
  const tablesRef = collection(db, 'events', eventId, 'tables');
  const snapshot = await getDocs(tablesRef);

  if (snapshot.empty) {
    console.log('No tables found for this event');
    return [];
  }

  const tables = [];
  snapshot.forEach((doc) => {
    tables.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  // Sort by number for clean output
  tables.sort((a, b) => a.number - b.number);

  console.log(`Found ${tables.length} tables:\n`);
  tables.forEach((table) => {
    console.log(`Table #${table.number}: ${table.id}`);
    console.log(`  Location: ${table.location || 'UNKNOWN'}`);
    console.log(`  Shape:    ${table.shape || 'UNKNOWN'}`);
    console.log(`  Price:    $${table.price}`);
    console.log(`  Capacity: ${table.capacity}`);
    console.log(`  Bottles:  ${table.minimumBottles || 'N/A'}`);
    console.log(`  Reserved: ${table.reserved ? 'YES' : 'NO'}`);
    console.log('---');
  });

  // Summary by location
  const leftTables = tables.filter((t) => t.location === 'left');
  const centerTables = tables.filter((t) => t.location === 'center');
  const rightTables = tables.filter((t) => t.location === 'right');
  const unknownTables = tables.filter(
    (t) => !t.location || !['left', 'right', 'center'].includes(t.location)
  );

  console.log('\n─── Location Summary ───');
  console.log(`  Left:    ${leftTables.length} (expected: 7)`);
  console.log(`  Center:  ${centerTables.length} (expected: 0)`);
  console.log(`  Right:   ${rightTables.length} (expected: 8)`);
  if (unknownTables.length > 0) {
    console.log(`  Unknown: ${unknownTables.length}`);
  }
  console.log(`  Total:   ${tables.length} (expected: 15)`);

  // Validation
  const issues = [];
  if (tables.length !== 15) issues.push(`Expected 15 tables, found ${tables.length}`);
  if (leftTables.length !== 7) issues.push(`Expected 7 left tables, found ${leftTables.length}`);
  if (rightTables.length !== 8) issues.push(`Expected 8 right tables, found ${rightTables.length}`);
  if (centerTables.length > 0) issues.push(`Found ${centerTables.length} center table(s) — should be 0`);

  const expectedNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
  const actualNumbers = tables.map((t) => t.number).sort((a, b) => a - b);
  const missing = expectedNumbers.filter((n) => !actualNumbers.includes(n));
  if (missing.length > 0) issues.push(`Missing table numbers: ${missing.join(', ')}`);

  if (issues.length > 0) {
    console.log('\n⚠ Issues found:');
    issues.forEach((issue) => console.log(`  - ${issue}`));
  } else {
    console.log('\n✓ All checks passed');
  }

  return tables;
}

const eventId = process.argv[2];

if (!eventId) {
  console.error('Usage: node scripts/check-tables.js <eventId>');
  process.exit(1);
}

checkTablesForEvent(eventId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error checking tables:', error);
    process.exit(1);
  });

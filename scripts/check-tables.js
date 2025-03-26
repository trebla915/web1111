const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTablesForEvent(eventId) {
  console.log(`Checking tables for event: ${eventId}`);
  
  const tablesRef = collection(db, 'tables');
  const q = query(tablesRef, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log('No tables found for this event');
    return [];
  }
  
  const tables = [];
  snapshot.forEach((doc) => {
    tables.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  console.log(`Found ${tables.length} tables for event ${eventId}:`);
  tables.forEach(table => {
    console.log(`Table #${table.number}: ${table.id}`);
    console.log(` - Location: ${table.location || 'UNKNOWN'}`);
    console.log(` - Price: $${table.price}`);
    console.log(` - Capacity: ${table.capacity}`);
    console.log(` - Reserved: ${table.reserved ? 'YES' : 'NO'}`);
    console.log('---');
  });
  
  // Count by location
  const leftTables = tables.filter(t => t.location === 'left').length;
  const centerTables = tables.filter(t => t.location === 'center').length;
  const rightTables = tables.filter(t => t.location === 'right').length;
  const unknownTables = tables.filter(t => !t.location || !['left', 'right', 'center'].includes(t.location)).length;
  
  console.log('Table locations summary:');
  console.log(` - Left: ${leftTables}`);
  console.log(` - Center: ${centerTables}`);
  console.log(` - Right: ${rightTables}`);
  console.log(` - Unknown location: ${unknownTables}`);
  
  return tables;
}

// Get the event ID from command line arguments
const eventId = process.argv[2];

if (!eventId) {
  console.error('Please provide an event ID as a command line argument');
  process.exit(1);
}

// Run the script
checkTablesForEvent(eventId)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error checking tables:', error);
    process.exit(1);
  }); 
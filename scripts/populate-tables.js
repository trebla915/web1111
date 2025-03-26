const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } = require('firebase/firestore');

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

async function clearExistingTables(eventId) {
  console.log(`Clearing existing tables for event: ${eventId}`);
  
  const tablesRef = collection(db, 'tables');
  const q = query(tablesRef, where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  
  const deletePromises = [];
  snapshot.forEach((doc) => {
    console.log(`Deleting table: ${doc.id}`);
    deletePromises.push(deleteDoc(doc.ref));
  });
  
  await Promise.all(deletePromises);
  console.log(`Deleted ${deletePromises.length} existing tables`);
}

async function addTablesForEvent(eventId) {
  // Clear existing tables first
  await clearExistingTables(eventId);
  
  // Table data
  const tables = [
    // Left section tables
    { number: 1, price: 500, capacity: 4, location: 'left', eventId, reserved: false },
    { number: 2, price: 550, capacity: 6, location: 'left', eventId, reserved: false },
    { number: 3, price: 600, capacity: 4, location: 'left', eventId, reserved: false },
    { number: 4, price: 650, capacity: 8, location: 'left', eventId, reserved: false },
    
    // Center section tables
    { number: 5, price: 800, capacity: 8, location: 'center', eventId, reserved: false },
    { number: 6, price: 900, capacity: 10, location: 'center', eventId, reserved: false },
    { number: 7, price: 850, capacity: 8, location: 'center', eventId, reserved: false },
    
    // Right section tables
    { number: 8, price: 500, capacity: 4, location: 'right', eventId, reserved: false },
    { number: 9, price: 550, capacity: 6, location: 'right', eventId, reserved: false },
    { number: 10, price: 600, capacity: 4, location: 'right', eventId, reserved: false },
    { number: 11, price: 650, capacity: 8, location: 'right', eventId, reserved: false },
  ];
  
  // Add tables to Firestore
  console.log(`Adding ${tables.length} tables for event: ${eventId}`);
  
  const tablesRef = collection(db, 'tables');
  const addPromises = tables.map(table => addDoc(tablesRef, table));
  
  const results = await Promise.all(addPromises);
  console.log(`Successfully added ${results.length} tables`);
  
  return results.length;
}

// Get the event ID from command line arguments
const eventId = process.argv[2];

if (!eventId) {
  console.error('Please provide an event ID as a command line argument');
  process.exit(1);
}

// Run the script
addTablesForEvent(eventId)
  .then(count => {
    console.log(`Added ${count} tables for event ${eventId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error adding tables:', error);
    process.exit(1);
  }); 
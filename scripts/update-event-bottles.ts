import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin with absolute path
const serviceAccount = require(path.resolve(process.cwd(), 'club-1111-firebase-adminsdk-43fx3-c9a39031bf.json'));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateEventBottles() {
  try {
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();
    
    let updatedCount = 0;
    let skippedCount = 0;
    let totalTablesUpdated = 0;
    
    for (const doc of snapshot.docs) {
      const event = doc.data();
      const eventId = doc.id;
      
      console.log(`Processing event: ${event.title || eventId}`);
      
      // Get tables subcollection for this event
      const tablesRef = db.collection('events').doc(eventId).collection('tables');
      const tablesSnapshot = await tablesRef.get();
      
      if (tablesSnapshot.empty) {
        console.log(`No tables found for event ${eventId}`);
        continue;
      }

      let eventTablesUpdated = 0;
      
      // Update each table
      for (const tableDoc of tablesSnapshot.docs) {
        const tableData = tableDoc.data();
        const tableNumber = tableData.number;
        
        // Determine bottle minimum based on table number
        const bottleMinimum = tableNumber >= 1 && tableNumber <= 4 ? 2 : 1;
        
        // Update the table document
        await tableDoc.ref.update({
          bottleMinimum: bottleMinimum
        });
        
        eventTablesUpdated++;
        totalTablesUpdated++;
      }
      
      console.log(`Updated ${eventTablesUpdated} tables for event ${eventId}`);
      updatedCount++;
    }
    
    console.log(`\nUpdate complete:`);
    console.log(`- Processed ${updatedCount} events`);
    console.log(`- Updated ${totalTablesUpdated} tables total`);
    console.log(`- Skipped ${skippedCount} events`);
    
  } catch (error) {
    console.error('Error updating tables:', error);
    process.exit(1);
  }
}

// Run the update
updateEventBottles().then(() => {
  console.log('Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 
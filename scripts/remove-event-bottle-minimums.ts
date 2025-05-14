import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin with absolute path
const serviceAccount = require(path.resolve(process.cwd(), 'club-1111-firebase-adminsdk-43fx3-c9a39031bf.json'));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function removeEventBottleMinimums() {
  try {
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();
    
    let removedCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      const event = doc.data();
      const eventId = doc.id;
      
      if (!event.bottleMinimums) {
        console.log(`Skipping event ${eventId} - no bottleMinimums field found`);
        skippedCount++;
        continue;
      }

      // Remove the bottleMinimums field using FieldValue.delete()
      await eventsRef.doc(eventId).update({
        bottleMinimums: FieldValue.delete()
      });
      
      console.log(`Removed bottleMinimums from event ${eventId} (${event.title || 'No title'})`);
      removedCount++;
    }
    
    console.log(`\nCleanup complete:`);
    console.log(`- Removed bottleMinimums from ${removedCount} events`);
    console.log(`- Skipped ${skippedCount} events (no bottleMinimums field)`);
    
  } catch (error) {
    console.error('Error removing bottleMinimums:', error);
    process.exit(1);
  }
}

// Run the cleanup
removeEventBottleMinimums().then(() => {
  console.log('Cleanup completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
}); 
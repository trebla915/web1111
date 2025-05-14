"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../lib/firebase/admin");
async function updateEventBottles() {
    try {
        const eventsRef = admin_1.adminFirestore.collection('events');
        const snapshot = await eventsRef.get();
        let updatedCount = 0;
        let skippedCount = 0;
        for (const doc of snapshot.docs) {
            const event = doc.data();
            const eventId = doc.id;
            // Skip if event already has bottle minimums
            if (event.bottleMinimums) {
                console.log(`Skipping event ${eventId} - already has bottle minimums`);
                skippedCount++;
                continue;
            }
            // Get all tables for this event
            const tablesRef = admin_1.adminFirestore.collection('events').doc(eventId).collection('tables');
            const tablesSnapshot = await tablesRef.get();
            // Table-based bottle minimum structure based on table numbers
            const bottleMinimums = {
                largeTables: {
                    tableNumbers: [1, 2, 3, 4],
                    min: 2,
                    description: "2 bottle minimum for tables 1-4 (large tables, capacity 15)"
                },
                smallTables: {
                    tableNumbers: [5, 6, 7, 8, 9, 10, 11, 12],
                    min: 1,
                    description: "1 bottle minimum for tables 5-12 (small tables)"
                }
            };
            // Update the event with table-based bottle minimums
            await eventsRef.doc(eventId).update({
                bottleMinimums,
                updatedAt: new Date().toISOString()
            });
            console.log(`Updated event ${eventId} with table-based bottle minimums`);
            console.log(`Event title: ${event.title}`);
            console.log(`Number of tables: ${tablesSnapshot.size}`);
            updatedCount++;
        }
        console.log(`\nMigration complete:`);
        console.log(`- Updated events: ${updatedCount}`);
        console.log(`- Skipped events: ${skippedCount}`);
        console.log(`- Total events: ${snapshot.size}`);
    }
    catch (error) {
        console.error('Error updating events:', error);
        process.exit(1);
    }
}
// Run the migration
updateEventBottles()
    .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});

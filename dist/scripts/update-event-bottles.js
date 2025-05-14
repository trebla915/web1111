"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const path = __importStar(require("path"));
// Initialize Firebase Admin with absolute path
const serviceAccount = require(path.resolve(process.cwd(), 'club-1111-firebase-adminsdk-43fx3-c9a39031bf.json'));
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount)
});
const db = (0, firestore_1.getFirestore)();
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
    }
    catch (error) {
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

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
                bottleMinimums: firestore_1.FieldValue.delete()
            });
            console.log(`Removed bottleMinimums from event ${eventId} (${event.title || 'No title'})`);
            removedCount++;
        }
        console.log(`\nCleanup complete:`);
        console.log(`- Removed bottleMinimums from ${removedCount} events`);
        console.log(`- Skipped ${skippedCount} events (no bottleMinimums field)`);
    }
    catch (error) {
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

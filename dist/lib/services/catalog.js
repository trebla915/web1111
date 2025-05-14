"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBottleImage = exports.deleteBottleFromCatalog = exports.updateBottleInCatalog = exports.addBottleToCatalog = exports.fetchAllBottlesFromCatalog = void 0;
const config_1 = require("@/lib/firebase/config");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
/**
 * Fetch all bottles from the catalog
 * @returns An array of bottles
 */
const fetchAllBottlesFromCatalog = async () => {
    try {
        const bottlesCollection = (0, firestore_1.collection)(config_1.db, 'bottleCatalog');
        const q = (0, firestore_1.query)(bottlesCollection, (0, firestore_1.orderBy)('name'));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            price: parseFloat(doc.data().price) // Ensure price is a number
        }));
    }
    catch (error) {
        console.error('Error fetching all bottles:', error);
        throw error;
    }
};
exports.fetchAllBottlesFromCatalog = fetchAllBottlesFromCatalog;
/**
 * Add a new bottle to the catalog
 * @param bottleData The bottle data to add
 * @returns The ID of the newly created bottle
 */
const addBottleToCatalog = async (bottleData) => {
    try {
        const bottlesCollection = (0, firestore_1.collection)(config_1.db, 'bottleCatalog');
        const bottleToAdd = {
            ...bottleData,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now()
        };
        const docRef = await (0, firestore_1.addDoc)(bottlesCollection, bottleToAdd);
        console.log('Bottle added with ID:', docRef.id);
        return docRef.id;
    }
    catch (error) {
        console.error('Error adding bottle to catalog:', error);
        throw error;
    }
};
exports.addBottleToCatalog = addBottleToCatalog;
/**
 * Update a bottle in the catalog
 * @param bottleId The ID of the bottle to update
 * @param updateData The data to update
 */
const updateBottleInCatalog = async (bottleId, updateData) => {
    try {
        const bottleRef = (0, firestore_1.doc)(config_1.db, 'bottleCatalog', bottleId);
        // Check if the bottle exists
        const bottleSnap = await (0, firestore_1.getDoc)(bottleRef);
        if (!bottleSnap.exists()) {
            throw new Error(`Bottle with ID ${bottleId} not found`);
        }
        // Update the bottle with new data
        await (0, firestore_1.updateDoc)(bottleRef, {
            ...updateData,
            updatedAt: firestore_1.Timestamp.now()
        });
        console.log(`Bottle ${bottleId} updated successfully`);
    }
    catch (error) {
        console.error('Error updating bottle in catalog:', error);
        throw error;
    }
};
exports.updateBottleInCatalog = updateBottleInCatalog;
/**
 * Delete a bottle from the catalog
 * @param bottleId The ID of the bottle to delete
 */
const deleteBottleFromCatalog = async (bottleId) => {
    try {
        const bottleRef = (0, firestore_1.doc)(config_1.db, 'bottleCatalog', bottleId);
        // Check if the bottle exists
        const bottleSnap = await (0, firestore_1.getDoc)(bottleRef);
        if (!bottleSnap.exists()) {
            throw new Error(`Bottle with ID ${bottleId} not found`);
        }
        // Delete the bottle
        await (0, firestore_1.deleteDoc)(bottleRef);
        console.log(`Bottle ${bottleId} deleted successfully`);
    }
    catch (error) {
        console.error('Error deleting bottle from catalog:', error);
        throw error;
    }
};
exports.deleteBottleFromCatalog = deleteBottleFromCatalog;
/**
 * Upload a bottle image to storage
 * @param bottleId The ID of the bottle
 * @param file The file to upload
 * @returns The download URL of the uploaded image
 */
const uploadBottleImage = async (bottleId, file) => {
    try {
        // Create a storage reference
        const storageRef = (0, storage_1.ref)(config_1.storage, `bottles/${bottleId}/${Date.now()}_${file.name}`);
        // Convert the file to a Blob if needed
        const fileBlob = file instanceof Blob ? file : await file.arrayBuffer().then(buffer => new Blob([buffer]));
        // Upload the file
        const snapshot = await (0, storage_1.uploadBytes)(storageRef, fileBlob);
        console.log('Uploaded bottle image:', snapshot.ref.fullPath);
        // Get the download URL
        const downloadURL = await (0, storage_1.getDownloadURL)(snapshot.ref);
        return downloadURL;
    }
    catch (error) {
        console.error('Error uploading bottle image:', error);
        throw error;
    }
};
exports.uploadBottleImage = uploadBottleImage;

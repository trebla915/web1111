import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '../config/firebase';

/**
 * Infers MIME type from a file URI.
 * @param {string} uri
 * @returns {string} MIME type
 */
const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Uploads an image to Firebase Storage and returns its download URL.
 * @param {string} uri - Local file URI.
 * @param {string} path - Storage path.
 * @returns {Promise<string>} - Download URL.
 */
export const uploadImageToStorage = async (uri: string, path: string): Promise<string> => {
  try {
    console.log(`[uploadImageToStorage] Starting upload. URI: ${uri}, Path: ${path}`);

    if (!uri.startsWith('file://') && !uri.startsWith('http')) {
      console.error(`[uploadImageToStorage] Invalid URI: ${uri}`);
      throw new Error(`Invalid URI: ${uri}`);
    }

    // Fetch the file from the URI
    console.log(`[uploadImageToStorage] Fetching file from URI...`);
    const response = await fetch(uri);
    console.log(`[uploadImageToStorage] Fetch response status: ${response.status}`);
    if (!response.ok) {
      console.error(`[uploadImageToStorage] Failed to fetch file for upload. Status: ${response.status}`);
      throw new Error(`Failed to fetch file for upload. Status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log(`[uploadImageToStorage] Blob fetched. Size: ${blob.size} bytes, Type: ${blob.type}`);

    if (blob.size === 0) {
      console.error(`[uploadImageToStorage] Blob size is zero. URI: ${uri}`);
      throw new Error(`Blob size is zero. URI: ${uri}`);
    }

    // Modular Firebase Storage usage
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, path);
    const metadata = { contentType: getMimeType(uri) };
    await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`[uploadImageToStorage] File uploaded successfully. Download URL: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`[uploadImageToStorage] Error uploading image:`, error);
    throw error;
  }
};

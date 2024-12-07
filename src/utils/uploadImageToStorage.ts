import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase.native';

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

    // Validate URI
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

    // Check for empty blob
    if (blob.size === 0) {
      console.error(`[uploadImageToStorage] Blob size is zero. URI: ${uri}`);
      throw new Error(`Blob size is zero. URI: ${uri}`);
    }

    // Create Firebase storage reference
    const storageRef = ref(storage, path);
    console.log(`[uploadImageToStorage] Created storage reference at path: ${path}`);

    // Metadata for the upload
    const metadata = { contentType: getMimeType(uri) };
    console.log(`[uploadImageToStorage] Metadata for upload: ${JSON.stringify(metadata)}`);

    // Upload blob to Firebase Storage
    console.log(`[uploadImageToStorage] Uploading blob to Firebase Storage...`);
    await uploadBytes(storageRef, blob, metadata);
    console.log(`[uploadImageToStorage] File uploaded successfully.`);

    // Get the download URL
    console.log(`[uploadImageToStorage] Generating download URL...`);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`[uploadImageToStorage] Download URL generated: ${downloadUrl}`);

    return downloadUrl;

  } catch (err) {
    const error = err as Error; // Explicitly cast 'err' to 'Error'
    console.error(`[uploadImageToStorage] Error during file upload: ${error.message}`);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

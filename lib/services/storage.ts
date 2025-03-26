import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, getStorage, uploadString } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Helper to generate a direct Firebase storage upload URL with authentication
async function getAuthenticatedUploadUrl(path: string): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("Cannot generate authenticated URL: No user is logged in");
      return null;
    }
    
    const token = await user.getIdToken(true);
    const bucket = getStorage().app.options.storageBucket;
    
    if (!bucket) {
      console.error("Cannot generate authenticated URL: No storage bucket configured");
      return null;
    }
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(path)}&uploadType=media`;
  } catch (error) {
    console.error("Error generating authenticated upload URL:", error);
    return null;
  }
}

// Alternative upload method using Base64 string
async function uploadBase64(file: File | Blob, path: string): Promise<string> {
  try {
    console.log(`[uploadBase64] Starting base64 upload for path: ${path}`);
    
    // Convert file to base64
    const reader = new FileReader();
    
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Extract the base64 data part (remove the prefix)
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
    
    reader.readAsDataURL(file);
    const base64Data = await base64Promise;
    
    console.log(`[uploadBase64] File converted to base64. Size: ~${Math.round(base64Data.length * 0.75 / 1024)}KB`);
    
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload using base64 string
    console.log(`[uploadBase64] Uploading base64 data...`);
    const fileType = file.type || 'image/jpeg';
    const uploadResult = await uploadString(storageRef, base64Data, 'base64', {
      contentType: fileType,
      customMetadata: {
        originalName: file instanceof File ? file.name : 'uploaded-file',
        uploadedAt: new Date().toISOString(),
        uploadMethod: 'base64'
      }
    });
    
    console.log(`[uploadBase64] Base64 upload successful: ${uploadResult.ref.fullPath}`);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log(`[uploadBase64] Download URL generated: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error(`[uploadBase64] Base64 upload failed:`, error);
    throw error;
  }
}

// Alternative upload method using fetch directly
async function uploadWithFetch(file: File | Blob, path: string): Promise<string> {
  const uploadUrl = await getAuthenticatedUploadUrl(path);
  
  if (!uploadUrl) {
    throw new Error("Failed to generate authenticated upload URL");
  }
  
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken(true);
  
  if (!token) {
    throw new Error("No authentication token available");
  }
  
  console.log(`[uploadWithFetch] Uploading file to ${path} using direct fetch API`);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Authorization': `Firebase ${token}`
    },
    body: file
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[uploadWithFetch] Upload failed: ${response.status} ${response.statusText}`);
    console.error(`[uploadWithFetch] Error response:`, errorText);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[uploadWithFetch] Upload successful, response:`, data);
  
  // Extract the download URL from the response or generate it
  const storageRef = ref(storage, path);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

/**
 * Uploads an image file to Firebase Storage with extensive debug logging
 * @param file - The file to upload
 * @param path - The storage path where the file should be saved
 * @returns A promise that resolves to the download URL of the uploaded file
 */
export const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
  // Get current auth state for debugging
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  console.log('====== STORAGE UPLOAD DEBUG ======');
  console.log('> Current auth state:', {
    isSignedIn: !!currentUser,
    userId: currentUser?.uid || 'not signed in',
    email: currentUser?.email || 'no email',
    authTime: currentUser?.metadata?.creationTime || 'unknown',
    lastSignInTime: currentUser?.metadata?.lastSignInTime || 'unknown',
  });
  
  console.log('> Upload path:', path);
  console.log('> File details:', {
    name: file.name,
    type: file.type,
    size: `${Math.round(file.size / 1024)} KB`,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  // Debugging storage configuration
  const currentStorage = getStorage();
  console.log('> Storage config:', {
    bucket: currentStorage.app.options.storageBucket,
    authDomain: currentStorage.app.options.authDomain,
  });
  
  try {
    console.log(`[uploadImageToStorage] Starting upload. File name: ${file.name}, Path: ${path}`);
    
    // Validate file
    if (!file || file.size === 0) {
      console.error(`[uploadImageToStorage] Invalid file: ${file?.name || 'undefined'}`);
      throw new Error('Invalid file. The file is empty or undefined.');
    }
    
    // Force token refresh before upload
    if (currentUser) {
      try {
        console.log('> Forcing token refresh before upload...');
        await currentUser.getIdToken(true);
        console.log('> Token refreshed successfully');
      } catch (tokenError) {
        console.error('> Token refresh failed:', tokenError);
      }
    } else {
      console.error('> No user is logged in, upload will likely fail');
      throw new Error('You must be logged in to upload files');
    }

    // Create a storage reference
    const storageRef = ref(storage, path);
    console.log(`[uploadImageToStorage] Created storage reference at path: ${path}`);

    // Check if we need to convert the file to a Blob
    let fileBlob: Blob;
    if (file instanceof Blob) {
      fileBlob = file;
    } else {
      // Convert File to Blob to ensure compatibility
      const arrayBuffer = await file.arrayBuffer();
      fileBlob = new Blob([arrayBuffer], { type: file.type });
    }
    
    console.log(`[uploadImageToStorage] Prepared blob for upload. Size: ${fileBlob.size} bytes, Type: ${fileBlob.type || file.type}`);

    // Prepare metadata
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    console.log(`[uploadImageToStorage] Upload metadata:`, metadata);
    
    // Upload the file
    console.log(`[uploadImageToStorage] Uploading file to Firebase Storage...`);
    
    let downloadURL: string;
    let uploadMethod = 'standard';
    
    try {
      // Try base64 upload first (most reliable method)
      console.log(`[uploadImageToStorage] Attempting base64 upload method...`);
      uploadMethod = 'base64';
      downloadURL = await uploadBase64(fileBlob, path);
    } catch (base64Error) {
      console.error(`[uploadImageToStorage] Base64 upload failed, trying standard method:`, base64Error);
      
      try {
        // Try standard Firebase upload next
        console.log(`[uploadImageToStorage] Attempting standard upload method...`);
        uploadMethod = 'standard';
        const snapshot = await uploadBytes(storageRef, fileBlob, metadata);
        console.log(`[uploadImageToStorage] Uploaded file successfully to: ${snapshot.ref.fullPath}`);
        
        // Get the download URL
        console.log(`[uploadImageToStorage] Generating download URL...`);
        downloadURL = await getDownloadURL(snapshot.ref);
      } catch (standardUploadError) {
        console.error(`[uploadImageToStorage] Standard upload failed, trying fetch method:`, standardUploadError);
        
        // Try direct fetch upload as last resort
        console.log(`[uploadImageToStorage] Attempting fetch upload method...`);
        uploadMethod = 'fetch';
        downloadURL = await uploadWithFetch(fileBlob, path);
      }
    }
    
    console.log(`[uploadImageToStorage] Upload successful using ${uploadMethod} method.`);
    console.log(`[uploadImageToStorage] Download URL generated: ${downloadURL}`);
    console.log('====== END STORAGE UPLOAD DEBUG ======');
    
    return downloadURL;
  } catch (error: any) {
    console.error(`====== STORAGE UPLOAD ERROR ======`);
    console.error(`> Error code:`, error.code || 'No error code');
    console.error(`> Error message:`, error.message);
    console.error(`> Error full details:`, error);
    console.error(`> Storage path attempted:`, path);
    console.error(`> User authenticated:`, !!currentUser);
    console.error(`====== END STORAGE UPLOAD ERROR ======`);
    
    // Enhanced error handling with specific messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Unauthorized access to storage. Check authentication and storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded.');
    } else if (error.code === 'storage/invalid-argument') {
      throw new Error(`Invalid argument: ${error.message}`);
    } else if (error.code === 'storage/invalid-format') {
      throw new Error('Invalid format. Check file type.');
    } else if (error.code?.startsWith('auth/')) {
      throw new Error(`Authentication error: ${error.code} - ${error.message}`);
    } else if (error.code?.startsWith('storage/')) {
      throw new Error(`Storage error: ${error.code} - ${error.message}`);
    }
    
    throw new Error(`File upload failed: ${error.message || 'Unknown error'}`);
  }
}; 
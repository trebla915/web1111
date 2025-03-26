import { apiClient, handleApiError } from '@/lib/api/client';

export const StorageService = {
  /**
   * Upload image to storage
   * @param uri - The local URI of the image
   * @param filePath - The destination path in storage
   * @returns The public URL of the uploaded image
   */
  uploadImage: async (uri: string, filePath: string): Promise<string> => {
    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      
      // Get the filename from the URI
      const uriParts = uri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Append the image file to the form data
      const file = {
        uri,
        name: fileName,
        type: 'image/jpeg', // Adjust based on your image type
      };
      
      // @ts-ignore - Type mismatch is expected here between React Native and form-data
      formData.append('file', file);
      formData.append('filePath', filePath);
      
      // Make a POST request to upload the image
      const response = await apiClient.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.url;
    } catch (error) {
      handleApiError(error, 'upload image');
      throw new Error('Failed to upload image');
    }
  }
}; 
import { Client, Account, Storage, ID } from 'appwrite';

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const storage = new Storage(client);
export { ID };

// Storage bucket ID for food images
const FOOD_IMAGES_BUCKET_ID = import.meta.env.VITE_APPWRITE_FOOD_IMAGES_BUCKET_ID || 'food-images';

/**
 * Upload a food image to Appwrite Storage and return the public URL
 * @param {string} imageDataUrl - Base64 data URL (data:image/jpeg;base64,...)
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null if failed
 */
export async function uploadFoodImage(imageDataUrl) {
  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
    console.log('Invalid or no image data URL to upload');
    return null;
  }

  try {
    // Extract base64 data and mime type from data URL
    const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid data URL format');
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const fileExtension = mimeType.split('/')[1] || 'jpeg';
    const fileName = `food_${Date.now()}.${fileExtension}`;

    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create a File object from the Blob
    const file = new File([blob], fileName, { type: mimeType });

    console.log('Uploading file:', { name: file.name, type: file.type, size: file.size });

    // Upload to Appwrite Storage
    const response = await storage.createFile(
      FOOD_IMAGES_BUCKET_ID,
      ID.unique(),
      file
    );

    console.log('Upload response:', response);

    if (!response || !response.$id) {
      console.error('Invalid response from storage.createFile:', response);
      return null;
    }

    // Construct the file view URL
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const fileUrl = `${endpoint}/storage/buckets/${FOOD_IMAGES_BUCKET_ID}/files/${response.$id}/view?project=${projectId}`;

    console.log('Food image uploaded successfully:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Failed to upload food image:', error);
    return null;
  }
}

export async function sendPasswordRecovery(email, redirectUrl) {
  try {
    await account.createRecovery(email, redirectUrl);
    return { success: true };
  } catch (error) {
    console.error("Recovery Error:", error);
    throw new Error(error.message);
  }
}
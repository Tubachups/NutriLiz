import { Client, Account, Storage, ID } from 'react-native-appwrite';
import * as FileSystem from 'expo-file-system/legacy';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)   // Your Project ID
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);   // Your package name / bundle identifier

export const account = new Account(client);
export const storage = new Storage(client);

// Storage bucket ID for food images
const FOOD_IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID || 'food-images';

/**
 * Upload a food image to Appwrite Storage and return the public URL
 * @param {string} imageUri - Local file URI (file:///...)
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null if failed
 */
export async function uploadFoodImage(imageUri) {
  if (!imageUri || !imageUri.startsWith('file://')) {
    console.log('Invalid or no image URI to upload');
    return null;
  }

  try {
    // Get file info from URI
    const fileName = imageUri.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    const newFileName = `food_${Date.now()}.${fileExtension}`;

    // Get file size using expo-file-system
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.error('File does not exist:', imageUri);
      return null;
    }

    // The SDK expects a file object with uri, name, type, and size properties
    const file = {
      uri: imageUri,
      name: newFileName,
      type: mimeType,
      size: fileInfo.size,
    };

    console.log('Uploading file:', { name: file.name, type: file.type, size: file.size });

    // Upload to Appwrite Storage using object-style parameters
    const response = await storage.createFile({
      bucketId: FOOD_IMAGES_BUCKET_ID,
      fileId: ID.unique(),
      file: file,
    });

    console.log('Upload response:', JSON.stringify(response));

    if (!response || !response.$id) {
      console.error('Invalid response from storage.createFile:', response);
      return null;
    }

    // Construct the file view URL manually to ensure correct format
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    const fileUrl = `${endpoint}/storage/buckets/${FOOD_IMAGES_BUCKET_ID}/files/${response.$id}/view?project=${projectId}`;

    console.log('Food image uploaded successfully:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Failed to upload food image:', error);
    return null;
  }
}

export async function sendPasswordRecovery(email) {
  try {
    // This generates the deep link to your resetPass page
    const redirectUrl = 'https://nutri-liz.vercel.app/'; // Adjust according to your app's URL scheme
    
    await account.createRecovery({
      email: email,
      url: redirectUrl
  });
    return { success: true };
  } catch (error) {
    console.error("Recovery Error:", error);
    throw new Error(error.message);
  }
}
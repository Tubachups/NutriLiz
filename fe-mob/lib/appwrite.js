import { Client, Account, Storage, ID } from 'react-native-appwrite';
import * as FileSystem from 'expo-file-system/legacy';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) 
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)  

export const account = new Account(client);
export const storage = new Storage(client);

WebBrowser.maybeCompleteAuthSession();

const OAUTH_PROVIDERS = {
  google: 'google',
  facebook: 'facebook',
}

const FOOD_IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID || 'food-images';

/**
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

    const file = {
      uri: imageUri,
      name: newFileName,
      type: mimeType,
      size: fileInfo.size,
    };

    console.log('Uploading file:', { name: file.name, type: file.type, size: file.size });

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


export async function oauthLogin(provider) {
  try {
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    if (!projectId) {
      return { success: false, error: 'Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID.' };
    }

    const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
    const scheme = `appwrite-callback-${projectId}`;

    const loginUrl = await account.createOAuth2Token({
      provider: OAUTH_PROVIDERS[provider],
      success: `${deepLink}`,
      failure: `${deepLink}`,
    });

    const authResult = await WebBrowser.openAuthSessionAsync(`${loginUrl}`, scheme);

    if (authResult.type !== 'success' || !authResult.url) {
      return { success: false, error: 'Google login was cancelled.' };
    }

    const url = new URL(authResult.url);
    const secret = url.searchParams.get('secret');
    const userId = url.searchParams.get('userId');

    if (!secret || !userId) {
      return { success: false, error: 'OAuth callback is missing session credentials.' };
    }

    await account.createSession({ userId, secret });
    return { success: true };
  } catch (error) {
    console.error('Google OAuth sign-in failed:', error);
    return { success: false, error: error?.message || 'Google login failed.' };
  }
}

export const signInWithGoogleOauth = () => oauthLogin('google');
export const signInWithFacebookOauth = () => oauthLogin('facebook');
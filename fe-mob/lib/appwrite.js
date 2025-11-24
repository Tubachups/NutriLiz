import { Client, Account } from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)   // Your Project ID
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);   // Your package name / bundle identifier

export const account = new Account(client);

export async function sendPasswordRecovery(email) {
  try {
    // This generates the deep link to your resetPass page
    const redirectUrl = 'http://localhost:3000'; // Adjust according to your app's URL scheme
    
    await account.createRecovery(
      email,
      redirectUrl
    );
    return { success: true };
  } catch (error) {
    console.error("Recovery Error:", error);
    throw new Error(error.message);
  }
}

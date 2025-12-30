import { Client, Account } from 'appwrite';

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)   // Your Project ID


export const account = new Account(client);
export { ID } from 'appwrite';

export async function sendPasswordRecovery(email, redirectUrl) {
  try {
    await account.createRecovery(email, redirectUrl);
    return { success: true };
  } catch (error) {
    console.error("Recovery Error:", error);
    throw new Error(error.message);
  }
}

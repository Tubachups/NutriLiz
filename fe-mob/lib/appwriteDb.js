import { client } from './appwrite.js';
import {  Databases, ID, Query } from 'react-native-appwrite';

const databases = new Databases(client);

const DATABASE_ID = process.env .EXPO_PUBLIC_APPWRITE_DATABASE_ID; 
const PROFILES_COLLECTION_ID = process.env .EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID; 

export const saveUserProfile = async (userId, profileData) => {
  try {
    // Try to get existing profile
    const existingProfiles = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (existingProfiles.documents.length > 0) {
      // Update existing profile
      return await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        existingProfiles.documents[0].$id,
        profileData
      );
    } else {
      // Create new profile
      return await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          ...profileData
        }
      );
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const profiles = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    return profiles.documents.length > 0 ? profiles.documents[0] : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
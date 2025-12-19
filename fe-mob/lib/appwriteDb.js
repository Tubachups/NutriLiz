import { client } from './appwrite.js';
import { TablesDB, ID, Query } from 'react-native-appwrite';

const tablesDB = new TablesDB(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID; 
const PROFILES_TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID; 

export const saveUserProfile = async (userId, profileData) => {
  try {
    // Try to get existing profile
    const existingProfiles = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PROFILES_TABLE_ID,
      queries: [Query.equal('userId', userId)]
    });

    if (existingProfiles.rows.length > 0) {
      // Update existing profile
      return await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: PROFILES_TABLE_ID,
        rowId: existingProfiles.rows[0].$id,
        data: profileData
      });
    } else {
      // Create new profile
      return await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: PROFILES_TABLE_ID,
        rowId: ID.unique(),
        data: {
          userId,
          ...profileData
        }
      });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const profiles = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PROFILES_TABLE_ID,
      queries: [Query.equal('userId', userId)]
    });

    return profiles.rows.length > 0 ? profiles.rows[0] : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
import { client } from './appwrite.js';
import { TablesDB, ID, Query } from 'react-native-appwrite';

const tablesDB = new TablesDB(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID; 
const PROFILES_TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;
const PRODUCT_HISTORY_TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCT_HISTORY_COLLECTION_ID; 

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

export const saveProductToHistory = async (userId, productData) => {
  try {
    const result = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_HISTORY_TABLE_ID,
      rowId: ID.unique(),
      data: {
        userId,
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand || '',
        image: productData.image || '',
        nutriscore: productData.nutriscore || '',
        scannedAt: productData.scannedAt,
        productData: JSON.stringify(productData.productData), // Store as JSON string
        // type field not stored in DB - use barcode prefix to detect type
      }
    });
    return result;
  } catch (error) {
    console.error('Error saving product to history:', error);
    throw error;
  }
};

export const getProductHistory = async (userId) => {
  try {
    const products = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_HISTORY_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.orderDesc('scannedAt'),
        Query.limit(100) // Limit to last 100 products
      ]
    });

    // Parse the productData JSON string back to object
    return products.rows.map(row => ({
      id: row.$id,
      barcode: row.barcode,
      name: row.name,
      brand: row.brand,
      image: row.image,
      nutriscore: row.nutriscore,
      scannedAt: row.scannedAt,
      productData: JSON.parse(row.productData),
      type: row.type || (row.barcode?.startsWith('food_') ? 'food' : 'product'), // Restore type field with fallback
    }));
  } catch (error) {
    console.error('Error fetching product history:', error);
    throw error;
  }
};

export const deleteProductFromHistory = async (productId) => {
  try {
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_HISTORY_TABLE_ID,
      rowId: productId,
    });
  } catch (error) {
    console.error('Error deleting product from history:', error);
    throw error;
  }
};

export const deleteMultipleProductsFromHistory = async (productIds) => {
  try {
    await Promise.all(
      productIds.map(id => 
        tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: PRODUCT_HISTORY_TABLE_ID,
          rowId: id,
        })
      )
    );
  } catch (error) {
    console.error('Error deleting multiple products from history:', error);
    throw error;
  }
};

export const clearAllProductHistory = async (userId) => {
  try {
    // First, get all products for this user
    const products = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_HISTORY_TABLE_ID,
      queries: [Query.equal('userId', userId)]
    });

    // Delete all products
    await Promise.all(
      products.rows.map(row =>
        tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: PRODUCT_HISTORY_TABLE_ID,
          rowId: row.$id,
        })
      )
    );
  } catch (error) {
    console.error('Error clearing product history:', error);
    throw error;
  }
};

export const updateProductInHistory = async (rowId, productData) => {
  try {
    const result = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: PRODUCT_HISTORY_TABLE_ID,
      rowId: rowId,
      data: {
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand || '',
        image: productData.image || '',
        nutriscore: productData.nutriscore || '',
        scannedAt: productData.scannedAt,
        productData: JSON.stringify(productData.productData),
        // type field not stored in DB - use barcode prefix to detect type
      }
    });
    return result;
  } catch (error) {
    console.error('Error updating product in history:', error);
    throw error;
  }
};
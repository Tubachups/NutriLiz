import { client } from './appwrite.js';
import { Databases, ID, Query } from 'appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID; 
const PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
const PRODUCT_HISTORY_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCT_HISTORY_COLLECTION_ID;

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

// Product History Functions
export const saveProductToHistory = async (userId, productData) => {
  try {
    const result = await databases.createDocument(
      DATABASE_ID,
      PRODUCT_HISTORY_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand || '',
        image: productData.image || '',
        nutriscore: productData.nutriscore || '',
        scannedAt: productData.scannedAt,
        productData: JSON.stringify(productData.productData),
        // Note: type field is not stored in DB - use barcode prefix to detect type
      }
    );
    return result;
  } catch (error) {
    console.error('Error saving product to history:', error);
    throw error;
  }
};


export const getProductHistory = async (userId) => {
  try {
    const products = await databases.listDocuments(
      DATABASE_ID,
      PRODUCT_HISTORY_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('scannedAt'),
        Query.limit(100)
      ]
    );

    return products.documents.map(doc => ({
      id: doc.$id,
      barcode: doc.barcode,
      name: doc.name,
      brand: doc.brand,
      image: doc.image,
      nutriscore: doc.nutriscore,
      scannedAt: doc.scannedAt,
      productData: JSON.parse(doc.productData),
      // Restore type field from barcode prefix (not stored in DB)
      type: doc.barcode?.startsWith('food_') ? 'food' : 'barcode',
    }));
  } catch (error) {
    console.error('Error fetching product history:', error);
    throw error;
  }
};

export const deleteProductFromHistory = async (productId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PRODUCT_HISTORY_COLLECTION_ID,
      productId
    );
  } catch (error) {
    console.error('Error deleting product from history:', error);
    throw error;
  }
};

export const deleteMultipleProductsFromHistory = async (productIds) => {
  try {
    await Promise.all(
      productIds.map(id => 
        databases.deleteDocument(
          DATABASE_ID,
          PRODUCT_HISTORY_COLLECTION_ID,
          id
        )
      )
    );
  } catch (error) {
    console.error('Error deleting multiple products from history:', error);
    throw error;
  }
};

export const clearAllProductHistory = async (userId) => {
  try {
    const products = await databases.listDocuments(
      DATABASE_ID,
      PRODUCT_HISTORY_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    await Promise.all(
      products.documents.map(doc =>
        databases.deleteDocument(
          DATABASE_ID,
          PRODUCT_HISTORY_COLLECTION_ID,
          doc.$id
        )
      )
    );
  } catch (error) {
    console.error('Error clearing product history:', error);
    throw error;
  }
};

export const updateProductInHistory = async (documentId, productData) => {
  try {
    const result = await databases.updateDocument(
      DATABASE_ID,
      PRODUCT_HISTORY_COLLECTION_ID,
      documentId,
      {
        barcode: productData.barcode,
        name: productData.name,
        brand: productData.brand || '',
        image: productData.image || '',
        nutriscore: productData.nutriscore || '',
        scannedAt: productData.scannedAt,
        productData: JSON.stringify(productData.productData),
        // Note: type field is not stored in DB - use barcode prefix to detect type
      }
    );
    return result;
  } catch (error) {
    console.error('Error updating product in history:', error);
    throw error;
  }
};
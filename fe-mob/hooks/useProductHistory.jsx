import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';
import {
  saveProductToHistory,
  getProductHistory,
  deleteProductFromHistory,
  deleteMultipleProductsFromHistory,
  clearAllProductHistory,
  updateProductInHistory
} from '../lib/appwriteDb';
import { uploadFoodImage } from '../lib/appwrite';

// Create the context
const ProductHistoryContext = createContext(undefined);

// Provider component
export function ProductHistoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { user } = useAuth();

  // Load product history from Appwrite when user logs in
  useEffect(() => {
    if (user) {
      loadProductHistory();
    } else {
      // Clear local state when user logs out
      setProducts([]);
      setSelectedIds(new Set());
    }
  }, [user]);

  // Load product history from Appwrite
  const loadProductHistory = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const history = await getProductHistory(user.$id);
      setProducts(history);
    } catch (error) {
      console.error('Failed to load product history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a product to history
  const addProduct = useCallback(async (productData, barcode) => {
    const newProduct = {
      barcode,
      name: productData.product_name || productData.name || 'Unknown Product',
      brand: productData.brands || productData.brand || '',
      image: productData.image_url || productData.imageUrl || null,
      nutriscore: productData.nutriscore_grade || productData.nutriscoreGrade || productData.nutri_grade || null,
      scannedAt: new Date().toISOString(),
      productData, // Store full data for navigation
    };

    // Check if product with same barcode already exists
    const existingProduct = products.find(p => p.barcode === barcode);

    if (existingProduct) {
      // Update existing product - move it to the top with updated timestamp
      const updatedProduct = { ...newProduct, id: existingProduct.id };
      setProducts(prev => [
        updatedProduct,
        ...prev.filter(p => p.barcode !== barcode)
      ]);

      // Update in Appwrite if user is logged in
      if (user) {
        try {
          await updateProductInHistory(existingProduct.id, newProduct);
        } catch (error) {
          console.error('Failed to update product in Appwrite:', error);
        }
      }

      return updatedProduct;
    }

    // If product doesn't exist, add new entry
    const tempId = `temp_${Date.now()}`;
    const tempProduct = { ...newProduct, id: tempId };
    setProducts(prev => [tempProduct, ...prev]);

    // Save to Appwrite if user is logged in
    if (user) {
      try {
        const savedProduct = await saveProductToHistory(user.$id, newProduct);
        // Update the temp product with the real ID from Appwrite
        setProducts(prev => 
          prev.map(p => p.id === tempId ? { ...newProduct, id: savedProduct.$id } : p)
        );
        return { ...newProduct, id: savedProduct.$id };
      } catch (error) {
        console.error('Failed to save product to Appwrite:', error);
        // Keep the temp product in local state even if save fails
      }
    }

    return tempProduct;
  }, [user, products]);

  // Add a food item (from photo scan) to history
  const addFoodItem = useCallback(async (foodData, imageUri = null) => {
    const foodName = foodData.name || foodData.food_name || 'Unknown Food';
    
    // Find ALL food items with the same name (to handle duplicates)
    const duplicateFoods = products.filter(
      p => (p.type === 'food' || p.barcode?.startsWith('food_')) && 
           (p.name?.toLowerCase() === foodName.toLowerCase())
    );
    
    // Use the first existing food item as the one to update
    const existingFood = duplicateFoods.length > 0 ? duplicateFoods[0] : null;
    
    // Get IDs of other duplicates to delete (all except the first one)
    const duplicateIdsToDelete = duplicateFoods.slice(1).map(p => p.id);

    // Upload image to cloud storage if it's a local file
    // This ensures the image URL works on both mobile and web
    let cloudImageUrl = existingFood?.image || null;
    if (imageUri && imageUri.startsWith('file://')) {
      try {
        const uploadedUrl = await uploadFoodImage(imageUri);
        if (uploadedUrl) {
          cloudImageUrl = uploadedUrl;
        }
      } catch (error) {
        console.log('Image upload failed, will use local URI for mobile only');
        cloudImageUrl = imageUri; // Fallback to local URI for mobile
      }
    } else if (imageUri) {
      cloudImageUrl = imageUri;
    }

    const newProduct = {
      barcode: existingFood?.barcode || `food_${Date.now()}`, // Reuse existing barcode/ID or generate new
      name: foodName,
      brand: '', // Food items don't have brands
      image: cloudImageUrl, // Use cloud URL for cross-platform compatibility
      nutriscore: foodData.health_score || foodData.nutrition_score || foodData.nutri_score_estimate || null,
      scannedAt: new Date().toISOString(),
      productData: foodData, // Store full food data for navigation
      type: 'food', // Mark as food item to distinguish from barcode products
    };

    if (existingFood) {
      // Update existing food item - move it to the top with updated timestamp
      // Also remove any duplicate food items with the same name
      const updatedProduct = { ...newProduct, id: existingFood.id };
      setProducts(prev => [
        updatedProduct,
        ...prev.filter(p => p.id !== existingFood.id && !duplicateIdsToDelete.includes(p.id))
      ]);

      // Update in Appwrite if user is logged in
      if (user) {
        try {
          // Update the main entry
          await updateProductInHistory(existingFood.id, newProduct);
          
          // Delete any duplicate entries from Appwrite
          if (duplicateIdsToDelete.length > 0) {
            await deleteMultipleProductsFromHistory(duplicateIdsToDelete);
            console.log(`Deleted ${duplicateIdsToDelete.length} duplicate food entries`);
          }
        } catch (error) {
          console.error('Failed to update food item in Appwrite:', error);
        }
      }

      return updatedProduct;
    }

    // If food item doesn't exist, add new entry
    const tempId = `temp_${Date.now()}`;
    const tempProduct = { ...newProduct, id: tempId };
    setProducts(prev => [tempProduct, ...prev]);

    // Save to Appwrite if user is logged in
    if (user) {
      try {
        const savedProduct = await saveProductToHistory(user.$id, newProduct);
        // Update the temp product with the real ID from Appwrite
        setProducts(prev => 
          prev.map(p => p.id === tempId ? { ...newProduct, id: savedProduct.$id } : p)
        );
        return { ...newProduct, id: savedProduct.$id };
      } catch (error) {
        console.error('Failed to save food item to Appwrite:', error);
        // Keep the temp product in local state even if save fails
      }
    }

    return tempProduct;
  }, [user, products]);

  // Delete selected products
  const deleteSelected = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);
    
    // Optimistically remove from local state
    setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());

    // Delete from Appwrite if user is logged in
    if (user) {
      try {
        await deleteMultipleProductsFromHistory(idsToDelete);
      } catch (error) {
        console.error('Failed to delete products from Appwrite:', error);
        // Reload to sync state
        loadProductHistory();
      }
    }
  }, [selectedIds, user, loadProductHistory]);

  // Delete a single product
  const deleteProduct = useCallback(async (productId) => {
    // Optimistically remove from local state
    setProducts(prev => prev.filter(p => p.id !== productId));
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });

    // Delete from Appwrite if user is logged in
    if (user) {
      try {
        await deleteProductFromHistory(productId);
      } catch (error) {
        console.error('Failed to delete product from Appwrite:', error);
        // Reload to sync state
        loadProductHistory();
      }
    }
  }, [user, loadProductHistory]);

  // Clear all products
  const clearAll = useCallback(async () => {
    // Optimistically clear local state
    setProducts([]);
    setSelectedIds(new Set());

    // Clear from Appwrite if user is logged in
    if (user) {
      try {
        await clearAllProductHistory(user.$id);
      } catch (error) {
        console.error('Failed to clear product history from Appwrite:', error);
        // Reload to sync state
        loadProductHistory();
      }
    }
  }, [user, loadProductHistory]);

  // Toggle selection of a product
  const toggleSelection = useCallback((productId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // Select all products
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(products.map(p => p.id)));
  }, [products]);

  // Deselect all products
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if a product is selected
  const isSelected = useCallback((productId) => {
    return selectedIds.has(productId);
  }, [selectedIds]);

  // Refresh history from Appwrite
  const refreshHistory = useCallback(() => {
    loadProductHistory();
  }, [loadProductHistory]);

  

  const value = {
    products,
    loading,
    selectedIds,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
    allSelected: products.length > 0 && selectedIds.size === products.length,
    addProduct,
    addFoodItem,
    deleteProduct,
    deleteSelected,
    clearAll,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    refreshHistory,
  };

  return (
    <ProductHistoryContext.Provider value={value}>
      {children}
    </ProductHistoryContext.Provider>
  );
}

// Hook to use the context
export const useProductHistory = () => {
  const context = useContext(ProductHistoryContext);
  if (context === undefined) {
    throw new Error('useProductHistory must be used within a ProductHistoryProvider');
  }
  return context;
};
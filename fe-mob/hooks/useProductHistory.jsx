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
      nutriscore: productData.nutriscore_grade || productData.nutriscoreGrade || null,
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
    // Generate a unique identifier for food items (no barcode)
    const foodId = `food_${Date.now()}`;
    
    const newProduct = {
      barcode: foodId, // Use generated ID as identifier
      name: foodData.name || foodData.food_name || 'Unknown Food',
      brand: '', // Food items don't have brands
      image: imageUri || null,
      nutriscore: foodData.health_score || foodData.nutrition_score || null,
      scannedAt: new Date().toISOString(),
      productData: foodData, // Store full food data for navigation
      type: 'food', // Mark as food item to distinguish from barcode products
    };

    // Add new entry (food items are always unique since they have generated IDs)
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
  }, [user]);

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
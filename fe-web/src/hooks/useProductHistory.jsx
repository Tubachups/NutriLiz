import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';
import {
  saveProductToHistory,
  getProductHistory,
  deleteProductFromHistory,
  deleteMultipleProductsFromHistory,
  clearAllProductHistory,
  updateProductInHistory
} from '../lib/appwriteDB';
import { uploadFoodImage } from '../lib/appwrite'

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
      // Products are persisted in Appwrite and will be loaded when user logs back in
      setProducts([]);
      setSelectedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Add a product to history (barcode scan)
  const addProduct = useCallback(async (productData, barcode) => {
    // Handle both Appwrite (product.name) and OpenFoodFacts (name/product_name) structures
    const productName = productData.product?.name || productData.product_name || productData.name || 'Unknown Product';
    
    const newProduct = {
      barcode,
      name: productName,
      brand: productData.brands || productData.brand || '',
      image: productData.image_url || productData.imageUrl || null,
      nutriscore: productData.nutriscore_grade || productData.nutriscoreGrade || productData.nutri_grade || null,
      scannedAt: new Date().toISOString(),
      productData,
      type: 'barcode',
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
      }
    }

    return tempProduct;
  }, [user, products]);

  // Add a food item (from photo scan) to history
  const addFoodItem = useCallback(async (foodData, imageUri = null) => {
    const foodName = foodData.name || foodData.food_name || 'Unknown Food';
    
    // Find ALL food items with the same name
    const duplicateFoods = products.filter(
      p => (p.type === 'food' || p.barcode?.startsWith('food_')) && 
           (p.name?.toLowerCase() === foodName.toLowerCase())
    );
    
    const existingFood = duplicateFoods.length > 0 ? duplicateFoods[0] : null;
    const duplicateIdsToDelete = duplicateFoods.slice(1).map(p => p.id);

    // Upload image to cloud storage if it's a base64 data URL
    // This ensures the image URL works and persists properly
    let cloudImageUrl = existingFood?.image || null;
    if (imageUri && imageUri.startsWith('data:')) {
      try {
        const uploadedUrl = await uploadFoodImage(imageUri);
        if (uploadedUrl) {
          cloudImageUrl = uploadedUrl;
        }
      } catch (error) {
        console.log('Image upload failed, will use data URL as fallback');
        cloudImageUrl = imageUri; // Fallback to data URL
      }
    } else if (imageUri) {
      cloudImageUrl = imageUri;
    }

    const newProduct = {
      barcode: existingFood?.barcode || `food_${Date.now()}`,
      name: foodName,
      brand: '',
      image: cloudImageUrl,
      nutriscore: foodData.health_score || foodData.nutrition_score || foodData.nutri_score_estimate || null,
      scannedAt: new Date().toISOString(),
      productData: foodData,
      type: 'food',
    };

    if (existingFood) {
      const updatedProduct = { ...newProduct, id: existingFood.id };
      setProducts(prev => [
        updatedProduct,
        ...prev.filter(p => p.id !== existingFood.id && !duplicateIdsToDelete.includes(p.id))
      ]);

      if (user) {
        try {
          await updateProductInHistory(existingFood.id, newProduct);
          
          if (duplicateIdsToDelete.length > 0) {
            await deleteMultipleProductsFromHistory(duplicateIdsToDelete);
          }
        } catch (error) {
          console.error('Failed to update food item in Appwrite:', error);
        }
      }

      return updatedProduct;
    }

    const tempId = `temp_${Date.now()}`;
    const tempProduct = { ...newProduct, id: tempId };
    setProducts(prev => [tempProduct, ...prev]);

    if (user) {
      try {
        const savedProduct = await saveProductToHistory(user.$id, newProduct);
        setProducts(prev => 
          prev.map(p => p.id === tempId ? { ...newProduct, id: savedProduct.$id } : p)
        );
        return { ...newProduct, id: savedProduct.$id };
      } catch (error) {
        console.error('Failed to save food item to Appwrite:', error);
      }
    }

    return tempProduct;
  }, [user, products]);

  // Delete selected products
  const deleteSelected = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);
    
    setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());

    if (user) {
      try {
        await deleteMultipleProductsFromHistory(idsToDelete);
      } catch (error) {
        console.error('Failed to delete products from Appwrite:', error);
        loadProductHistory();
      }
    }
  }, [selectedIds, user, loadProductHistory]);

  // Delete a single product
  const deleteProduct = useCallback(async (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });

    if (user) {
      try {
        await deleteProductFromHistory(productId);
      } catch (error) {
        console.error('Failed to delete product from Appwrite:', error);
        loadProductHistory();
      }
    }
  }, [user, loadProductHistory]);

  // Clear all products
  const clearAll = useCallback(async () => {
    setProducts([]);
    setSelectedIds(new Set());

    if (user) {
      try {
        await clearAllProductHistory(user.$id);
      } catch (error) {
        console.error('Failed to clear product history from Appwrite:', error);
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

import { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const ProductHistoryContext = createContext(undefined);

// Provider component
export function ProductHistoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Add a product to history
  const addProduct = useCallback((productData, barcode) => {
    const newProduct = {
      id: `${barcode}_${Date.now()}`,
      barcode,
      name: productData.product_name || productData.name || 'Unknown Product',
      brand: productData.brands || productData.brand || '',
      image: productData.image_url || productData.imageUrl || null,
      nutriscore: productData.nutriscore_grade || productData.nutriscoreGrade || null,
      scannedAt: new Date().toISOString(),
      productData, // Store full data for navigation
    };

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  // Delete selected products
  const deleteSelected = useCallback(() => {
    setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // Delete a single product
  const deleteProduct = useCallback((productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }, []);

  // Clear all products
  const clearAll = useCallback(() => {
    setProducts([]);
    setSelectedIds(new Set());
  }, []);

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

  const value = {
    products,
    loading,
    selectedIds,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
    allSelected: products.length > 0 && selectedIds.size === products.length,
    addProduct,
    deleteProduct,
    deleteSelected,
    clearAll,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
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
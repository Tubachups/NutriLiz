import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useProductHistory } from '../hooks/useProductHistory'
import HistoryModal from '../components/History/HistoryModal'
import ProductList from '../components/History/ProductList'
import { useState } from 'react'
import { Trash2, CheckSquare, XSquare } from 'lucide-react'

export const Route = createLazyFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const navigate = useNavigate()
  const {
    products,
    loading,
    selectedCount,
    hasSelection,
    allSelected,
    deleteProduct,
    deleteSelected,
    clearAll,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
  } = useProductHistory()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return
    setShowDeleteModal(true)
  }

  const confirmDeleteSelected = () => {
    deleteSelected()
    setShowDeleteModal(false)
  }

  const handleClearAll = () => {
    if (products.length === 0) return
    setShowClearAllModal(true)
  }

  const confirmClearAll = () => {
    clearAll()
    setShowClearAllModal(false)
  }

  const handleDeleteSingle = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName })
  }

  const confirmDeleteSingle = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id)
    }
    setProductToDelete(null)
  }

  const handleProductClick = (product) => {
    const isFoodScan = product.type === 'food' || product.barcode?.startsWith('food_')
    
    if (isFoodScan) {
      // Navigate to image-search with the food data and image
      navigate({ 
        to: '/image-search',
        search: { 
          foodData: JSON.stringify(product.productData),
          foodImage: product.image || null
        }
      })
    } else {
      // Navigate to product-detail page with the stored product data
      navigate({ 
        to: '/product-detail',
        search: { 
          barcode: product.barcode,
          productData: JSON.stringify(product.productData)
        }
      })
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[#ecf4e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ecf4e8] py-8 px-4 font-display">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📋 Scan History</h1>
            <p className="text-gray-600 mt-1">
              {products.length} item{products.length !== 1 ? 's' : ''} scanned
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {allSelected ? <XSquare size={18} /> : <CheckSquare size={18} />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            
            <button
              onClick={handleDeleteSelected}
              disabled={!hasSelection}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer "
            >
              <Trash2 size={18} />
              Delete ({selectedCount})
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={products.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          </div>
        </div>

        <ProductList
          products={products}
          navigate={navigate}
          isSelected={isSelected}
          toggleSelection={toggleSelection}
          handleProductClick={handleProductClick}
          handleDeleteSingle={handleDeleteSingle}
        />
      </div>

      <HistoryModal
        products={products}
        selectedCount={selectedCount}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        confirmDeleteSelected={confirmDeleteSelected}
        showClearAllModal={showClearAllModal}
        setShowClearAllModal={setShowClearAllModal}
        confirmClearAll={confirmClearAll}
        productToDelete={productToDelete}
        setProductToDelete={setProductToDelete}
        confirmDeleteSingle={confirmDeleteSingle}
      />

        
    </div>
  )
}

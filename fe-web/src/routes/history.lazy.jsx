import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useProductHistory } from '../hooks/useProductHistory'
import { useState } from 'react'
import { Trash2, CheckSquare, Square, XSquare, AlertTriangle, Clock, Barcode, Camera } from 'lucide-react'

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


  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNutriscoreColor = (grade) => {
    const colors = {
      a: 'bg-green-600',
      b: 'bg-lime-500',
      c: 'bg-yellow-400',
      d: 'bg-orange-500',
      e: 'bg-red-500',
    }
    return colors[grade?.toLowerCase()] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary py-8 px-4 font-display">
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

        {/* Product List */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-accent">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Scanned</h3>
            <p className="text-gray-500 mb-6">Your scanned products will appear here.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate({ to: '/scan' })}
                className="px-6 py-3 bg-dark text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Scan a Barcode
              </button>
              <button
                onClick={() => navigate({ to: '/image-search' })}
                className="px-6 py-3 bg-accent text-gray-800 rounded-lg hover:opacity-90 transition-colors"
              >
                Scan Food
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const isFoodScan = product.type === 'food' || product.barcode?.startsWith('food_')
              
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-md border-2 transition-all hover:shadow-lg cursor-pointer ${
                    isSelected(product.id) 
                      ? 'border-dark bg-secondary/20' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center p-4 gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelection(product.id)
                      }}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      {isSelected(product.id) ? (
                        <CheckSquare size={24} className="text-dark" />
                      ) : (
                        <Square size={24} className="text-gray-400" />
                      )}
                    </button>

                    {/* Product Image */}
                    <div 
                      className="flex-shrink-0"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => handleProductClick(product)}
                    >
                      <h3 className="font-semibold text-gray-800 truncate">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500 truncate">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{formatDate(product.scannedAt)}</span>
                        <span className="text-gray-300">•</span>
                        {isFoodScan ? (
                          <span className="flex items-center gap-1">
                            <Camera size={12} />
                            Food Scan
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Barcode size={12} />
                            {product.barcode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                      {/* Nutri-Score Badge */}
                      {product.nutriscore && (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${getNutriscoreColor(
                            product.nutriscore
                          )}`}
                        >
                          {typeof product.nutriscore === 'string' 
                            ? product.nutriscore.toUpperCase() 
                            : product.nutriscore}
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSingle(product.id, product.name)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Selected Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Selected</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSelected}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2 cursor-pointer">Clear All History</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete all {products.length} items from your history? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Product</h3>
              <p className="text-gray-600 mb-6">
                Remove "{productToDelete.name}" from history?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSingle}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

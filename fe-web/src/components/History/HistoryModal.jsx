
import { AlertTriangle, Trash2 } from 'lucide-react'

export default function HistoryModal({
  products,
  selectedCount,
  showDeleteModal,
  setShowDeleteModal,
  confirmDeleteSelected,
  showClearAllModal,
  setShowClearAllModal,
  confirmClearAll,
  productToDelete,
  setProductToDelete,
  confirmDeleteSingle
}) {
  return (
    <>
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
    </>
  )
}

import { forwardRef, useRef, useImperativeHandle } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Clock, Package, Printer } from 'lucide-react'

const ModalDashboard = forwardRef(({ 
  selectedUser, 
  userHistory, 
  isLoadingHistory, 
  historyError,
  onClose 
}, ref) => {
  const modalRef = useRef(null)
  const printContentRef = useRef(null)

  // Expose showModal method to parent component
  useImperativeHandle(ref, () => ({
    showModal: () => {
      modalRef.current?.showModal()
    },
    close: () => {
      modalRef.current?.close()
    }
  }))

  // Setup react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: selectedUser ? `Scan_History_${selectedUser.name || selectedUser.email}_${new Date().toISOString().split('T')[0]}` : 'Scan_History',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  })

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box max-w-2xl">
        <form method="dialog">
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 no-print"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        
        {selectedUser && (
          <>
            {/* Printable Content Area */}
            <div ref={printContentRef}>
              {/* Print Header - Only visible in print */}
              <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">NutriLiz - Scan History Report</h1>
                <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#93BFC7] flex items-center justify-center text-white font-bold">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedUser.name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              {/* Scan History Title */}
              <div className="flex items-center gap-2 mb-4 border-t pt-4">
                <Clock size={20} className="text-[#93BFC7]" />
                <span className="font-semibold text-gray-800">Scan History</span>
              </div>

              {historyError && (
                <div className="alert alert-error mb-4 no-print">
                  <span>{historyError}</span>
                </div>
              )}

              {isLoadingHistory ? (
                <div className="flex justify-center py-8 no-print">
                  <span className="loading loading-spinner loading-md text-[#93BFC7]"></span>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No scan history found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto print:max-h-none print:overflow-visible">
                  {userHistory.map((item, index) => (
                    <div
                      key={item.$id}
                      className="flex items-center gap-4 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors print:bg-gray-100 print:break-inside-avoid"
                    >
                      {/* Index number for print */}
                      <span className="hidden print:block text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>

                      {/* Product Image */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg print:w-10 print:h-10"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center print:w-10 print:h-10">
                          <Package size={24} className="text-gray-400" />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate print:whitespace-normal">
                          {item.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={14} />
                          {formatDateTime(item.scannedAt || item.$createdAt)}
                        </p>
                      </div>

                      {/* Nutriscore Badge */}
                      {item.nutriscore && (
                        <div className={`badge badge-lg print:px-2 print:py-1 print:rounded ${
                          item.nutriscore.toLowerCase() === 'a' ? 'badge-success print:bg-green-100 print:text-green-800' :
                          item.nutriscore.toLowerCase() === 'b' ? 'badge-info print:bg-blue-100 print:text-blue-800' :
                          item.nutriscore.toLowerCase() === 'c' ? 'badge-warning print:bg-yellow-100 print:text-yellow-800' :
                          item.nutriscore.toLowerCase() === 'd' ? 'badge-error print:bg-orange-100 print:text-orange-800' :
                          item.nutriscore.toLowerCase() === 'e' ? 'badge-error print:bg-red-100 print:text-red-800' :
                          'badge-ghost'
                        }`}>
                          {item.nutriscore.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer / Print Summary */}
              <div className="pt-4 mt-4 border-t text-center">
                <p className="text-sm text-gray-500">
                  Total scans: {userHistory.length}
                </p>
              </div>
            </div>

            {/* Print Button - Outside printable area */}
            {!isLoadingHistory && userHistory.length > 0 && (
              <div className="mt-4 flex justify-end no-print">
                <button
                  onClick={handlePrint}
                  className="btn btn-primary gap-2"
                >
                  <Printer size={18} />
                  Print as PDF
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
})

ModalDashboard.displayName = 'ModalDashboard'

export default ModalDashboard
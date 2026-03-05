import { AlertTriangle } from 'lucide-react'

export default function DisclaimerModal({ show, onClose }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-100 rounded-full p-3 mb-4">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Disclaimer</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Results may not be fully accurate as it mainly relies on labeled products and colors, which may resemble
            other items than expected. Always verify with proper information.
          </p>
          <button className="btn btn-primary w-full rounded-lg border-none" onClick={onClose}>
            OK, I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

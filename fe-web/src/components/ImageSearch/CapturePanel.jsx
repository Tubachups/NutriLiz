import { Camera } from 'lucide-react'

export default function CapturePanel({ videoSrc, imgRef, analyzing, progress, error, onCapture }) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="card bg-base-100 shadow-xl overflow-hidden sticky top-4 rounded-sm">
        <figure className="relative">
          <img
            ref={imgRef}
            src={videoSrc}
            alt="Live Video Feed"
            className="w-full aspect-[4/3] object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4">
            <button
              className={`btn btn-primary w-full gap-2 shadow-lg ${analyzing ? 'loading' : ''} border-none rounded-sm`}
              onClick={onCapture}
              disabled={analyzing}
            >
              <Camera className="w-5 h-5" />
              {analyzing ? 'Analyzing...' : 'Capture & Analyze Food'}
            </button>
          </div>
        </figure>
      </div>

      {analyzing && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-8">
            <div
              className="radial-progress text-primary"
              style={{ '--value': Math.round(progress), '--size': '6rem', '--thickness': '6px' }}
              role="progressbar"
            >
              {Math.round(progress)}%
            </div>
            <p className="mt-3 font-medium animate-pulse">Analyzing...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-5 w-5"
            fill="nonpie"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}

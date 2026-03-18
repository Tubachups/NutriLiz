import { memo } from 'react'
import { Camera } from 'lucide-react'

function CapturePanel({ videoSrc, frozenFrame, imgRef, analyzing, progress, processingMessage, error, onCapture }) {
  const displaySrc = analyzing && frozenFrame ? frozenFrame : videoSrc
  const statusText = processingMessage || 'Please hold on while we analyze your food.'

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="card bg-base-100 shadow-xl overflow-hidden sticky top-4 rounded-sm">
        <figure className="relative">
          <img
            ref={imgRef}
            src={displaySrc}
            alt={analyzing ? 'Captured frame' : 'Live Video Feed'}
            className="w-full aspect-4/3 object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />

          {analyzing && (
            <div className="absolute inset-0 z-10 bg-base-100/75 backdrop-blur-[2px] flex items-center justify-center">
              <div className="w-[85%] max-w-xs rounded-xl bg-base-100/95 shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="loading loading-spinner loading-lg text-primary" />
                  <div>
                    <p className="font-semibold text-base-content">Processing Capture</p>
                    <p className="text-xs text-base-content/70">{statusText}</p>
                  </div>
                </div>
                <progress
                  className="progress progress-primary mt-4 w-full"
                  value={Math.round(progress)}
                  max="100"
                  aria-label="Food analysis progress"
                />
                <p className="text-right text-xs mt-1 text-base-content/70">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

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

export default memo(CapturePanel)

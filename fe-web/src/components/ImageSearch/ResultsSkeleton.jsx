function ResultsSkeleton({ capturedImage }) {
  const skeletonClass = 'skeleton animate-pulse bg-base-300/80'

  return (
    <div className="space-y-6">
      <div className="card bg-base-100/80 border border-base-200/70 shadow-xl rounded-md backdrop-blur-sm">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured food preview"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className={`${skeletonClass} w-24 h-24 md:w-32 md:h-32 rounded-xl shrink-0`} />
              )}
              <div className="flex-1 space-y-3">
                <div className={`${skeletonClass} h-8 w-3/4`} />
                <div className={`${skeletonClass} h-4 w-full`} />
                <div className={`${skeletonClass} h-4 w-5/6`} />
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className={`${skeletonClass} h-6 w-20`} />
                  <div className={`${skeletonClass} h-6 w-28`} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`${skeletonClass} h-3 w-20 mx-auto`} />
              <div className={`${skeletonClass} w-16 h-16 rounded-2xl`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="stat bg-base-100/80 border border-base-200/70 rounded-xl shadow-md p-4 backdrop-blur-sm">
            <div className={`${skeletonClass} h-5 w-16 mb-3`} />
            <div className={`${skeletonClass} h-8 w-20`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="card bg-base-100/80 border border-base-200/70 shadow-md backdrop-blur-sm">
            <div className="card-body space-y-3">
              <div className={`${skeletonClass} h-6 w-40`} />
              <div className={`${skeletonClass} h-4 w-32`} />
              <div className="space-y-2 pt-2">
                <div className={`${skeletonClass} h-4 w-full`} />
                <div className={`${skeletonClass} h-4 w-11/12`} />
                <div className={`${skeletonClass} h-4 w-10/12`} />
                <div className={`${skeletonClass} h-4 w-9/12`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultsSkeleton

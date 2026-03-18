function getConfidenceBadgeClass(confidence) {
  if (confidence === 'high') return 'badge-success'
  if (confidence === 'medium') return 'badge-warning'
  return 'badge-error'
}

function getNutriScoreClass(score) {
  if (score === 'A') return 'bg-green-500 text-white'
  if (score === 'B') return 'bg-lime-400 text-white'
  if (score === 'C') return 'bg-yellow-400 text-black'
  if (score === 'D') return 'bg-orange-500 text-white'
  return 'bg-red-500 text-white'
}

function ResultsHeaderCard({ result, capturedImage }) {
  return (
    <div className="card bg-white shadow-xl rounded-md">
      <div className="card-body">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {capturedImage && (
            <div className="shrink-0">
              <img
                src={capturedImage}
                alt={result.food_name || 'Captured food'}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-md"
              />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-3xl font-bold">{result.food_name || 'Unknown Food'}</h2>
            {result.food_name_local && result.food_name_local !== result.food_name && (
              <p className="text-base-content/60 text-lg">({result.food_name_local})</p>
            )}
            {result.description && <p className="text-base-content/70 mt-2">{result.description}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {result.category && <span className="badge badge-primary">{result.category}</span>}
              {result.confidence && (
                <span className={`badge ${getConfidenceBadgeClass(result.confidence)}`}>
                  Confidence: {result.confidence}
                </span>
              )}
            </div>
          </div>

          {result.nutri_score_estimate && (
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-base-content/60 mb-1">Nutri-Score</span>
              <div
                className={`text-4xl font-bold rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${getNutriScoreClass(result.nutri_score_estimate)}`}
              >
                {result.nutri_score_estimate}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsHeaderCard

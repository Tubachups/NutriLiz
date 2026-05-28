import FoodCarousel from './FoodCarousel'

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

function ResultsHeaderCard({
  foods = [],
  activeFood,
  activeFoodIndex = 0,
  onActiveFoodIndexChange = () => {},
  capturedImage,
}) {
  const hasMultipleFoods = foods.length > 1
  const displayFood = activeFood || foods[0] || {}

  const renderFoodCard = (foodItem) => (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">{foodItem.food_name || 'Unknown Food'}</h2>
      {foodItem.food_name_local && foodItem.food_name_local !== foodItem.food_name && (
        <p className="text-base-content/60 text-lg">({foodItem.food_name_local})</p>
      )}
      {foodItem.description && <p className="text-base-content/70 mt-1">{foodItem.description}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {foodItem.category && <span className="badge badge-primary">{foodItem.category}</span>}
        {foodItem.confidence && (
          <span className={`badge ${getConfidenceBadgeClass(foodItem.confidence)}`}>
            Confidence: {foodItem.confidence}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="card bg-white shadow-xl rounded-md">
      <div className="card-body">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {capturedImage && (
            <div className="shrink-0">
              <img
                src={capturedImage}
                alt={displayFood.food_name || 'Captured food'}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-md"
              />
            </div>
          )}

          <div className="flex-1">
            {hasMultipleFoods ? (
              <FoodCarousel
                items={foods}
                activeIndex={activeFoodIndex}
                onChange={onActiveFoodIndexChange}
                title="Detected Foods"
                renderItem={(item) => renderFoodCard(item)}
              />
            ) : (
              renderFoodCard(displayFood)
            )}
          </div>

          {displayFood.nutri_score_estimate && (
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-base-content/60 mb-1">Nutri-Score</span>
              <div
                className={`text-4xl font-bold rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${getNutriScoreClass(displayFood.nutri_score_estimate)}`}
              >
                {displayFood.nutri_score_estimate}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsHeaderCard

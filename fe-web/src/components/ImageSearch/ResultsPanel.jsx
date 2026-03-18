import { memo } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Beef,
  ChefHat,
  Flame,
  Info,
  Leaf,
  Soup,
  Target,
  Utensils,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'

function StatCard({ title, value, unit, icon, textClass = 'text-black', iconClass = '' }) {
  if (value === undefined) return null

  return (
    <div className="stat bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className={`stat-figure ${iconClass}`}>{icon}</div>
      <div className="stat-title text-xs">{title}</div>
      <div className={`stat-value text-xl ${textClass}`}>{value}{unit || ''}</div>
    </div>
  )
}

function getReferenceLabel(foodData) {
  if (foodData?.nutrition_source === 'open_food_facts') {
    return 'Open Food Facts'
  }

  if (foodData?.nutrition_source === 'usda_fooddata_central') {
    if (foodData?.usda_match?.fdc_id) {
      return `USDA FoodData Central (${foodData.usda_match.fdc_id})`
    }
    return 'USDA FoodData Central'
  }

  if (foodData?.source === 'gemini_vision') {
    return 'Gemini Vision'
  }

  return foodData?.source || 'Unknown'
}

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

function ResultsPanel({ result, analyzing, capturedImage }) {
  if (!result && !analyzing) {
    return (
      <div className="card bg-white shadow-xl h-full min-h-100 rounded-sm">
        <div className="card-body items-center justify-center text-center">
          <Utensils className="w-32 h-32 text-base-content/20 mb-4" />
          <h3 className="text-xl font-semibold text-base-content/60">No Food Analyzed Yet</h3>
          <p className="text-base-content/40">Point your food at camera and click capture to analyze</p>
        </div>
      </div>
    )
  }

  if (analyzing) {
    return <ResultsSkeleton capturedImage={capturedImage} />
  }

  if (!result) {
    return null
  }

  const nutrition = result.nutrition_per_100g || result.nutrition_per_serving || null
  const nutritionReference = getReferenceLabel(result)

  return (
    <div className="space-y-6">
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
                  <span
                    className={`badge ${
                      result.confidence === 'high'
                        ? 'badge-success'
                        : result.confidence === 'medium'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    Confidence: {result.confidence}
                  </span>
                )}
              </div>
            </div>

            {result.nutri_score_estimate && (
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-base-content/60 mb-1">Nutri-Score</span>
                <div
                  className={`text-4xl font-bold rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${
                    result.nutri_score_estimate === 'A'
                      ? 'bg-green-500 text-white'
                      : result.nutri_score_estimate === 'B'
                        ? 'bg-lime-400 text-white'
                        : result.nutri_score_estimate === 'C'
                          ? 'bg-yellow-400 text-black'
                          : result.nutri_score_estimate === 'D'
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                  }`}
                >
                  {result.nutri_score_estimate}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nutrition ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Calories"
          value={nutrition.calories}
          unit=""
          icon={<Flame className="w-8 h-8" />}
          iconClass="text-primary"
        />
        <StatCard
          title="Protein"
          value={nutrition.protein_g}
          unit="g"
          icon={<Beef className="w-8 h-8" />}
          iconClass="text-secondary"
        />
        <StatCard
          title="Carbs"
          value={nutrition.carbohydrates_g}
          unit="g"
          icon={<Wheat className="w-8 h-8" />}
          iconClass="text-accent"
        />
        <StatCard
          title="Fat"
          value={nutrition.fat_g}
          unit="g"
          icon={<Soup className="w-8 h-8" />}
          textClass="text-warning"
          iconClass="text-warning"
        />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nutrition && (
          <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Nutrition per 100g
              </h3>
              <p className="text-xs text-base-content/60 -mt-1">
                Reference: {nutritionReference}
              </p>
              {result.serving_size && <p className="text-sm text-base-content/60">Serving: {result.serving_size}</p>}
              <div className="space-y-2 mt-2">
                {nutrition.fiber_g !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-base-200">
                    <span className="text-sm">Fiber</span>
                    <span className="font-semibold">{nutrition.fiber_g}g</span>
                  </div>
                )}
                {nutrition.sugar_g !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-base-200">
                    <span className="text-sm">Sugar</span>
                    <span className="font-semibold">{nutrition.sugar_g}g</span>
                  </div>
                )}
                {nutrition.sodium_mg !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-base-200">
                    <span className="text-sm">Sodium</span>
                    <span className="font-semibold">{nutrition.sodium_mg}mg</span>
                  </div>
                )}
                {nutrition.saturated_fat_g !== undefined && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">Saturated Fat</span>
                    <span className="font-semibold">{nutrition.saturated_fat_g}g</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!nutrition && result.nutrition_pending_confirmation && (
          <div className="card bg-white shadow-md border border-warning/40">
            <div className="card-body">
              <h3 className="card-title text-lg text-warning">Nutrition Pending Confirmation</h3>
              <p className="text-sm text-base-content/70">
                Confirm the exact dish name in the verifier modal to fetch USDA nutrition details.
              </p>
            </div>
          </div>
        )}

        {result.dietary_info && (
          <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Dietary Information
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.dietary_info.is_vegetarian && <span className="badge badge-success gap-1">Vegetarian</span>}
                {result.dietary_info.is_vegan && <span className="badge badge-success gap-1">Vegan</span>}
                {result.dietary_info.is_gluten_free && <span className="badge badge-info gap-1">Gluten-Free</span>}
                {result.dietary_info.is_dairy_free && <span className="badge badge-info gap-1">Dairy-Free</span>}
                {!result.dietary_info.is_vegetarian && <span className="badge badge-ghost gap-1">Contains Meat</span>}
                {!result.dietary_info.is_gluten_free && <span className="badge badge-ghost gap-1">Contains Gluten</span>}
                {!result.dietary_info.is_dairy_free && <span className="badge badge-ghost gap-1">Contains Dairy</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.health_benefits && result.health_benefits.length > 0 && (
          <div className="card bg-white shadow-md rounded-md">
            <div className="card-body">
              <h3 className="card-title text-lg text-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                Health Benefits
              </h3>
              <ul className="space-y-2 mt-2">
                {result.health_benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result.potential_concerns && result.potential_concerns.length > 0 && (
          <div className="card bg-white shadow-md rounded-md">
            <div className="card-body">
              <h3 className="card-title text-lg text-warning flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Potential Concerns
              </h3>
              <ul className="space-y-2 mt-2">
                {result.potential_concerns.map((concern, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-warning mt-0.5">!</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {result.allergens && result.allergens.length > 0 && (
        <div className="alert alert-warning  bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Allergen Warning</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {result.allergens.map((allergen, index) => (
                <span key={index} className="badge badge-warning">{allergen}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {result.ingredients_if_dish && result.ingredients_if_dish.length > 0 && (
        <div className="card bg-white shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Ingredients
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.ingredients_if_dish.map((ingredient, index) => (
                <span key={index} className="badge badge-outline">{ingredient}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {result.ingredients_if_dish && result.ingredients_if_dish.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 -mt-3">
          <p className="text-xs text-amber-700 italic flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Note: This list is based on image recognition and may not include all ingredients. Some ingredients may not be
            visible or identifiable from the captured image.
          </p>
        </div>
      )}

      {result.preparation_notes && (
        <div className="card bg-white shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Preparation
            </h3>
            <p className="text-base-content/80">{result.preparation_notes}</p>
          </div>
        </div>
      )}

      {result.personalized_advice && (
        <div className="card bg-linear-to-r from-primary to-secondary text-primary-content shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Personalized Advice
            </h3>
            <p>{result.personalized_advice}</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 italic leading-relaxed">
          This app is a tool only. Always consult your health professional for advice and to ensure your safety.
        </p>
      </div>
    </div>
  )
}

export default memo(ResultsPanel)

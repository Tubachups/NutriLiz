import { BarChart3, Beef, Flame, Soup, Wheat } from 'lucide-react'

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

function getDisplayNutrientValue(value) {
  return value == null || value === '' ? 0 : value
}

function NutrientRow({ label, value, unit = '', bordered = true }) {
  if (value === undefined) {
    return null
  }

  return (
    <div className={`flex justify-between items-center py-1 ${bordered ? 'border-b border-base-200' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className="font-semibold">{getDisplayNutrientValue(value)}{unit}</span>
    </div>
  )
}

function NutritionSummaryCards({ nutrition }) {
  if (!nutrition) {
    return null
  }

  return (
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
  )
}

function NutritionDetailsCard({ result, nutrition }) {
  if (!nutrition) {
    return null
  }

  return (
    <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Nutrition per 100g
        </h3>
        <p className="text-xs text-base-content/60 -mt-1">
          Reference: {getReferenceLabel(result)}
        </p>
        {result.serving_size && <p className="text-sm text-base-content/60">Serving: {result.serving_size}</p>}
        <div className="space-y-2 mt-2">
          <NutrientRow label="Fiber" value={nutrition.fiber_g} unit="g" />
          <NutrientRow label="Sugar" value={nutrition.sugar_g} unit="g" />
          <NutrientRow label="Sodium" value={nutrition.sodium_mg} unit="mg" />
          <NutrientRow label="Saturated Fat" value={nutrition.saturated_fat_g} unit="g" bordered={false} />
        </div>
      </div>
    </div>
  )
}

function PendingNutritionCard({ show }) {
  if (!show) {
    return null
  }

  return (
    <div className="card bg-white shadow-md border border-warning/40">
      <div className="card-body">
        <h3 className="card-title text-lg text-warning">Nutrition Pending Confirmation</h3>
        <p className="text-sm text-base-content/70">
          Confirm the exact dish name in the verifier modal to fetch USDA nutrition details.
        </p>
      </div>
    </div>
  )
}

function NutritionSection({ result }) {
  const nutrition = result.nutrition_per_100g || result.nutrition_per_serving || null
  const showNutritionDetailArea = nutrition || result.nutrition_pending_confirmation

  return (
    <>
      <NutritionSummaryCards nutrition={nutrition} />

      {showNutritionDetailArea && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NutritionDetailsCard result={result} nutrition={nutrition} />
          <PendingNutritionCard show={!nutrition && result.nutrition_pending_confirmation} />
        </div>
      )}
    </>
  )
}

export default NutritionSection

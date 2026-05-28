import { BarChart3, Beef, Flame, Soup, Wheat } from 'lucide-react'
import FoodCarousel from './FoodCarousel'

function formatNumber(value) {
  if (value == null) return null
  const rounded = Math.round(value * 100) / 100
  return rounded.toFixed(2)
}

function StatCard({ title, value, unit, icon, textClass = 'text-black', iconClass = '' }) {
  const displayValue = formatNumber(value)
  if (displayValue == null) return null

  return (
    <div className="stat bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className={`stat-figure ${iconClass}`}>{icon}</div>
      <div className="stat-title text-xs">{title}</div>
      <div className={`stat-value text-xl ${textClass}`}>{displayValue}{unit || ''}</div>
    </div>
  )
}

function getReferenceLabel(foodData) {
  if (foodData?.nutrition_source === 'usda_fooddata_central'
    && foodData?.nutrition_estimation?.estimated_fields?.length) {
    return 'USDA FoodData Central + Ingredient Blend Estimate'
  }

  if (foodData?.nutrition_source === 'open_food_facts') {
    return 'Open Food Facts'
  }

  if (foodData?.nutrition_source === 'usda_fooddata_central') {
    if (foodData?.usda_match?.fdc_id) {
      return `USDA FoodData Central (${foodData.usda_match.fdc_id})`
    }
    return 'USDA FoodData Central'
  }

  if (foodData?.nutrition_source === 'fnri_table') {
    if (foodData?.fnri_match?.food_id) {
      return `FNRI Table (${foodData.fnri_match.food_id})`
    }
    return 'FNRI Table'
  }

  if (foodData?.source === 'gemini_vision') {
    return 'Gemini Vision'
  }

  return foodData?.source || 'Unknown'
}

function normalizeNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatNutritionValue(value, unit = '') {
  if (value == null) return `0${unit}`
  const rounded = Math.round(value * 100) / 100
  const display = rounded.toFixed(2)
  return `${display}${unit}`
}

function formatEstimatedFields(fields) {
  const labels = {
    calories: 'Calories',
    protein_g: 'Protein',
    carbohydrates_g: 'Carbs',
    fat_g: 'Fat',
    fiber_g: 'Fiber',
    sugar_g: 'Sugar',
    sodium_mg: 'Sodium',
    saturated_fat_g: 'Sat. Fat',
  }

  return fields.map((field) => labels[field] || field).join(', ')
}

function NutrientRow({ label, value, unit = '', bordered = true }) {
  if (value === undefined) {
    return null
  }

  return (
    <div className={`flex justify-between items-center py-1 ${bordered ? 'border-b border-base-200' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className="font-semibold">{formatNutritionValue(value, unit)}</span>
    </div>
  )
}

function NutritionSummaryCards({ nutrition, scaleFactor }) {
  if (!nutrition) {
    return null
  }

  const getScaled = (value) => {
    const parsed = normalizeNumber(value)
    if (parsed == null) return null
    return parsed * scaleFactor
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        title="Calories"
        value={getScaled(nutrition.calories)}
        unit=""
        icon={<Flame className="w-8 h-8" />}
        iconClass="text-primary"
      />
      <StatCard
        title="Protein"
        value={getScaled(nutrition.protein_g)}
        unit="g"
        icon={<Beef className="w-8 h-8" />}
        iconClass="text-secondary"
      />
      <StatCard
        title="Carbs"
        value={getScaled(nutrition.carbohydrates_g)}
        unit="g"
        icon={<Wheat className="w-8 h-8" />}
        iconClass="text-accent"
      />
      <StatCard
        title="Fat"
        value={getScaled(nutrition.fat_g)}
        unit="g"
        icon={<Soup className="w-8 h-8" />}
        textClass="text-warning"
        iconClass="text-warning"
      />
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

function NutritionSection({
  foods = [],
  activeFood,
  activeFoodIndex = 0,
  onActiveFoodIndexChange = () => {},
  servingSizeInputs = [],
  onServingSizeInputChange = () => {},
}) {
  const hasMultipleFoods = foods.length > 1
  const displayFood = activeFood || foods[0] || {}

  const renderNutritionCard = (foodItem, index) => {
    const nutrition = foodItem.nutrition_per_100g || foodItem.nutrition_per_serving || null
    const hasPer100gNutrition = Boolean(foodItem.nutrition_per_100g)
    const servingInput = servingSizeInputs[index] ?? '100'
    const parsedServingSize = Number.parseFloat(String(servingInput).replace(',', '.'))
    const servingSize = Number.isFinite(parsedServingSize) && parsedServingSize > 0 ? parsedServingSize : 100
    const servingSizeError = servingInput.trim() !== ''
      && (!Number.isFinite(parsedServingSize) || parsedServingSize <= 0)
    const scaleFactor = hasPer100gNutrition ? servingSize / 100 : 1
    const showNutritionDetailArea = nutrition || foodItem.nutrition_pending_confirmation
    const estimatedFields = foodItem?.nutrition_estimation?.estimated_fields || []

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{foodItem.food_name || 'Nutrition'}</h3>
          {hasPer100gNutrition && (
            <span className="text-xs text-base-content/60">Scaled from per 100g values</span>
          )}
        </div>

        {hasPer100gNutrition && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">Serving size (g)</label>
            <input
              type="text"
              inputMode="decimal"
              className={`input input-bordered w-full ${servingSizeError ? 'input-error' : ''}`}
              value={servingInput}
              onChange={(event) => {
                onServingSizeInputChange((prev) => {
                  const next = [...prev]
                  next[index] = event.target.value
                  return next
                })
              }}
              onBlur={() => {
                onServingSizeInputChange((prev) => {
                  const next = [...prev]
                  if (!next[index] || next[index].trim() === '') {
                    next[index] = '100'
                  }
                  return next
                })
              }}
              placeholder="100"
            />
            <p className="text-xs text-base-content/60">
              {servingSizeError
                ? 'Enter a valid serving size. Showing values for 100g.'
                : `Nutrition for ${servingSize.toFixed(0)}g.`}
            </p>
          </div>
        )}

        <NutritionSummaryCards nutrition={nutrition} scaleFactor={scaleFactor} />

        {showNutritionDetailArea && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Nutrition per 100g
                </h3>
                <p className="text-xs text-base-content/60 -mt-1">
                  Reference: {getReferenceLabel(foodItem)}
                </p>
                {estimatedFields.length > 0 && (
                  <p className="text-xs text-base-content/60">
                    Estimated from ingredients for: {formatEstimatedFields(estimatedFields)}
                  </p>
                )}
                {foodItem.serving_size && (
                  <p className="text-sm text-base-content/60">Serving: {foodItem.serving_size}</p>
                )}
                <div className="space-y-2 mt-2">
                  <NutrientRow label="Fiber" value={normalizeNumber(nutrition?.fiber_g) * scaleFactor} unit="g" />
                  <NutrientRow label="Sugar" value={normalizeNumber(nutrition?.sugar_g) * scaleFactor} unit="g" />
                  <NutrientRow label="Sodium" value={normalizeNumber(nutrition?.sodium_mg) * scaleFactor} unit="mg" />
                  <NutrientRow label="Saturated Fat" value={normalizeNumber(nutrition?.saturated_fat_g) * scaleFactor} unit="g" bordered={false} />
                </div>
              </div>
            </div>
            <PendingNutritionCard show={!nutrition && foodItem.nutrition_pending_confirmation} />
          </div>
        )}
      </div>
    )
  }

  if (hasMultipleFoods) {
    return (
      <FoodCarousel
        items={foods}
        activeIndex={activeFoodIndex}
        onChange={onActiveFoodIndexChange}
        title="Nutrition by food"
        renderItem={(item, index) => renderNutritionCard(item, index)}
      />
    )
  }

  return renderNutritionCard(displayFood, 0)
}

export default NutritionSection

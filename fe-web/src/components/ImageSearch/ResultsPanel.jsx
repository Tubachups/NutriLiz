import { memo, useEffect, useMemo, useState } from 'react'
import { Utensils } from 'lucide-react'
import FoodDetailsSection from './FoodDetailsSection'
import NutritionSection from './NutritionSection'
import ResultsHeaderCard from './ResultsHeaderCard'
import ResultsSkeleton from './ResultsSkeleton'

function extractFoodItems(foodData) {
  if (Array.isArray(foodData)) {
    return foodData.filter((item) => item && typeof item === 'object')
  }

  if (!foodData || typeof foodData !== 'object') {
    return []
  }

  const listKeys = ['food_items', 'foods', 'detected_foods', 'identified_foods', 'items']
  for (const key of listKeys) {
    if (Array.isArray(foodData[key]) && foodData[key].length > 0) {
      return foodData[key].filter((item) => item && typeof item === 'object')
    }
  }

  return [foodData]
}

function ResultsPanel({ result, analyzing, capturedImage }) {
  const foods = useMemo(() => extractFoodItems(result), [result])
  const hasMultipleFoods = foods.length > 1
  const [activeFoodIndex, setActiveFoodIndex] = useState(0)
  const [servingSizeInputs, setServingSizeInputs] = useState(['100'])

  useEffect(() => {
    if (!result) return
    setActiveFoodIndex(0)
    setServingSizeInputs(foods.map(() => '100'))
  }, [result, foods.length])

  const activeFood = hasMultipleFoods
    ? foods[Math.min(activeFoodIndex, foods.length - 1)]
    : result

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

  return (
    <div className="space-y-6">
      <ResultsHeaderCard
        foods={foods}
        activeFood={activeFood}
        activeFoodIndex={activeFoodIndex}
        onActiveFoodIndexChange={setActiveFoodIndex}
        capturedImage={capturedImage}
      />
      <NutritionSection
        foods={foods}
        activeFood={activeFood}
        activeFoodIndex={activeFoodIndex}
        onActiveFoodIndexChange={setActiveFoodIndex}
        servingSizeInputs={servingSizeInputs}
        onServingSizeInputChange={setServingSizeInputs}
      />
      <FoodDetailsSection food={activeFood || result} />
    </div>
  )
}

export default memo(ResultsPanel)

import { memo } from 'react'
import { Utensils } from 'lucide-react'
import FoodDetailsSection from './FoodDetailsSection'
import NutritionSection from './NutritionSection'
import ResultsHeaderCard from './ResultsHeaderCard'
import ResultsSkeleton from './ResultsSkeleton'

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

  return (
    <div className="space-y-6">
      <ResultsHeaderCard result={result} capturedImage={capturedImage} />
      <NutritionSection result={result} />
      <FoodDetailsSection result={result} />
    </div>
  )
}

export default memo(ResultsPanel)

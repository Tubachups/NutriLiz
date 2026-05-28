import {
  AlertTriangle,
  ChefHat,
  Info,
  Leaf,
  Target,
  UtensilsCrossed,
} from 'lucide-react'

function DietaryInfoCard({ dietaryInfo }) {
  if (!dietaryInfo) {
    return null
  }

  return (
    <div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          Dietary Information
        </h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {dietaryInfo.is_vegetarian && <span className="badge badge-success gap-1">Vegetarian</span>}
          {dietaryInfo.is_vegan && <span className="badge badge-success gap-1">Vegan</span>}
          {dietaryInfo.is_gluten_free && <span className="badge badge-info gap-1">Gluten-Free</span>}
          {dietaryInfo.is_dairy_free && <span className="badge badge-info gap-1">Dairy-Free</span>}
          {!dietaryInfo.is_vegetarian && <span className="badge badge-ghost gap-1">Contains Meat</span>}
          {!dietaryInfo.is_gluten_free && <span className="badge badge-ghost gap-1">Contains Gluten</span>}
          {!dietaryInfo.is_dairy_free && <span className="badge badge-ghost gap-1">Contains Dairy</span>}
        </div>
      </div>
    </div>
  )
}

function ListCard({ title, items, tone, icon, marker }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="card bg-white shadow-md rounded-md">
      <div className="card-body">
        <h3 className={`card-title text-lg flex items-center gap-2 ${tone}`}>
          {icon}
          {title}
        </h3>
        <ul className="space-y-2 mt-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className={`${tone} mt-0.5`}>{marker}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AllergensAlert({ allergens }) {
  if (!allergens || allergens.length === 0) {
    return null
  }

  return (
    <div className="alert alert-warning bg-white">
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
          {allergens.map((allergen, index) => (
            <span key={index} className="badge badge-warning">{allergen}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function IngredientsCard({ ingredients }) {
  if (!ingredients || ingredients.length === 0) {
    return null
  }

  return (
    <>
      <div className="card bg-white shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Ingredients
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {ingredients.map((ingredient, index) => (
              <span key={index} className="badge badge-outline">{ingredient}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 -mt-3">
        <p className="text-xs text-amber-700 italic flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Note: This list is based on image recognition and may not include all ingredients. Some ingredients may not be
          visible or identifiable from the captured image.
        </p>
      </div>
    </>
  )
}

function PreparationCard({ preparationNotes }) {
  if (!preparationNotes) {
    return null
  }

  return (
    <div className="card bg-white shadow-md">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          Preparation
        </h3>
        <p className="text-base-content/80">{preparationNotes}</p>
      </div>
    </div>
  )
}

function PersonalizedAdviceCard({ advice }) {
  if (!advice) {
    return null
  }

  return (
    <div className="card bg-linear-to-r from-primary to-secondary text-primary-content shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Personalized Advice
        </h3>
        <p>{advice}</p>
      </div>
    </div>
  )
}

function MedicalDisclaimer() {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
      <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-700 italic leading-relaxed">
        This app is a tool only. Always consult your health professional for advice and to ensure your safety.
      </p>
    </div>
  )
}

function FoodDetailsSection({ food }) {
  const hasDietaryInfo = Boolean(food?.dietary_info)
  const hasInsightCards = Boolean(
    (food?.health_benefits && food.health_benefits.length > 0)
      || (food?.potential_concerns && food.potential_concerns.length > 0)
  )

  return (
    <>
      {hasDietaryInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DietaryInfoCard dietaryInfo={food?.dietary_info} />
        </div>
      )}

      {hasInsightCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard
            title="Health Benefits"
            items={food?.health_benefits}
            tone="text-success"
            icon={(
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            marker="✓"
          />
          <ListCard
            title="Potential Concerns"
            items={food?.potential_concerns}
            tone="text-warning"
            icon={<AlertTriangle className="w-5 h-5" />}
            marker="!"
          />
        </div>
      )}

      <AllergensAlert allergens={food?.allergens} />
      <IngredientsCard ingredients={food?.ingredients_if_dish} />
      <PreparationCard preparationNotes={food?.preparation_notes} />
      <PersonalizedAdviceCard advice={food?.personalized_advice} />
      <MedicalDisclaimer />
    </>
  )
}

export default FoodDetailsSection

const NutritionInfo = ({ nutritionData }) => {
  return (
    <section className="bg-secondary/30 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">🥗 Nutrition (per 100g / per serving)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Energy:</strong>
          <span>{nutritionData.energy_kcal_100g} kcal / {nutritionData.energy_kcal_serving} kcal</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Carbohydrates:</strong>
          <span>{nutritionData.carbohydrates_100g}g / {nutritionData.carbohydrates_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Sugars:</strong>
          <span>{nutritionData.sugars_100g}g / {nutritionData.sugars_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Fat:</strong>
          <span>{nutritionData.fat_100g}g / {nutritionData.fat_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Saturated Fat:</strong>
          <span>{nutritionData.saturated_fat_100g}g / {nutritionData.saturated_fat_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Fiber:</strong>
          <span>{nutritionData.fiber_100g}g / {nutritionData.fiber_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Proteins:</strong>
          <span>{nutritionData.proteins_100g}g / {nutritionData.proteins_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Salt:</strong>
          <span>{nutritionData.salt_100g}g / {nutritionData.salt_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Sodium:</strong>
          <span>{nutritionData.sodium_100g}g / {nutritionData.sodium_serving}g</span>
        </div>
        <div className="flex justify-between items-center bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Calcium:</strong>
          <span>{nutritionData.calcium_100g}g / {nutritionData.calcium_serving}g</span>
        </div>
      </div>
    </section>
  )
}

export default NutritionInfo
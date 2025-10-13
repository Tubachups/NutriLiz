const NutritionInfo = ({ nutritionData }) => {
  return (
    <section>
      <h3>Nutrition (per 100g / per serving)</h3>
      <p><strong>Energy:</strong> {nutritionData.energy_kcal_100g} kcal / {nutritionData.energy_kcal_serving} kcal</p>
      <p><strong>Carbohydrates:</strong> {nutritionData.carbohydrates_100g}g / {nutritionData.carbohydrates_serving}g</p>
      <p><strong>Sugars:</strong> {nutritionData.sugars_100g}g / {nutritionData.sugars_serving}g</p>
      <p><strong>Fat:</strong> {nutritionData.fat_100g}g / {nutritionData.fat_serving}g</p>
      <p><strong>Saturated Fat:</strong> {nutritionData.saturated_fat_100g}g / {nutritionData.saturated_fat_serving}g</p>
      <p><strong>Fiber:</strong> {nutritionData.fiber_100g}g / {nutritionData.fiber_serving}g</p>
      <p><strong>Proteins:</strong> {nutritionData.proteins_100g}g / {nutritionData.proteins_serving}g</p>
      <p><strong>Salt:</strong> {nutritionData.salt_100g}g / {nutritionData.salt_serving}g</p>
      <p><strong>Sodium:</strong> {nutritionData.sodium_100g}g / {nutritionData.sodium_serving}g</p>
      <p><strong>Calcium:</strong> {nutritionData.calcium_100g}g / {nutritionData.calcium_serving}g</p>
    </section>
  )
}

export default NutritionInfo
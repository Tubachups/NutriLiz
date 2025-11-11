import ProductHeader from './ProductHeader'
import GeneralInfo from './GeneralInfo'
import NutritionInfo from './NutritionInfo'
import ScoresInfo from './ScoreInfo'
import LabelsInfo from './LabelInfo'


const ProductCard = ({ productData }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-accent">
      <ProductHeader 
        imageUrl={productData.image_url}
        name={productData.name}
      />

      <div className="p-6 space-y-6">
        <GeneralInfo
          type={productData.type}
          manufacturingPlaces={productData.manufacturing_places}
          quantity={productData.quantity}
          ingredientsText={productData.ingredients_text}
        />

        <NutritionInfo nutritionData={productData} />

        <ScoresInfo
          nutriScore={productData.nutri_score}
          nutriGrade={productData.nutri_grade}
          novaGroup={productData.nova_group}
          ecoscoreGrade={productData.ecoscore_grade}
          ecoscoreScore={productData.ecoscore_score}
        />

        <LabelsInfo
          labels={productData.labels}
          labelsTags={productData.labels_tags}
          awards={productData.awards}
        />

        
      </div>
    </div>
  )
}

export default ProductCard
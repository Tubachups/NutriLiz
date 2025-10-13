import ProductHeader from './ProductHeader'
import GeneralInfo from './GeneralInfo'
import NutritionInfo from './NutritionInfo'
import ScoresInfo from './ScoreInfo'
import LabelsInfo from './LabelInfo'

const ProductCard = ({ productData }) => {
  return (
    <div className="product-card">
      <ProductHeader 
        imageUrl={productData.image_url}
        name={productData.name}
      />

      <GeneralInfo
        type={productData.type}
        manufacturingPlaces={productData.manufacturing_places}
        quantity={productData.quantity}
        servingQuantity={productData.serving_quantity}
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
  )
}

export default ProductCard